// src/services/order/order.service.js

'use strict';

const { ObjectId } = require('mongodb');
const {
    ORDER_STATUS,
    STATUS_GROUPS,
    STATUS_TIMEOUTS,
    CANCELLATION_REASONS,
    FAILURE_REASONS,
    canTransition,
    getStatusTimeout,
    isStatusExpired,
    isFinalStatus,
    isActiveStatus,
    isCancellable,
    hasMaster
} = require('../../utils/constants/order-status');
const {
    SERVICE_TYPES,
    SERVICE_METADATA,
    getServiceMetadata,
    calculateServicePrice,
    getServiceSearchRadius
} = require('../../utils/constants/service-types');
const {
    USER_ROLES,
    hasPermission,
    canExecuteOrders
} = require('../../utils/constants/user-roles');
const { AppError, BusinessError, ValidationError } = require('../../utils/errors/app-error');
const { EVENT_TYPES } = require('../../queues/publishers/event.publisher');
const { HISTORY_EVENT_TYPES } = require('../../models/order-history.model');

/**
 * Основной сервис для управления заказами
 * Координирует весь жизненный цикл заказа от создания до завершения
 */
class OrderService {
    constructor(
        orderModel,
        userModel,
        masterModel,
        vehicleModel,
        serviceModel,
        orderHistoryModel,
        matchingService,
        pricingService,
        paymentService,
        commissionService,
        notificationService,
        geoService,
        surgeService,
        cacheService,
        eventPublisher,
        orderPublisher,
        redis,
        logger
    ) {
        // Модели
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.masterModel = masterModel;
        this.vehicleModel = vehicleModel;
        this.serviceModel = serviceModel;
        this.orderHistoryModel = orderHistoryModel;

        // Сервисы
        this.matchingService = matchingService;
        this.pricingService = pricingService;
        this.paymentService = paymentService;
        this.commissionService = commissionService;
        this.notificationService = notificationService;
        this.geoService = geoService;
        this.surgeService = surgeService;
        this.cache = cacheService;

        // Очереди и события
        this.eventPublisher = eventPublisher;
        this.orderPublisher = orderPublisher;

        // Инфраструктура
        this.redis = redis;
        this.logger = logger;

        // Конфигурация
        this.config = {
            // Лимиты
            limits: {
                maxActiveOrdersPerClient: 3,
                maxDailyOrdersPerClient: 10,
                maxSearchAttempts: 5,
                maxReassignments: 3
            },

            // Таймауты
            timeouts: {
                ...STATUS_TIMEOUTS,
                searchExpansionInterval: 60000, // 1 минута между расширениями
                masterNotificationTTL: 30000    // 30 секунд на ответ мастера
            },

            // Настройки поиска
            search: {
                initialRadius: 5000,            // 5 км
                maxRadius: 30000,               // 30 км
                radiusExpansionStep: 5000,      // 5 км
                minMastersToNotify: 1,
                maxMastersToNotify: 10,
                prioritizeFavorites: true
            },

            // Настройки отмены
            cancellation: {
                freeMinutes: 5,                 // Бесплатная отмена в первые 5 минут
                penaltyPercentage: 10,          // 10% штраф за позднюю отмену
                maxPenalty: 50000               // Максимальный штраф 50k сум
            },

            // Кэширование
            cache: {
                orderTTL: 300,                  // 5 минут
                searchResultsTTL: 60            // 1 минута
            }
        };

        // Инициализация обработчиков статусов
        this.statusHandlers = this.initializeStatusHandlers();

        // Статистика
        this.stats = {
            created: 0,
            completed: 0,
            cancelled: 0,
            failed: 0,
            searching: 0
        };
    }

