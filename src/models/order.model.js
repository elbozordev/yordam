// src/models/order.model.js

'use strict';

const { ObjectId } = require('mongodb');
const {
    ORDER_STATUS,
    CANCELLATION_REASONS,
    FAILURE_REASONS,
    canTransition,
    getStatusTimeout,
    isStatusExpired
} = require('../utils/constants/order-status');
const { SERVICE_TYPES } = require('../utils/constants/service-types');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants/payment-status');
const { USER_ROLES } = require('../utils/constants/user-roles');
const { HISTORY_EVENT_TYPES } = require('./order-history.model');

// Типы заказов
const ORDER_TYPES = {
    IMMEDIATE: 'immediate',           // Срочный заказ
    SCHEDULED: 'scheduled',           // Запланированный
    RECURRING: 'recurring'            // Повторяющийся
};

// Источники заказа
const ORDER_SOURCES = {
    MOBILE_APP: 'mobile_app',
    WEB: 'web',
    CALL_CENTER: 'call_center',
    API: 'api',
    RECURRING: 'recurring'
};

// Приоритеты заказа
const ORDER_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
    CRITICAL: 'critical'
};

// Схема заказа
const orderSchema = {
    _id: ObjectId,

    // Номер заказа (человекочитаемый)
    orderNumber: String,              // Y24-20240115-0001

    // Основная информация
    type: String,                     // Из ORDER_TYPES
    source: String,                   // Из ORDER_SOURCES
    priority: String,                 // Из ORDER_PRIORITY
    status: String,                   // Из ORDER_STATUS

    // Участники заказа
    customer: {
        userId: ObjectId,
        name: String,
        phone: String,

        // Дублируем важные данные для быстрого доступа
        rating: Number,               // Рейтинг клиента
        ordersCount: Number,          // Количество заказов
        isVip: Boolean,              // VIP клиент

        // Устройство клиента
        device: {
            id: String,
            type: String,             // ios, android, web
            model: String,
            appVersion: String
        }
    },

    // Автомобиль
    vehicle: {
        vehicleId: ObjectId,

        // Дублируем основные данные
        brand: String,
        model: String,
        year: Number,
        plateNumber: String,
        color: String,

        // Для быстрого отображения
        displayName: String           // "Chevrolet Nexia 2020"
    },

    // Услуга
    service: {
        serviceId: ObjectId,
        code: String,                 // Из SERVICE_TYPES
        name: String,                 // Локализованное название
        category: String,

        // Опции услуги
        options: [{
            id: String,
            name: String,
            price: Number,
            quantity: Number
        }],

        // Описание проблемы
        description: String,

        // Фото/видео проблемы
        media: [{
            type: String,             // photo, video
            url: String,
            thumbnailUrl: String,
            uploadedAt: Date
        }]
    },

    // Исполнитель
    executor: {
        type: String,                 // master, sto

        // Для мастера
        masterId: ObjectId,
        masterName: String,
        masterPhone: String,
        masterRating: Number,

        // Для СТО
        stoId: ObjectId,
        stoName: String,
        stoPhone: String,
        stoRating: Number,

        // Общие поля
        assignedAt: Date,
        acceptedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,

        // Время отклика
        responseTime: Number,         // Секунды

        // История назначений (если были переназначения)
        history: [{
            executorId: ObjectId,
            executorType: String,
            executorName: String,
            assignedAt: Date,
            unassignedAt: Date,
            reason: String
        }]
    },

    // Локации
    location: {
        // Место подачи (откуда)
        pickup: {
            address: {
                formatted: String,
                street: String,
                building: String,
                entrance: String,
                floor: String,
                apartment: String,
                landmark: String,
                instructions: String
            },

            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]  // [longitude, latitude]
            },

            // Валидация адреса
            isVerified: Boolean,
            verifiedBy: String        // geocoding, manual, gps
        },

        // Место назначения (куда) - для эвакуатора
        destination: {
            address: Object,          // Аналогично pickup.address
            coordinates: Object,      // Аналогично pickup.coordinates
            isVerified: Boolean
        },

        // Расчетные данные
        route: {
            distance: Number,         // Метры
            duration: Number,         // Секунды

            // Маршрут для отображения
            polyline: String,         // Закодированный polyline

            // Путевые точки
            waypoints: [{
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                timestamp: Date
            }]
        },

        // Текущее местоположение мастера
        tracking: {
            isActive: Boolean,

            currentLocation: {
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                accuracy: Number,
                heading: Number,
                speed: Number,
                updatedAt: Date
            },

            // ETA (Estimated Time of Arrival)
            eta: {
                minutes: Number,
                distance: Number,
                updatedAt: Date
            }
        }
    },

    // Временные параметры
    timing: {
        // Для запланированных заказов
        scheduledFor: Date,
        scheduledDuration: Number,    // Минуты

        // Временные метки
        createdAt: Date,
        searchStartedAt: Date,
        assignedAt: Date,
        acceptedAt: Date,
        arrivedAt: Date,
        startedAt: Date,
        completedAt: Date,
        cancelledAt: Date,

        // Длительности этапов
        durations: {
            search: Number,           // Поиск мастера (сек)
            response: Number,         // Отклик мастера (сек)
            arrival: Number,          // Время прибытия (сек)
            work: Number,            // Время работы (сек)
            total: Number            // Общее время (сек)
        },

        // SLA
        sla: {
            searchTimeout: Number,    // Таймаут поиска
            responseTimeout: Number,  // Таймаут ответа
            arrivalTimeout: Number,   // Таймаут прибытия

            // Нарушения SLA
            violations: [{
                type: String,         // search_timeout, late_arrival
                timestamp: Date,
                duration: Number      // Насколько превышен
            }]
        }
    },

    // Финансы
    pricing: {
        // Расчет стоимости
        calculation: {
            basePrice: Number,

            // Составляющие цены
            components: [{
                type: String,         // base, distance, time, option
                description: String,
                amount: Number,
                quantity: Number,
                unit: String
            }],

            // Модификаторы
            surgeMultiplier: Number,
            surgeAmount: Number,
            nightSurcharge: Number,
            weekendSurcharge: Number,
            urgencySurcharge: Number,

            // Скидки
            discount: {
                type: String,         // promocode, loyalty, campaign
                code: String,
                amount: Number,
                percentage: Number
            },

            // Итоги
            subtotal: Number,
            tax: Number,
            taxRate: Number,
            total: Number,

            // Валюта
            currency: String,         // UZS

            // Когда рассчитано
            calculatedAt: Date
        },

        // Оплата
        payment: {
            method: String,           // Из PAYMENT_METHODS
            status: String,           // Из PAYMENT_STATUS

            // Детали платежа
            details: {
                cardMask: String,     // **** 1234
                cardType: String,     // visa, mastercard, uzcard

                // Для разделенной оплаты
                splits: [{
                    method: String,
                    amount: Number,
                    status: String
                }]
            },

            // Транзакции
            transactions: [{
                transactionId: ObjectId,
                type: String,
                amount: Number,
                status: String,
                timestamp: Date
            }],

            // Итоговые суммы
            paidAmount: Number,
            refundedAmount: Number,
            dueAmount: Number
        },

        // Комиссии и распределение
        distribution: {
            // Комиссия платформы
            platformCommission: {
                rate: Number,         // Процент
                amount: Number
            },

            // Выплата исполнителю
            executorPayout: {
                amount: Number,
                status: String,       // pending, paid
                paidAt: Date
            },

            // Для СТО - распределение между СТО и мастером
            stoShare: {
                amount: Number,
                rate: Number
            },

            masterShare: {
                amount: Number,
                rate: Number
            }
        }
    },

    // Процесс поиска исполнителя
    search: {
        // Параметры поиска
        criteria: {
            serviceType: String,
            requiredSkills: [String],
            preferredExecutorIds: [ObjectId],
            excludedExecutorIds: [ObjectId],

            radius: Number,           // Начальный радиус
            maxRadius: Number,        // Максимальный радиус

            // Фильтры
            minRating: Number,
            maxPrice: Number,
            onlyVerified: Boolean,
            onlyWithReviews: Boolean
        },

        // Процесс поиска
        attempts: [{
            attemptNumber: Number,
            timestamp: Date,
            radius: Number,

            // Найденные кандидаты
            candidates: [{
                executorId: ObjectId,
                executorType: String,
                distance: Number,
                eta: Number,
                rating: Number,
                price: Number,
                score: Number,        // Общий скор для сортировки

                // Результат
                notified: Boolean,
                notifiedAt: Date,
                responded: Boolean,
                respondedAt: Date,
                response: String,     // accepted, rejected, timeout
                rejectionReason: String
            }],

            result: String           // found, expanded, failed
        }],

        // Статистика поиска
        stats: {
            totalCandidates: Number,
            notifiedCount: Number,
            respondedCount: Number,
            acceptedCount: Number,
            searchDuration: Number
        }
    },

    // Оценки и отзывы
    feedback: {
        // Оценка от клиента
        fromCustomer: {
            rating: Number,           // 1-5

            // Детальные оценки
            categories: {
                quality: Number,
                speed: Number,
                price: Number,
                communication: Number,
                cleanliness: Number
            },

            comment: String,
            tags: [String],          // Предустановленные теги

            // Медиа
            photos: [{
                url: String,
                caption: String
            }],

            createdAt: Date,

            // Ответ исполнителя
            response: {
                comment: String,
                createdAt: Date
            }
        },

        // Оценка от исполнителя
        fromExecutor: {
            rating: Number,
            comment: String,
            tags: [String],          // adequate, polite, difficult
            createdAt: Date
        },

        // Жалобы
        complaints: [{
            from: String,            // customer, executor
            type: String,
            description: String,
            status: String,          // open, investigating, resolved
            createdAt: Date,
            resolvedAt: Date,
            resolution: String
        }]
    },

    // Коммуникации
    communication: {
        // Чат
        chatEnabled: Boolean,
        chatSessionId: String,
        messagesCount: Number,
        lastMessageAt: Date,

        // Звонки
        calls: [{
            from: String,            // customer, executor, support
            to: String,
            duration: Number,        // Секунды
            status: String,          // completed, missed, failed
            timestamp: Date
        }],

        // Автоматические сообщения
        autoMessages: [{
            type: String,            // eta_update, status_change
            template: String,
            sentAt: Date,
            deliveryStatus: String
        }]
    },

    // Промо и маркетинг
    marketing: {
        // Промокод
        promocode: {
            code: String,
            campaignId: ObjectId,
            discount: Number,
            discountType: String     // fixed, percentage
        },

        // Источник привлечения
        attribution: {
            source: String,          // organic, paid, referral
            medium: String,          // google, facebook, friend
            campaign: String,
            referrerId: ObjectId
        },

        // A/B тестирование
        experiments: [{
            name: String,
            variant: String,
            enrolledAt: Date
        }]
    },

    // Повторяющиеся заказы
    recurring: {
        isRecurring: Boolean,

        // Расписание
        schedule: {
            frequency: String,       // daily, weekly, monthly
            interval: Number,        // Каждые N периодов

            // Дни недели (для weekly)
            daysOfWeek: [Number],    // 0-6

            // День месяца (для monthly)
            dayOfMonth: Number,

            // Время
            timeOfDay: String,       // "09:00"

            // Период действия
            startDate: Date,
            endDate: Date,

            // Следующее выполнение
            nextRunAt: Date
        },

        // История выполнений
        executions: [{
            orderId: ObjectId,
            scheduledFor: Date,
            executedAt: Date,
            status: String,
            reason: String           // Причина пропуска
        }],

        // Настройки
        settings: {
            autoConfirm: Boolean,
            preferredExecutorId: ObjectId,
            maxPrice: Number,
            skipOnHolidays: Boolean
        }
    },

    // Метаданные
    metadata: {
        // Версионирование
        version: Number,             // Версия схемы
        apiVersion: String,

        // Внутренние флаги
        flags: {
            isTest: Boolean,
            isPriority: Boolean,
            isCompensation: Boolean, // Компенсационный заказ
            requiresReview: Boolean,
            wasEdited: Boolean,
            isDisputed: Boolean
        },

        // Теги для группировки
        tags: [String],

        // Кастомные поля
        customFields: Object,

        // Служебная информация
        notes: [{
            author: ObjectId,
            authorRole: String,
            text: String,
            createdAt: Date
        }]
    },

    // Аудит
    audit: {
        createdBy: ObjectId,
        createdByRole: String,

        // Изменения
        lastModified: {
            by: ObjectId,
            byRole: String,
            at: Date,
            fields: [String]         // Измененные поля
        },

        // IP адреса
        ip: {
            created: String,
            lastModified: String
        }
    },

    // Временные метки
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date                  // Для soft delete
};