    /**
     * Создание нового заказа
     */
    async createOrder(orderData, userId) {
        try {
            // Начинаем транзакцию Redis для атомарности
            const lockKey = `order:create:${userId}`;
            const lock = await this.redis.set(lockKey, '1', 'EX', 10, 'NX');

            if (!lock) {
                throw new BusinessError(
                    'Another order is being created',
                    'ORDER_CREATION_IN_PROGRESS',
                    429
                );
            }

            try {
                // Валидация пользователя
                const user = await this.validateUser(userId);

                // Проверка лимитов
                await this.checkUserOrderLimits(userId);

                // Валидация данных заказа
                const validatedData = await this.validateOrderData(orderData, user);

                // Валидация автомобиля
                const vehicle = await this.validateVehicle(
                    validatedData.vehicleId,
                    userId
                );

                // Валидация услуги
                const service = await this.validateService(
                    validatedData.serviceType,
                    validatedData.serviceOptions
                );

                // Валидация локации
                const locationValidation = await this.geoService.validation.validateLocation(
                    validatedData.location,
                    { serviceType: validatedData.serviceType }
                );

                if (!locationValidation.valid) {
                    throw new ValidationError(
                        'Invalid location',
                        locationValidation.errors
                    );
                }

                // Расчет стоимости
                const pricing = await this.calculateOrderPricing({
                    serviceType: validatedData.serviceType,
                    serviceOptions: validatedData.serviceOptions,
                    location: validatedData.location,
                    distance: validatedData.estimatedDistance,
                    urgency: validatedData.urgency,
                    scheduledFor: validatedData.scheduledFor
                });

                // Создаем заказ
                const order = await this.orderModel.create({
                    type: validatedData.scheduledFor ? 'scheduled' : 'immediate',
                    source: validatedData.source || 'mobile_app',
                    priority: this.determinePriority(validatedData),
                    status: ORDER_STATUS.NEW,

                    customer: {
                        userId: user._id,
                        name: `${user.name.first} ${user.name.last}`,
                        phone: user.phone,
                        rating: user.clientData?.rating || 0,
                        ordersCount: user.clientData?.ordersCount || 0,
                        isVip: user.clientData?.isVip || false,
                        device: validatedData.device
                    },

                    vehicle: {
                        vehicleId: vehicle._id,
                        brand: vehicle.brand,
                        model: vehicle.model,
                        year: vehicle.year,
                        plateNumber: vehicle.registration.plateNumber,
                        color: vehicle.specifications.color,
                        displayName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
                    },

                    service: {
                        serviceId: service._id,
                        code: service.code,
                        name: service.name[user.language || 'ru'],
                        category: service.category,
                        options: validatedData.serviceOptions || [],
                        description: validatedData.description,
                        media: validatedData.media || []
                    },

                    location: {
                        pickup: {
                            address: validatedData.location.address,
                            coordinates: {
                                type: 'Point',
                                coordinates: [
                                    validatedData.location.coordinates.lng,
                                    validatedData.location.coordinates.lat
                                ]
                            },
                            isVerified: locationValidation.verified || false
                        },
                        destination: validatedData.destination || null,
                        route: {
                            distance: validatedData.estimatedDistance || 0,
                            duration: validatedData.estimatedDuration || 0
                        }
                    },

                    timing: {
                        scheduledFor: validatedData.scheduledFor,
                        scheduledDuration: service.timing?.estimatedDuration || 60,
                        createdAt: new Date()
                    },

                    pricing: {
                        calculation: pricing,
                        payment: {
                            method: validatedData.paymentMethod || 'cash',
                            status: 'pending'
                        }
                    },

                    search: {
                        criteria: {
                            serviceType: service.code,
                            requiredSkills: service.requirements?.skills || [],
                            preferredMasterIds: validatedData.preferredMasterIds || [],
                            excludedMasterIds: [],
                            radius: this.config.search.initialRadius,
                            maxRadius: getServiceSearchRadius(service.code)
                        }
                    },

                    metadata: {
                        source: validatedData.source,
                        referrer: validatedData.referrer,
                        customData: validatedData.metadata
                    }
                });

                // Записываем в историю
                await this.recordHistory(order._id, HISTORY_EVENT_TYPES.ORDER_CREATED, {
                    actor: {
                        type: 'user',
                        id: userId,
                        role: USER_ROLES.CLIENT
                    }
                });

                // Публикуем событие
                await this.eventPublisher.publish(EVENT_TYPES.ORDER_CREATED, {
                    orderId: order._id,
                    userId,
                    serviceType: service.code,
                    location: order.location.pickup.coordinates.coordinates,
                    amount: pricing.total
                });

                // Отправляем уведомление
                await this.notificationService.create({
                    type: 'order_created',
                    recipientId: userId,
                    data: {
                        orderId: order._id,
                        orderNumber: order.orderNumber
                    }
                });

                // Обновляем статистику
                this.stats.created++;

                // Инициируем поиск мастера для срочных заказов
                if (!validatedData.scheduledFor) {
                    setImmediate(() => {
                        this.startMasterSearch(order._id).catch(err => {
                            this.logger.error({
                                orderId: order._id,
                                error: err.message
                            }, 'Failed to start master search');
                        });
                    });
                }

                // Кэшируем заказ
                await this.cache.set(
                    `order:${order._id}`,
                    order,
                    { ttl: this.config.cache.orderTTL }
                );

                return order;

            } finally {
                // Освобождаем блокировку
                await this.redis.del(lockKey);
            }

        } catch (error) {
            this.logger.error({
                userId,
                orderData,
                error: error.message
            }, 'Failed to create order');

            throw error;
        }
    }

    /**
     * Начало поиска мастера
     */
    async startMasterSearch(orderId) {
        try {
            const order = await this.getOrder(orderId);

            if (order.status !== ORDER_STATUS.NEW) {
                throw new BusinessError(
                    'Order is not in NEW status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.SEARCHING, {
                actorType: 'system'
            });

            // Запускаем процесс поиска
            await this.orderPublisher.publishSearchRequest({
                orderId,
                attempt: 1,
                radius: order.search.criteria.radius
            });

            // Устанавливаем таймер на истечение поиска
            const timeout = getStatusTimeout(ORDER_STATUS.SEARCHING);
            setTimeout(() => {
                this.handleSearchTimeout(orderId).catch(err => {
                    this.logger.error({
                        orderId,
                        error: err.message
                    }, 'Failed to handle search timeout');
                });
            }, timeout);

        } catch (error) {
            this.logger.error({
                orderId,
                error: error.message
            }, 'Failed to start master search');

            throw error;
        }
    }

    /**
     * Обработка результатов поиска мастеров
     */
    async processMasterSearchResults(orderId, searchResults) {
        try {
            const order = await this.getOrder(orderId);

            if (order.status !== ORDER_STATUS.SEARCHING) {
                return; // Заказ уже не в поиске
            }

            const { attempt, candidates } = searchResults;

            // Записываем попытку поиска
            await this.orderModel.addSearchAttempt(orderId, {
                attemptNumber: attempt,
                radius: searchResults.radius,
                candidates: candidates.map(c => ({
                    executorId: c.masterId,
                    executorType: 'master',
                    distance: c.distance,
                    eta: c.eta,
                    rating: c.rating,
                    price: c.estimatedPrice,
                    score: c.score
                })),
                notifiedCount: 0,
                result: candidates.length > 0 ? 'found' : 'empty'
            });

            if (candidates.length === 0) {
                // Нет кандидатов, расширяем поиск
                await this.expandSearch(orderId, attempt);
                return;
            }

            // Фильтруем и сортируем кандидатов
            const eligibleCandidates = await this.filterCandidates(order, candidates);

            if (eligibleCandidates.length === 0) {
                await this.expandSearch(orderId, attempt);
                return;
            }

            // Уведомляем мастеров
            const notificationResults = await this.notifyMasters(
                order,
                eligibleCandidates
            );

            // Обновляем статистику поиска
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $inc: {
                        'search.stats.totalCandidates': candidates.length,
                        'search.stats.notifiedCount': notificationResults.notified
                    }
                }
            );

            // Если никто не был уведомлен, расширяем поиск
            if (notificationResults.notified === 0) {
                await this.expandSearch(orderId, attempt);
            }

        } catch (error) {
            this.logger.error({
                orderId,
                searchResults,
                error: error.message
            }, 'Failed to process search results');

            throw error;
        }
    }

    /**
     * Назначение мастера на заказ
     */
    async assignMaster(orderId, masterId, options = {}) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация статуса
            if (!canTransition(order.status, ORDER_STATUS.ASSIGNED)) {
                throw new BusinessError(
                    `Cannot assign master in status ${order.status}`,
                    'INVALID_STATUS_TRANSITION',
                    400
                );
            }

            // Валидация мастера
            const master = await this.masterModel.findById(masterId);
            if (!master || master.status !== 'active') {
                throw new BusinessError(
                    'Master not found or inactive',
                    'INVALID_MASTER',
                    400
                );
            }

            // Проверка доступности мастера
            const availability = await this.masterModel.checkAvailability(masterId);
            if (!availability.available) {
                throw new BusinessError(
                    `Master is not available: ${availability.reason}`,
                    'MASTER_NOT_AVAILABLE',
                    400
                );
            }

            // Расчет ETA
            const route = await this.geoService.calculateRoute(
                master.currentState.location.coordinates.coordinates,
                order.location.pickup.coordinates.coordinates
            );

            // Назначаем мастера
            const assignmentData = {
                type: 'master',
                masterId: master._id,
                masterName: `${master.personal.firstName} ${master.personal.lastName}`,
                masterPhone: master.personal.phone,
                masterRating: master.rating.overall.score,
                method: options.method || 'auto',
                distance: route.distance,
                eta: route.eta.minutes
            };

            await this.orderModel.assignExecutor(orderId, assignmentData);

            // Обновляем статус заказа
            await this.updateOrderStatus(orderId, ORDER_STATUS.ASSIGNED, {
                actorType: options.actorType || 'system',
                actorId: options.actorId
            });

            // Уведомляем мастера о назначении
            await this.notificationService.create({
                type: 'order_assigned',
                recipientId: master.userId,
                priority: 'high',
                data: {
                    orderId,
                    customer: order.customer,
                    service: order.service,
                    location: order.location.pickup,
                    eta: route.eta
                }
            });

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'master_assigned',
                recipientId: order.customer.userId,
                data: {
                    orderId,
                    master: {
                        id: master._id,
                        name: assignmentData.masterName,
                        rating: assignmentData.masterRating,
                        eta: route.eta.minutes
                    }
                }
            });

            // Публикуем событие
            await this.eventPublisher.publish(EVENT_TYPES.ORDER_ASSIGNED, {
                orderId,
                masterId,
                eta: route.eta.minutes
            });

            // Запускаем таймер на принятие заказа
            const timeout = getStatusTimeout(ORDER_STATUS.ASSIGNED);
            setTimeout(() => {
                this.handleAssignmentTimeout(orderId, masterId).catch(err => {
                    this.logger.error({
                        orderId,
                        masterId,
                        error: err.message
                    }, 'Failed to handle assignment timeout');
                });
            }, timeout);

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                error: error.message
            }, 'Failed to assign master');

            throw error;
        }
    }

    /**
     * Принятие заказа мастером
     */
    async acceptOrder(orderId, masterId) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.ASSIGNED) {
                throw new BusinessError(
                    'Order is not in ASSIGNED status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            if (order.executor.masterId?.toString() !== masterId.toString()) {
                throw new BusinessError(
                    'Master is not assigned to this order',
                    'MASTER_NOT_ASSIGNED',
                    403
                );
            }

            // Обновляем данные исполнителя
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'executor.acceptedAt': new Date(),
                        'executor.responseTime':
                            (Date.now() - new Date(order.executor.assignedAt).getTime()) / 1000
                    }
                }
            );

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED, {
                actorType: 'master',
                actorId: masterId
            });

            // Назначаем заказ мастеру в его модели
            await this.masterModel.assignOrder(masterId, {
                orderId,
                estimatedDuration: order.timing.scheduledDuration,
                scheduledTime: order.timing.scheduledFor
            });

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'order_accepted',
                recipientId: order.customer.userId,
                priority: 'high',
                data: {
                    orderId,
                    masterName: order.executor.masterName
                }
            });

            // Публикуем событие
            await this.eventPublisher.publish(EVENT_TYPES.ORDER_ACCEPTED, {
                orderId,
                masterId
            });

            // Запускаем таймер на начало движения
            const timeout = getStatusTimeout(ORDER_STATUS.ACCEPTED);
            setTimeout(() => {
                this.checkMasterMovement(orderId, masterId).catch(err => {
                    this.logger.error({
                        orderId,
                        masterId,
                        error: err.message
                    }, 'Failed to check master movement');
                });
            }, timeout);

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                error: error.message
            }, 'Failed to accept order');

            throw error;
        }
    }

    /**
     * Отклонение заказа мастером
     */
    async rejectOrder(orderId, masterId, reason) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.ASSIGNED) {
                throw new BusinessError(
                    'Order is not in ASSIGNED status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            if (order.executor.masterId?.toString() !== masterId.toString()) {
                throw new BusinessError(
                    'Master is not assigned to this order',
                    'MASTER_NOT_ASSIGNED',
                    403
                );
            }

            // Обновляем данные исполнителя
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'executor.rejectedAt': new Date(),
                        'executor.rejectionReason': reason
                    },
                    $push: {
                        'search.criteria.excludedMasterIds': masterId
                    }
                }
            );

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.REJECTED, {
                actorType: 'master',
                actorId: masterId,
                reason
            });

            // Возвращаем к поиску
            await this.updateOrderStatus(orderId, ORDER_STATUS.SEARCHING, {
                actorType: 'system'
            });

            // Записываем в историю мастера
            await this.recordHistory(orderId, HISTORY_EVENT_TYPES.MASTER_REJECTED, {
                actor: {
                    type: 'master',
                    id: masterId
                },
                details: { reason }
            });

            // Продолжаем поиск
            await this.orderPublisher.publishSearchRequest({
                orderId,
                attempt: order.search.attempts.length + 1,
                radius: order.search.criteria.radius,
                isRetry: true
            });

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                reason,
                error: error.message
            }, 'Failed to reject order');

            throw error;
        }
    }

    /**
     * Начало движения мастера
     */
    async startMasterMovement(orderId, masterId) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.ACCEPTED) {
                throw new BusinessError(
                    'Order is not in ACCEPTED status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.EN_ROUTE, {
                actorType: 'master',
                actorId: masterId
            });

            // Начинаем трекинг
            await this.geoService.startOrderTracking(orderId, {
                updateInterval: 10000, // 10 секунд
                includeETA: true,
                includeRoute: true
            });

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'master_en_route',
                recipientId: order.customer.userId,
                priority: 'high',
                data: {
                    orderId,
                    tracking: {
                        enabled: true
                    }
                }
            });

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                error: error.message
            }, 'Failed to start master movement');

            throw error;
        }
    }

    /**
     * Прибытие мастера
     */
    async confirmMasterArrival(orderId, masterId, location) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.EN_ROUTE) {
                throw new BusinessError(
                    'Order is not in EN_ROUTE status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            // Проверяем расстояние до клиента
            const distance = await this.geoService.calculateDistance(
                location,
                order.location.pickup.coordinates.coordinates
            );

            if (distance > 500) { // 500 метров
                throw new BusinessError(
                    'Master is too far from pickup location',
                    'MASTER_TOO_FAR',
                    400,
                    { distance }
                );
            }

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.ARRIVED, {
                actorType: 'master',
                actorId: masterId
            });

            // Останавливаем трекинг
            await this.geoService.stopOrderTracking(orderId);

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'master_arrived',
                recipientId: order.customer.userId,
                priority: 'critical',
                data: {
                    orderId,
                    masterName: order.executor.masterName
                }
            });

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                location,
                error: error.message
            }, 'Failed to confirm master arrival');

            throw error;
        }
    }

    /**
     * Начало работы
     */
    async startWork(orderId, masterId) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.ARRIVED) {
                throw new BusinessError(
                    'Order is not in ARRIVED status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.IN_PROGRESS, {
                actorType: 'master',
                actorId: masterId
            });

            // Записываем время начала работы
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'timing.startedAt': new Date()
                    }
                }
            );

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'work_started',
                recipientId: order.customer.userId,
                data: {
                    orderId,
                    estimatedDuration: order.timing.scheduledDuration
                }
            });

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                error: error.message
            }, 'Failed to start work');

            throw error;
        }
    }

    /**
     * Завершение заказа
     */
    async completeOrder(orderId, masterId, completionData) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.IN_PROGRESS) {
                throw new BusinessError(
                    'Order is not in IN_PROGRESS status',
                    'INVALID_ORDER_STATUS',
                    400
                );
            }

            // Валидация данных завершения
            const { finalPrice, workPerformed, photos } = completionData;

            if (!workPerformed || workPerformed.length === 0) {
                throw new ValidationError('Work performed details are required');
            }

            // Рассчитываем длительность работы
            const workDuration = Date.now() - new Date(order.timing.startedAt).getTime();

            // Обновляем данные заказа
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'completion': {
                            workPerformed,
                            photos: photos || [],
                            masterNotes: completionData.notes,
                            finalPrice: finalPrice || order.pricing.calculation.total,
                            completedAt: new Date()
                        },
                        'timing.durations.work': Math.round(workDuration / 1000),
                        'timing.durations.total': Math.round(
                            (Date.now() - new Date(order.timing.createdAt).getTime()) / 1000
                        )
                    }
                }
            );

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.COMPLETED, {
                actorType: 'master',
                actorId: masterId
            });

            // Обновляем статистику мастера
            await this.masterModel.updateOrderStatistics(masterId, {
                status: 'completed',
                totalAmount: finalPrice || order.pricing.calculation.total,
                commission: order.pricing.calculation.commission,
                distance: order.location.route.distance,
                duration: workDuration / 1000,
                serviceType: order.service.code,
                customerId: order.customer.userId
            });

            // Завершаем заказ у мастера
            await this.masterModel.completeOrder(masterId, orderId);

            // Обрабатываем платеж если наличный
            if (order.pricing.payment.method === 'cash') {
                await this.paymentService.confirmCashPayment(
                    order.pricing.payment.paymentId,
                    {
                        masterId,
                        location: completionData.completionLocation,
                        signature: completionData.paymentSignature
                    }
                );
            }

            // Начисляем комиссию
            await this.commissionService.processOrderCommission(
                orderId,
                finalPrice || order.pricing.calculation.total,
                masterId
            );

            // Уведомляем клиента
            await this.notificationService.create({
                type: 'order_completed',
                recipientId: order.customer.userId,
                priority: 'high',
                data: {
                    orderId,
                    finalPrice: finalPrice || order.pricing.calculation.total,
                    canRate: true
                }
            });

            // Публикуем событие
            await this.eventPublisher.publish(EVENT_TYPES.ORDER_COMPLETED, {
                orderId,
                masterId,
                amount: finalPrice || order.pricing.calculation.total
            });

            // Обновляем статистику
            this.stats.completed++;

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                masterId,
                completionData,
                error: error.message
            }, 'Failed to complete order');

            throw error;
        }
    }

    /**
     * Отмена заказа
     */
    async cancelOrder(orderId, cancelledBy, reason, role) {
        try {
            const order = await this.getOrder(orderId);

            // Проверка возможности отмены
            if (!isCancellable(order.status)) {
                throw new BusinessError(
                    `Cannot cancel order in status ${order.status}`,
                    'ORDER_NOT_CANCELLABLE',
                    400
                );
            }

            // Валидация причины
            const validReason = this.validateCancellationReason(reason, role);

            // Расчет штрафа за отмену
            const penalty = await this.calculateCancellationPenalty(order, role);

            // Обновляем данные отмены
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'cancellation': {
                            reason: validReason,
                            cancelledBy,
                            cancelledByRole: role,
                            penalty,
                            cancelledAt: new Date()
                        }
                    }
                }
            );

            // Обновляем статус
            await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
                actorType: role === USER_ROLES.CLIENT ? 'user' : 'master',
                actorId: cancelledBy,
                reason: validReason
            });

            // Освобождаем мастера если был назначен
            if (hasMaster(order.status) && order.executor.masterId) {
                await this.masterModel.completeOrder(
                    order.executor.masterId,
                    orderId
                );

                // Уведомляем мастера
                await this.notificationService.create({
                    type: 'order_cancelled',
                    recipientId: order.executor.masterId,
                    data: {
                        orderId,
                        reason: validReason,
                        cancelledBy: role
                    }
                });
            }

            // Останавливаем трекинг если активен
            if (order.location.tracking?.isActive) {
                await this.geoService.stopOrderTracking(orderId);
            }

            // Обрабатываем возврат платежа если нужно
            if (order.pricing.payment.status === 'completed' && penalty < order.pricing.calculation.total) {
                const refundAmount = order.pricing.calculation.total - penalty;
                await this.paymentService.createRefund(
                    order.pricing.payment.paymentId,
                    {
                        amount: refundAmount,
                        reason: `Order cancelled: ${validReason}`
                    }
                );
            }

            // Применяем штраф если есть
            if (penalty > 0 && role === USER_ROLES.CLIENT) {
                await this.applyPenalty(order.customer.userId, penalty, orderId);
            }

            // Уведомляем участников
            const notificationRecipient = role === USER_ROLES.CLIENT ?
                order.executor?.masterId : order.customer.userId;

            if (notificationRecipient) {
                await this.notificationService.create({
                    type: 'order_cancelled',
                    recipientId: notificationRecipient,
                    data: {
                        orderId,
                        reason: validReason,
                        cancelledBy: role,
                        penalty: penalty > 0 ? penalty : null
                    }
                });
            }

            // Публикуем событие
            await this.eventPublisher.publish(EVENT_TYPES.ORDER_CANCELLED, {
                orderId,
                reason: validReason,
                cancelledBy,
                role,
                penalty
            });

            // Обновляем статистику
            this.stats.cancelled++;

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                cancelledBy,
                reason,
                role,
                error: error.message
            }, 'Failed to cancel order');

            throw error;
        }
    }

    /**
     * Получение заказа
     */
    async getOrder(orderId) {
        // Проверяем кэш
        const cached = await this.cache.get(`order:${orderId}`);
        if (cached) {
            return cached;
        }

        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new BusinessError(
                'Order not found',
                'ORDER_NOT_FOUND',
                404
            );
        }

        // Кэшируем
        await this.cache.set(
            `order:${orderId}`,
            order,
            { ttl: this.config.cache.orderTTL }
        );

        return order;
    }

    /**
     * Получение списка заказов
     */
    async getOrders(filters = {}, options = {}) {
        const {
            userId,
            masterId,
            status,
            serviceType,
            dateFrom,
            dateTo
        } = filters;

        const {
            limit = 20,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = -1
        } = options;

        const query = {};

        if (userId) {
            query['customer.userId'] = new ObjectId(userId);
        }

        if (masterId) {
            query['executor.masterId'] = new ObjectId(masterId);
        }

        if (status) {
            if (Array.isArray(status)) {
                query.status = { $in: status };
            } else if (STATUS_GROUPS[status]) {
                query.status = { $in: STATUS_GROUPS[status] };
            } else {
                query.status = status;
            }
        }

        if (serviceType) {
            query['service.code'] = serviceType;
        }

        if (dateFrom || dateTo) {
            query['timing.createdAt'] = {};
            if (dateFrom) query['timing.createdAt'].$gte = new Date(dateFrom);
            if (dateTo) query['timing.createdAt'].$lte = new Date(dateTo);
        }

        const orders = await this.orderModel.collection
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(offset)
            .limit(limit)
            .toArray();

        const total = await this.orderModel.collection.countDocuments(query);

        return {
            orders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + orders.length < total
            }
        };
    }

    /**
     * Добавление оценки к заказу
     */
    async rateOrder(orderId, userId, rating, role = USER_ROLES.CLIENT) {
        try {
            const order = await this.getOrder(orderId);

            // Валидация
            if (order.status !== ORDER_STATUS.COMPLETED) {
                throw new BusinessError(
                    'Can only rate completed orders',
                    'ORDER_NOT_COMPLETED',
                    400
                );
            }

            // Проверка прав
            if (role === USER_ROLES.CLIENT && order.customer.userId.toString() !== userId.toString()) {
                throw new BusinessError(
                    'Not authorized to rate this order',
                    'UNAUTHORIZED',
                    403
                );
            }

            if (role === USER_ROLES.MASTER && order.executor.masterId?.toString() !== userId.toString()) {
                throw new BusinessError(
                    'Not authorized to rate this order',
                    'UNAUTHORIZED',
                    403
                );
            }

            // Добавляем отзыв
            await this.orderModel.addFeedback(orderId, {
                from: role === USER_ROLES.CLIENT ? 'customer' : 'executor',
                rating: rating.score,
                comment: rating.comment,
                categories: rating.categories,
                tags: rating.tags
            });

            // Обновляем рейтинг мастера
            if (role === USER_ROLES.CLIENT && order.executor.masterId) {
                await this.masterModel.updateRating(order.executor.masterId, {
                    orderId,
                    rating: rating.score,
                    comment: rating.comment,
                    categories: rating.categories,
                    customerId: order.customer.userId,
                    customerName: order.customer.name,
                    serviceType: order.service.code
                });
            }

            // Обновляем рейтинг клиента
            if (role === USER_ROLES.MASTER) {
                // TODO: Implement client rating update
            }

            // Публикуем событие
            await this.eventPublisher.publish(EVENT_TYPES.ORDER_RATED, {
                orderId,
                ratedBy: userId,
                role,
                rating: rating.score
            });

            return await this.getOrder(orderId);

        } catch (error) {
            this.logger.error({
                orderId,
                userId,
                rating,
                role,
                error: error.message
            }, 'Failed to rate order');

            throw error;
        }
    }

    /**
     * Повторный заказ
     */
    async repeatOrder(orderId, userId) {
        try {
            const originalOrder = await this.getOrder(orderId);

            // Проверка прав
            if (originalOrder.customer.userId.toString() !== userId.toString()) {
                throw new BusinessError(
                    'Not authorized to repeat this order',
                    'UNAUTHORIZED',
                    403
                );
            }

            // Создаем новый заказ на основе старого
            const newOrderData = {
                serviceType: originalOrder.service.code,
                serviceOptions: originalOrder.service.options,
                vehicleId: originalOrder.vehicle.vehicleId,
                location: {
                    coordinates: {
                        lat: originalOrder.location.pickup.coordinates.coordinates[1],
                        lng: originalOrder.location.pickup.coordinates.coordinates[0]
                    },
                    address: originalOrder.location.pickup.address
                },
                description: originalOrder.service.description,
                paymentMethod: originalOrder.pricing.payment.method,
                preferredMasterIds: originalOrder.executor.masterId ?
                    [originalOrder.executor.masterId] : [],
                source: 'repeat_order',
                metadata: {
                    originalOrderId: orderId
                }
            };

            return await this.createOrder(newOrderData, userId);

        } catch (error) {
            this.logger.error({
                orderId,
                userId,
                error: error.message
            }, 'Failed to repeat order');

            throw error;
        }
    }

    /**
     * Вспомогательные методы
     */

    // Валидация пользователя
    async validateUser(userId) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new BusinessError(
                'User not found',
                'USER_NOT_FOUND',
                404
            );
        }

        if (user.status !== 'active') {
            throw new BusinessError(
                'User account is not active',
                'USER_NOT_ACTIVE',
                403
            );
        }

        return user;
    }

    // Проверка лимитов пользователя
    async checkUserOrderLimits(userId) {
        // Проверка активных заказов
        const activeOrders = await this.orderModel.collection.countDocuments({
            'customer.userId': new ObjectId(userId),
            status: { $in: STATUS_GROUPS.ACTIVE }
        });

        if (activeOrders >= this.config.limits.maxActiveOrdersPerClient) {
            throw new BusinessError(
                'Maximum active orders limit reached',
                'MAX_ACTIVE_ORDERS_EXCEEDED',
                429,
                { limit: this.config.limits.maxActiveOrdersPerClient, current: activeOrders }
            );
        }

        // Проверка дневного лимита
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await this.orderModel.collection.countDocuments({
            'customer.userId': new ObjectId(userId),
            'timing.createdAt': { $gte: today }
        });

        if (todayOrders >= this.config.limits.maxDailyOrdersPerClient) {
            throw new BusinessError(
                'Daily order limit reached',
                'DAILY_LIMIT_EXCEEDED',
                429,
                { limit: this.config.limits.maxDailyOrdersPerClient, current: todayOrders }
            );
        }
    }

    // Валидация данных заказа
    async validateOrderData(orderData, user) {
        // TODO: Implement comprehensive validation
        return orderData;
    }

    // Валидация автомобиля
    async validateVehicle(vehicleId, userId) {
        const vehicle = await this.vehicleModel.findById(vehicleId);

        if (!vehicle) {
            throw new BusinessError(
                'Vehicle not found',
                'VEHICLE_NOT_FOUND',
                404
            );
        }

        if (vehicle.ownerId.toString() !== userId.toString()) {
            throw new BusinessError(
                'Vehicle does not belong to user',
                'VEHICLE_NOT_OWNED',
                403
            );
        }

        if (vehicle.status !== 'active') {
            throw new BusinessError(
                'Vehicle is not active',
                'VEHICLE_NOT_ACTIVE',
                400
            );
        }

        return vehicle;
    }

    // Валидация услуги
    async validateService(serviceType, options = []) {
        const service = await this.serviceModel.findByCode(serviceType);

        if (!service) {
            throw new BusinessError(
                'Service not found',
                'SERVICE_NOT_FOUND',
                404
            );
        }

        if (service.status !== 'active') {
            throw new BusinessError(
                'Service is not available',
                'SERVICE_NOT_ACTIVE',
                400
            );
        }

        // Валидация опций
        if (options.length > 0) {
            const validOptionIds = service.options.map(opt => opt.id);
            const invalidOptions = options.filter(opt => !validOptionIds.includes(opt.id));

            if (invalidOptions.length > 0) {
                throw new ValidationError(
                    'Invalid service options',
                    { invalidOptions }
                );
            }
        }

        return service;
    }

    // Определение приоритета заказа
    determinePriority(orderData) {
        // Срочные заказы
        if (orderData.urgency === 'urgent') {
            return 'high';
        }

        // VIP клиенты
        if (orderData.customer?.isVip) {
            return 'high';
        }

        // По типу услуги
        const serviceMetadata = SERVICE_METADATA[orderData.serviceType];
        if (serviceMetadata?.priority === 'critical') {
            return 'urgent';
        }

        return 'normal';
    }

    // Расчет стоимости заказа
    async calculateOrderPricing(pricingData) {
        // Получаем базовую цену услуги
        const basePrice = calculateServicePrice(pricingData.serviceType, {
            isNight: this.isNightTime(),
            isWeekend: this.isWeekend(),
            distance: pricingData.distance
        });

        // Применяем surge pricing
        const surgeData = await this.surgeService.getCurrentSurge(
            pricingData.location.coordinates
        );

        let total = basePrice;
        if (surgeData.multiplier > 1) {
            total = Math.round(basePrice * surgeData.multiplier);
        }

        // Добавляем стоимость опций
        if (pricingData.serviceOptions) {
            for (const option of pricingData.serviceOptions) {
                if (option.price > 0) {
                    total += option.price * (option.quantity || 1);
                }
            }
        }

        // Расчет комиссии
        const commission = Math.round(total * 0.15); // 15% комиссия

        return {
            basePrice,
            surgeMultiplier: surgeData.multiplier,
            surgeAmount: total - basePrice,
            optionsAmount: total - basePrice * (surgeData.multiplier || 1),
            subtotal: total,
            commission,
            total
        };
    }

    // Обновление статуса заказа
    async updateOrderStatus(orderId, newStatus, details = {}) {
        // Обновляем в модели
        const order = await this.orderModel.updateStatus(orderId, newStatus);

        // Записываем в историю
        await this.recordHistory(orderId, HISTORY_EVENT_TYPES.STATUS_CHANGED, {
            actor: {
                type: details.actorType || 'system',
                id: details.actorId
            },
            stateChange: {
                status: {
                    from: order.status,
                    to: newStatus
                }
            }
        });

        // Вызываем обработчик статуса
        const handler = this.statusHandlers[newStatus];
        if (handler) {
            await handler(order, details);
        }

        // Инвалидируем кэш
        await this.cache.delete(`order:${orderId}`);

        return order;
    }

    // Запись в историю
    async recordHistory(orderId, eventType, eventData) {
        try {
            await this.orderHistoryModel.create({
                orderId,
                eventType,
                ...eventData
            });
        } catch (error) {
            this.logger.error({
                orderId,
                eventType,
                error: error.message
            }, 'Failed to record order history');
        }
    }

    // Фильтрация кандидатов
    async filterCandidates(order, candidates) {
        const filtered = [];

        for (const candidate of candidates) {
            // Проверяем не отклонял ли мастер заказ ранее
            if (order.search.criteria.excludedMasterIds.includes(candidate.masterId)) {
                continue;
            }

            // Проверяем рейтинг
            if (order.search.criteria.minRating &&
                candidate.rating < order.search.criteria.minRating) {
                continue;
            }

            // Проверяем доступность
            const availability = await this.masterModel.checkAvailability(candidate.masterId);
            if (!availability.available) {
                continue;
            }

            filtered.push(candidate);
        }

        return filtered;
    }

    // Уведомление мастеров
    async notifyMasters(order, candidates) {
        const results = {
            notified: 0,
            failed: 0
        };

        // Сортируем по приоритету
        const sorted = candidates.sort((a, b) => b.score - a.score);

        // Берем топ N мастеров
        const toNotify = sorted.slice(0, this.config.search.maxMastersToNotify);

        for (const candidate of toNotify) {
            try {
                await this.orderPublisher.publishMasterNotification({
                    orderId: order._id,
                    masterId: candidate.masterId,
                    orderData: {
                        service: order.service,
                        location: order.location.pickup,
                        customer: {
                            name: order.customer.name,
                            rating: order.customer.rating
                        },
                        estimatedPrice: candidate.estimatedPrice,
                        distance: candidate.distance,
                        eta: candidate.eta
                    },
                    ttl: this.config.timeouts.masterNotificationTTL
                });

                results.notified++;

                // Записываем в попытку поиска
                await this.orderModel.updateOne(
                    {
                        _id: order._id,
                        'search.attempts.candidates.executorId': candidate.masterId
                    },
                    {
                        $set: {
                            'search.attempts.$.candidates.$.notified': true,
                            'search.attempts.$.candidates.$.notifiedAt': new Date()
                        }
                    }
                );

            } catch (error) {
                this.logger.error({
                    orderId: order._id,
                    masterId: candidate.masterId,
                    error: error.message
                }, 'Failed to notify master');

                results.failed++;
            }
        }

        return results;
    }

    // Расширение поиска
    async expandSearch(orderId, currentAttempt) {
        const order = await this.getOrder(orderId);

        // Проверяем лимит попыток
        if (currentAttempt >= this.config.limits.maxSearchAttempts) {
            await this.handleSearchFailed(orderId);
            return;
        }

        // Увеличиваем радиус
        const newRadius = Math.min(
            order.search.criteria.radius + this.config.search.radiusExpansionStep,
            order.search.criteria.maxRadius
        );

        // Обновляем критерии поиска
        await this.orderModel.updateOne(
            { _id: order._id },
            {
                $set: {
                    'search.criteria.radius': newRadius
                }
            }
        );

        // Запускаем новый поиск
        setTimeout(() => {
            this.orderPublisher.publishSearchRequest({
                orderId,
                attempt: currentAttempt + 1,
                radius: newRadius,
                isExpanded: true
            });
        }, this.config.timeouts.searchExpansionInterval);
    }

    // Обработка таймаута поиска
    async handleSearchTimeout(orderId) {
        const order = await this.getOrder(orderId);

        if (order.status === ORDER_STATUS.SEARCHING) {
            await this.handleSearchFailed(orderId);
        }
    }

    // Обработка неудачного поиска
    async handleSearchFailed(orderId) {
        await this.updateOrderStatus(orderId, ORDER_STATUS.EXPIRED, {
            actorType: 'system',
            reason: 'no_masters_found'
        });

        const order = await this.getOrder(orderId);

        // Уведомляем клиента
        await this.notificationService.create({
            type: 'order_search_failed',
            recipientId: order.customer.userId,
            priority: 'high',
            data: {
                orderId,
                canRetry: true
            }
        });

        // Публикуем событие
        await this.eventPublisher.publish(EVENT_TYPES.ORDER_SEARCH_FAILED, {
            orderId,
            attempts: order.search.attempts.length,
            totalCandidates: order.search.stats.totalCandidates
        });
    }

    // Обработка таймаута назначения
    async handleAssignmentTimeout(orderId, masterId) {
        const order = await this.getOrder(orderId);

        if (order.status === ORDER_STATUS.ASSIGNED &&
            order.executor.masterId?.toString() === masterId.toString()) {

            // Отменяем назначение
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'executor.responseTime': getStatusTimeout(ORDER_STATUS.ASSIGNED) / 1000
                    },
                    $push: {
                        'search.criteria.excludedMasterIds': masterId
                    }
                }
            );

            // Возвращаем к поиску
            await this.updateOrderStatus(orderId, ORDER_STATUS.SEARCHING, {
                actorType: 'system',
                reason: 'master_no_response'
            });

            // Продолжаем поиск
            await this.orderPublisher.publishSearchRequest({
                orderId,
                attempt: order.search.attempts.length + 1,
                radius: order.search.criteria.radius,
                isRetry: true
            });
        }
    }

    // Проверка движения мастера
    async checkMasterMovement(orderId, masterId) {
        const order = await this.getOrder(orderId);

        if (order.status === ORDER_STATUS.ACCEPTED) {
            // Если мастер не начал движение, отправляем напоминание
            await this.notificationService.create({
                type: 'reminder_start_movement',
                recipientId: masterId,
                priority: 'high',
                data: { orderId }
            });
        }
    }

    // Валидация причины отмены
    validateCancellationReason(reason, role) {
        const reasons = CANCELLATION_REASONS[role.toUpperCase()];

        if (!reasons) {
            throw new ValidationError('Invalid role for cancellation');
        }

        if (!Object.values(reasons).includes(reason)) {
            return reasons.OTHER;
        }

        return reason;
    }

    // Расчет штрафа за отмену
    async calculateCancellationPenalty(order, role) {
        if (role !== USER_ROLES.CLIENT) {
            return 0; // Мастера не платят штраф
        }

        // Бесплатная отмена в первые N минут
        const orderAge = Date.now() - new Date(order.timing.createdAt).getTime();
        if (orderAge < this.config.cancellation.freeMinutes * 60 * 1000) {
            return 0;
        }

        // Если мастер уже прибыл
        if (order.status === ORDER_STATUS.ARRIVED ||
            order.status === ORDER_STATUS.IN_PROGRESS) {
            return Math.min(
                Math.round(order.pricing.calculation.total * 0.5),
                this.config.cancellation.maxPenalty
            );
        }

        // Стандартный штраф
        return Math.min(
            Math.round(order.pricing.calculation.total *
                this.config.cancellation.penaltyPercentage / 100),
            this.config.cancellation.maxPenalty
        );
    }

    // Применение штрафа
    async applyPenalty(userId, amount, orderId) {
        // TODO: Implement penalty application
        this.logger.info({
            userId,
            amount,
            orderId
        }, 'Penalty applied');
    }

    // Инициализация обработчиков статусов
    initializeStatusHandlers() {
        return {
            [ORDER_STATUS.SEARCHING]: async (order) => {
                this.stats.searching++;
            },

            [ORDER_STATUS.COMPLETED]: async (order) => {
                this.stats.searching--;
            },

            [ORDER_STATUS.CANCELLED]: async (order) => {
                if (order.status === ORDER_STATUS.SEARCHING) {
                    this.stats.searching--;
                }
            },

            [ORDER_STATUS.FAILED]: async (order) => {
                if (order.status === ORDER_STATUS.SEARCHING) {
                    this.stats.searching--;
                }
            }
        };
    }

    // Утилиты
    isNightTime() {
        const hour = new Date().getHours();
        return hour >= 22 || hour < 6;
    }

    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    }

    // Получение статистики
    getStats() {
        return {
            ...this.stats,
            timestamp: new Date()
        };
    }
}

module.exports = OrderService;