// Класс для работы с заказами
class OrderModel {
    constructor(db) {
        this.collection = db.collection('orders');
        this.historyModel = null; // Инжектим позже
        this.setupIndexes();
    }

    // Установка связи с моделью истории
    setHistoryModel(historyModel) {
        this.historyModel = historyModel;
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Уникальные индексы
            await this.collection.createIndex({ orderNumber: 1 }, { unique: true });

            // Основные индексы для поиска
            await this.collection.createIndex({ status: 1, createdAt: -1 });
            await this.collection.createIndex({ 'customer.userId': 1, createdAt: -1 });
            await this.collection.createIndex({ 'executor.masterId': 1, status: 1 });
            await this.collection.createIndex({ 'executor.stoId': 1, status: 1 });

            // Геопространственные индексы
            await this.collection.createIndex({ 'location.pickup.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'location.destination.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'location.tracking.currentLocation.coordinates': '2dsphere' });

            // Составные индексы для фильтрации
            await this.collection.createIndex({
                status: 1,
                'service.code': 1,
                createdAt: -1
            });

            await this.collection.createIndex({
                'payment.status': 1,
                'payment.method': 1,
                createdAt: -1
            });

            // Индексы для scheduled заказов
            await this.collection.createIndex({
                type: 1,
                'timing.scheduledFor': 1,
                status: 1
            });

            // Индексы для recurring заказов
            await this.collection.createIndex({
                'recurring.isRecurring': 1,
                'recurring.schedule.nextRunAt': 1
            });

            // Индексы для аналитики
            await this.collection.createIndex({ createdAt: -1 });
            await this.collection.createIndex({ 'timing.completedAt': -1 });
            await this.collection.createIndex({ 'pricing.calculation.total': -1 });

            // Текстовый поиск
            await this.collection.createIndex({
                orderNumber: 'text',
                'customer.name': 'text',
                'customer.phone': 'text',
                'vehicle.plateNumber': 'text',
                'location.pickup.address.formatted': 'text'
            });

            // TTL индекс для soft delete
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 дней
            );

        } catch (error) {
            console.error('Error creating order indexes:', error);
        }
    }

    // Создание нового заказа
    async create(orderData) {
        const now = new Date();

        // Генерация номера заказа
        const orderNumber = await this.generateOrderNumber();

        const order = {
            _id: new ObjectId(),
            orderNumber,
            ...orderData,

            // Defaults
            type: orderData.type || ORDER_TYPES.IMMEDIATE,
            source: orderData.source || ORDER_SOURCES.MOBILE_APP,
            priority: orderData.priority || ORDER_PRIORITY.NORMAL,
            status: ORDER_STATUS.NEW,

            pricing: {
                calculation: {
                    currency: 'UZS',
                    ...orderData.pricing?.calculation
                },
                payment: {
                    status: PAYMENT_STATUS.PENDING,
                    paidAmount: 0,
                    refundedAmount: 0,
                    ...orderData.pricing?.payment
                },
                ...orderData.pricing
            },

            timing: {
                createdAt: now,
                durations: {},
                sla: {
                    searchTimeout: getStatusTimeout(ORDER_STATUS.SEARCHING),
                    responseTimeout: getStatusTimeout(ORDER_STATUS.ASSIGNED),
                    arrivalTimeout: getStatusTimeout(ORDER_STATUS.EN_ROUTE),
                    violations: []
                },
                ...orderData.timing
            },

            search: {
                attempts: [],
                stats: {
                    totalCandidates: 0,
                    notifiedCount: 0,
                    respondedCount: 0,
                    acceptedCount: 0
                },
                ...orderData.search
            },

            communication: {
                chatEnabled: true,
                messagesCount: 0,
                calls: [],
                autoMessages: [],
                ...orderData.communication
            },

            metadata: {
                version: 1,
                flags: {
                    isTest: false,
                    isPriority: orderData.priority === ORDER_PRIORITY.URGENT ||
                        orderData.priority === ORDER_PRIORITY.CRITICAL,
                    ...orderData.metadata?.flags
                },
                ...orderData.metadata
            },

            audit: {
                createdBy: orderData.customer.userId,
                createdByRole: USER_ROLES.CLIENT,
                ...orderData.audit
            },

            createdAt: now,
            updatedAt: now
        };

        const result = await this.collection.insertOne(order);
        order._id = result.insertedId;

        // Записываем в историю
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: order._id,
                eventType: HISTORY_EVENT_TYPES.ORDER_CREATED,
                actor: {
                    type: 'user',
                    id: order.customer.userId,
                    role: USER_ROLES.CLIENT
                },
                details: {
                    system: {
                        action: 'order_created',
                        automated: false
                    }
                }
            });
        }

        return order;
    }

    // Поиск заказа по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            deletedAt: { $exists: false }
        });
    }

    // Поиск заказа по номеру
    async findByNumber(orderNumber) {
        return await this.collection.findOne({
            orderNumber,
            deletedAt: { $exists: false }
        });
    }

    // Поиск заказов пользователя
    async findByCustomerId(customerId, options = {}) {
        const {
            statuses = null,
            limit = 20,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = -1
        } = options;

        const query = {
            'customer.userId': new ObjectId(customerId),
            deletedAt: { $exists: false }
        };

        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        return await this.collection
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    // Поиск заказов исполнителя
    async findByExecutorId(executorId, executorType = 'master', options = {}) {
        const {
            statuses = null,
            dateFrom = null,
            dateTo = null,
            limit = 50,
            offset = 0
        } = options;

        const query = {
            deletedAt: { $exists: false }
        };

        // Фильтр по исполнителю
        if (executorType === 'master') {
            query['executor.masterId'] = new ObjectId(executorId);
        } else {
            query['executor.stoId'] = new ObjectId(executorId);
        }

        // Фильтр по статусам
        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        // Фильтр по датам
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        return await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    // Поиск активных заказов
    async findActive(filters = {}) {
        const query = {
            status: {
                $in: [
                    ORDER_STATUS.NEW,
                    ORDER_STATUS.SEARCHING,
                    ORDER_STATUS.ASSIGNED,
                    ORDER_STATUS.ACCEPTED,
                    ORDER_STATUS.EN_ROUTE,
                    ORDER_STATUS.ARRIVED,
                    ORDER_STATUS.IN_PROGRESS
                ]
            },
            deletedAt: { $exists: false },
            ...filters
        };

        return await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
    }

    // Поиск заказов для назначения
    async findOrdersForAssignment(criteria = {}) {
        const {
            serviceTypes = [],
            maxDistance = 10000,
            location = null,
            minRating = 0
        } = criteria;

        const query = {
            status: ORDER_STATUS.SEARCHING,
            deletedAt: { $exists: false }
        };

        if (serviceTypes.length > 0) {
            query['service.code'] = { $in: serviceTypes };
        }

        if (location) {
            query['location.pickup.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: maxDistance
                }
            };
        }

        return await this.collection
            .find(query)
            .sort({ priority: -1, createdAt: 1 })
            .toArray();
    }

    // Обновление статуса заказа
    async updateStatus(orderId, newStatus, details = {}) {
        const order = await this.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Проверка валидности перехода
        if (!canTransition(order.status, newStatus)) {
            throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
        }

        const now = new Date();
        const updateData = {
            status: newStatus,
            updatedAt: now
        };

        // Обновляем временные метки
        const timestampMap = {
            [ORDER_STATUS.SEARCHING]: 'searchStartedAt',
            [ORDER_STATUS.ASSIGNED]: 'assignedAt',
            [ORDER_STATUS.ACCEPTED]: 'acceptedAt',
            [ORDER_STATUS.ARRIVED]: 'arrivedAt',
            [ORDER_STATUS.IN_PROGRESS]: 'startedAt',
            [ORDER_STATUS.COMPLETED]: 'completedAt',
            [ORDER_STATUS.CANCELLED]: 'cancelledAt'
        };

        if (timestampMap[newStatus]) {
            updateData[`timing.${timestampMap[newStatus]}`] = now;
        }

        // Расчет длительностей
        if (order.status === ORDER_STATUS.SEARCHING && newStatus === ORDER_STATUS.ASSIGNED) {
            updateData['timing.durations.search'] =
                (now - order.timing.searchStartedAt) / 1000;
        }

        if (order.status === ORDER_STATUS.ASSIGNED && newStatus === ORDER_STATUS.ACCEPTED) {
            updateData['timing.durations.response'] =
                (now - order.timing.assignedAt) / 1000;
        }

        // Дополнительные данные в зависимости от статуса
        if (newStatus === ORDER_STATUS.CANCELLED && details.reason) {
            updateData['cancellation'] = {
                reason: details.reason,
                cancelledBy: details.cancelledBy,
                cancelledByRole: details.cancelledByRole,
                description: details.description
            };
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        // Записываем в историю
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.STATUS_CHANGED,
                actor: {
                    type: details.actorType || 'system',
                    id: details.actorId,
                    role: details.actorRole
                },
                stateChange: {
                    status: {
                        from: order.status,
                        to: newStatus
                    }
                }
            });
        }

        return result;
    }

    // Назначение исполнителя
    async assignExecutor(orderId, executorData) {
        const now = new Date();

        const updateData = {
            'executor.type': executorData.type,
            'executor.assignedAt': now,
            'timing.assignedAt': now,
            status: ORDER_STATUS.ASSIGNED,
            updatedAt: now
        };

        if (executorData.type === 'master') {
            updateData['executor.masterId'] = new ObjectId(executorData.masterId);
            updateData['executor.masterName'] = executorData.masterName;
            updateData['executor.masterPhone'] = executorData.masterPhone;
            updateData['executor.masterRating'] = executorData.masterRating;
        } else {
            updateData['executor.stoId'] = new ObjectId(executorData.stoId);
            updateData['executor.stoName'] = executorData.stoName;
            updateData['executor.stoPhone'] = executorData.stoPhone;
            updateData['executor.stoRating'] = executorData.stoRating;
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: updateData,
                $push: {
                    'executor.history': {
                        executorId: executorData.masterId || executorData.stoId,
                        executorType: executorData.type,
                        executorName: executorData.masterName || executorData.stoName,
                        assignedAt: now
                    }
                }
            },
            { returnDocument: 'after' }
        );

        // Записываем в историю
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.MASTER_ASSIGNED,
                actor: {
                    type: 'system',
                    id: executorData.assignedBy
                },
                stateChange: {
                    master: {
                        toId: executorData.masterId || executorData.stoId,
                        toName: executorData.masterName || executorData.stoName
                    }
                },
                details: {
                    assignment: {
                        method: executorData.method || 'auto',
                        distance: executorData.distance,
                        eta: executorData.eta
                    }
                }
            });
        }

        return result;
    }

    // Обновление цены заказа
    async updatePricing(orderId, pricingData) {
        const updateData = {
            'pricing.calculation': {
                ...pricingData,
                calculatedAt: new Date()
            },
            updatedAt: new Date()
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        // Записываем в историю
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.PRICE_UPDATED,
                actor: {
                    type: 'system'
                },
                stateChange: {
                    price: {
                        to: pricingData
                    }
                }
            });
        }

        return result;
    }

    // Обновление локации трекинга
    async updateTracking(orderId, trackingData) {
        const updateData = {
            'location.tracking': {
                isActive: true,
                currentLocation: {
                    coordinates: {
                        type: 'Point',
                        coordinates: [trackingData.lng, trackingData.lat]
                    },
                    accuracy: trackingData.accuracy,
                    heading: trackingData.heading,
                    speed: trackingData.speed,
                    updatedAt: new Date()
                },
                eta: trackingData.eta
            },
            updatedAt: new Date()
        };

        // Добавляем точку в маршрут
        const waypoint = {
            coordinates: {
                type: 'Point',
                coordinates: [trackingData.lng, trackingData.lat]
            },
            timestamp: new Date()
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: updateData,
                $push: {
                    'location.route.waypoints': {
                        $each: [waypoint],
                        $slice: -100 // Храним последние 100 точек
                    }
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Добавление поисковой попытки
    async addSearchAttempt(orderId, attemptData) {
        const attempt = {
            attemptNumber: attemptData.attemptNumber,
            timestamp: new Date(),
            radius: attemptData.radius,
            candidates: attemptData.candidates || [],
            result: attemptData.result
        };

        const updateData = {
            $push: { 'search.attempts': attempt },
            $inc: {
                'search.stats.totalCandidates': attemptData.candidates?.length || 0,
                'search.stats.notifiedCount': attemptData.notifiedCount || 0
            },
            $set: { updatedAt: new Date() }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            updateData,
            { returnDocument: 'after' }
        );
    }

    // Добавление отзыва
    async addFeedback(orderId, feedbackData) {
        const { from, rating, comment, categories, tags } = feedbackData;

        const feedback = {
            rating,
            comment,
            categories,
            tags,
            createdAt: new Date()
        };

        const updateField = from === 'customer' ?
            'feedback.fromCustomer' : 'feedback.fromExecutor';

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: {
                    [updateField]: feedback,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        // Записываем в историю
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.RATING_GIVEN,
                actor: {
                    type: from === 'customer' ? 'user' : 'master',
                    id: from === 'customer' ?
                        result.customer.userId : result.executor.masterId
                },
                details: {
                    feedback: {
                        rating,
                        comment,
                        tags
                    }
                }
            });
        }

        return result;
    }

    // Расчет статистики заказов
    async calculateStats(filters = {}) {
        const pipeline = [];

        // Фильтры
        const match = {
            deletedAt: { $exists: false }
        };

        if (filters.startDate || filters.endDate) {
            match.createdAt = {};
            if (filters.startDate) match.createdAt.$gte = filters.startDate;
            if (filters.endDate) match.createdAt.$lte = filters.endDate;
        }

        if (filters.status) match.status = filters.status;
        if (filters.serviceType) match['service.code'] = filters.serviceType;

        pipeline.push({ $match: match });

        // Группировка
        pipeline.push({
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0] }
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] }
                },
                totalRevenue: {
                    $sum: { $cond: [
                            { $eq: ['$status', ORDER_STATUS.COMPLETED] },
                            '$pricing.calculation.total',
                            0
                        ]}
                },
                avgOrderValue: {
                    $avg: { $cond: [
                            { $eq: ['$status', ORDER_STATUS.COMPLETED] },
                            '$pricing.calculation.total',
                            null
                        ]}
                },
                avgSearchTime: { $avg: '$timing.durations.search' },
                avgWorkTime: { $avg: '$timing.durations.work' },
                avgRating: { $avg: '$feedback.fromCustomer.rating' }
            }
        });

        const results = await this.collection.aggregate(pipeline).toArray();
        return results[0] || {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            avgSearchTime: 0,
            avgWorkTime: 0,
            avgRating: 0
        };
    }

    // Поиск заказов с истекшими таймаутами
    async findExpiredOrders() {
        const now = new Date();
        const expiredOrders = [];

        // Проверяем заказы в статусе SEARCHING
        const searchingOrders = await this.collection.find({
            status: ORDER_STATUS.SEARCHING,
            deletedAt: { $exists: false }
        }).toArray();

        for (const order of searchingOrders) {
            if (isStatusExpired(ORDER_STATUS.SEARCHING, order.timing.searchStartedAt)) {
                expiredOrders.push({
                    order,
                    reason: 'search_timeout',
                    newStatus: ORDER_STATUS.EXPIRED
                });
            }
        }

        // Проверяем заказы в статусе ASSIGNED
        const assignedOrders = await this.collection.find({
            status: ORDER_STATUS.ASSIGNED,
            deletedAt: { $exists: false }
        }).toArray();

        for (const order of assignedOrders) {
            if (isStatusExpired(ORDER_STATUS.ASSIGNED, order.timing.assignedAt)) {
                expiredOrders.push({
                    order,
                    reason: 'response_timeout',
                    newStatus: ORDER_STATUS.SEARCHING
                });
            }
        }

        return expiredOrders;
    }

    // Генерация номера заказа
    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Получаем последний номер за сегодня
        const lastOrder = await this.collection.findOne(
            {
                orderNumber: {
                    $regex: `^Y24-${year}${month}${day}-\\d{4}$`
                }
            },
            { sort: { orderNumber: -1 } }
        );

        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        return `Y24-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
    }

    // Мягкое удаление
    async softDelete(orderId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(orderId) },
            {
                $set: {
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}

// Экспортируем
module.exports = {
    OrderModel,
    ORDER_TYPES,
    ORDER_SOURCES,
    ORDER_PRIORITY,
    orderSchema
};