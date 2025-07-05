// src/models/order-history.model.js

'use strict';

const { ObjectId } = require('mongodb');
const { ORDER_STATUS } = require('../utils/constants/order-status');
const { USER_ROLES } = require('../utils/constants/user-roles');

// Типы событий в истории заказа
const HISTORY_EVENT_TYPES = {
    // Жизненный цикл заказа
    ORDER_CREATED: 'order_created',                    // Заказ создан
    ORDER_UPDATED: 'order_updated',                    // Заказ обновлен
    ORDER_CANCELLED: 'order_cancelled',                // Заказ отменен
    ORDER_COMPLETED: 'order_completed',                // Заказ завершен
    ORDER_FAILED: 'order_failed',                      // Заказ не выполнен

    // Изменения статуса
    STATUS_CHANGED: 'status_changed',                  // Изменен статус
    STATUS_ROLLBACK: 'status_rollback',                // Откат статуса

    // Назначение исполнителей
    MASTER_ASSIGNED: 'master_assigned',                // Назначен мастер
    MASTER_UNASSIGNED: 'master_unassigned',            // Отменено назначение
    MASTER_ACCEPTED: 'master_accepted',                // Мастер принял
    MASTER_REJECTED: 'master_rejected',                // Мастер отклонил
    MASTER_ARRIVED: 'master_arrived',                  // Мастер прибыл
    MASTER_STARTED_WORK: 'master_started_work',       // Мастер начал работу

    // Поиск исполнителя
    SEARCH_STARTED: 'search_started',                  // Начат поиск
    SEARCH_EXPANDED: 'search_expanded',                // Расширен радиус поиска
    SEARCH_FAILED: 'search_failed',                    // Поиск не удался
    SEARCH_COMPLETED: 'search_completed',              // Поиск завершен

    // Финансовые события
    PRICE_CALCULATED: 'price_calculated',              // Рассчитана цена
    PRICE_UPDATED: 'price_updated',                    // Обновлена цена
    SURGE_APPLIED: 'surge_applied',                    // Применен surge
    DISCOUNT_APPLIED: 'discount_applied',              // Применена скидка
    PAYMENT_INITIATED: 'payment_initiated',            // Инициирована оплата
    PAYMENT_COMPLETED: 'payment_completed',            // Оплата завершена
    PAYMENT_FAILED: 'payment_failed',                  // Оплата не удалась
    REFUND_INITIATED: 'refund_initiated',              // Инициирован возврат
    REFUND_COMPLETED: 'refund_completed',              // Возврат завершен

    // События локации
    LOCATION_UPDATED: 'location_updated',              // Обновлена локация
    ROUTE_CALCULATED: 'route_calculated',              // Рассчитан маршрут
    DESTINATION_CHANGED: 'destination_changed',        // Изменен адрес назначения
    TRACKING_STARTED: 'tracking_started',              // Начато отслеживание
    TRACKING_STOPPED: 'tracking_stopped',              // Остановлено отслеживание

    // Коммуникация
    MESSAGE_SENT: 'message_sent',                      // Отправлено сообщение
    CALL_INITIATED: 'call_initiated',                  // Инициирован звонок
    NOTIFICATION_SENT: 'notification_sent',            // Отправлено уведомление
    SUPPORT_CONTACTED: 'support_contacted',            // Обращение в поддержку

    // Оценки и отзывы
    RATING_GIVEN: 'rating_given',                      // Поставлена оценка
    REVIEW_SUBMITTED: 'review_submitted',              // Оставлен отзыв
    COMPLAINT_FILED: 'complaint_filed',                // Подана жалоба
    DISPUTE_OPENED: 'dispute_opened',                  // Открыт спор
    DISPUTE_RESOLVED: 'dispute_resolved',              // Спор разрешен

    // Служебные события
    SYSTEM_ACTION: 'system_action',                    // Системное действие
    ADMIN_ACTION: 'admin_action',                      // Действие администратора
    AUTO_ACTION: 'auto_action',                        // Автоматическое действие
    ERROR_OCCURRED: 'error_occurred',                  // Произошла ошибка
    TIMEOUT_REACHED: 'timeout_reached'                 // Достигнут таймаут
};

// Категории событий
const EVENT_CATEGORIES = {
    LIFECYCLE: 'lifecycle',                            // Жизненный цикл
    ASSIGNMENT: 'assignment',                          // Назначение
    FINANCIAL: 'financial',                            // Финансы
    LOCATION: 'location',                              // Локация
    COMMUNICATION: 'communication',                    // Коммуникация
    FEEDBACK: 'feedback',                              // Обратная связь
    SYSTEM: 'system'                                   // Системные
};

// Важность событий
const EVENT_SEVERITY = {
    LOW: 'low',                                        // Информационное
    MEDIUM: 'medium',                                  // Обычное
    HIGH: 'high',                                      // Важное
    CRITICAL: 'critical'                               // Критическое
};

// Схема записи истории
const orderHistorySchema = {
    _id: ObjectId,

    // Связь с заказом
    orderId: ObjectId,                                 // ID заказа

    // Тип и категория события
    eventType: String,                                 // Из HISTORY_EVENT_TYPES
    eventCategory: String,                             // Из EVENT_CATEGORIES
    severity: String,                                  // Из EVENT_SEVERITY

    // Кто совершил действие
    actor: {
        type: String,                                  // user, master, sto, admin, system
        id: ObjectId,                                  // ID актора
        role: String,                                  // Из USER_ROLES
        name: String,                                  // Имя для отображения

        // Дополнительная информация
        ip: String,                                    // IP адрес
        userAgent: String,                             // User Agent
        deviceId: String,                              // ID устройства
        appVersion: String                             // Версия приложения
    },

    // Временная метка события
    timestamp: Date,

    // Изменения состояния
    stateChange: {
        // Изменение статуса
        status: {
            from: String,                              // Предыдущий статус
            to: String                                 // Новый статус
        },

        // Изменение исполнителя
        master: {
            fromId: ObjectId,
            toId: ObjectId,
            fromName: String,
            toName: String
        },

        // Изменение цены
        price: {
            from: {
                base: Number,
                surge: Number,
                discount: Number,
                total: Number
            },
            to: {
                base: Number,
                surge: Number,
                discount: Number,
                total: Number
            },
            reason: String                             // Причина изменения
        },

        // Изменение локации
        location: {
            from: {
                address: String,
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                }
            },
            to: {
                address: String,
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                }
            }
        },

        // Другие поля, которые изменились
        otherFields: {
            // Динамический объект для любых других изменений
            // field: { from: value, to: value }
        }
    },

    // Детали события
    details: {
        // Для событий поиска
        search: {
            radius: Number,                            // Радиус поиска
            mastersFound: Number,                      // Найдено мастеров
            mastersNotified: Number,                   // Уведомлено мастеров
            searchDuration: Number,                    // Длительность поиска (сек)
            expansions: Number                         // Количество расширений
        },

        // Для событий назначения
        assignment: {
            method: String,                            // auto, manual, customer_choice
            priority: Number,                          // Приоритет мастера
            distance: Number,                          // Расстояние до клиента
            eta: Number,                               // Ожидаемое время прибытия
            rejectionReason: String,                   // Причина отказа
            responseTime: Number                       // Время ответа мастера (сек)
        },

        // Для финансовых событий
        financial: {
            amount: Number,                            // Сумма
            currency: String,                          // Валюта
            paymentMethod: String,                     // Способ оплаты
            transactionId: String,                     // ID транзакции
            commission: Number,                        // Комиссия
            vatAmount: Number                          // НДС
        },

        // Для событий локации
        location: {
            accuracy: Number,                          // Точность GPS
            speed: Number,                             // Скорость движения
            heading: Number,                           // Направление
            distance: Number,                          // Пройденное расстояние
            duration: Number                           // Время в пути
        },

        // Для коммуникации
        communication: {
            messageType: String,                       // text, voice, image
            messageContent: String,                    // Содержание (если не приватное)
            callDuration: Number,                      // Длительность звонка
            notificationType: String,                  // push, sms, email
            deliveryStatus: String                     // sent, delivered, failed
        },

        // Для обратной связи
        feedback: {
            rating: Number,                            // Оценка
            comment: String,                           // Комментарий
            tags: [String],                           // Теги отзыва
            complaintType: String,                     // Тип жалобы
            resolution: String                         // Решение по жалобе
        },

        // Для системных событий
        system: {
            action: String,                            // Действие системы
            reason: String,                            // Причина действия
            automated: Boolean,                        // Автоматическое действие
            trigger: String,                           // Что вызвало действие
            errorCode: String,                         // Код ошибки
            errorMessage: String,                      // Сообщение об ошибке
            stackTrace: String                         // Stack trace (для отладки)
        }
    },

    // Геолокация события
    location: {
        // Где произошло событие
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: [Number]                      // [longitude, latitude]
        },
        accuracy: Number,
        address: String,

        // Для мобильных событий
        source: String                                 // gps, network, manual
    },

    // Контекст события
    context: {
        // Состояние заказа на момент события
        orderState: {
            status: String,
            masterId: ObjectId,
            price: Number,
            paymentStatus: String
        },

        // Состояние участников
        participants: {
            customer: {
                id: ObjectId,
                location: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                online: Boolean
            },
            master: {
                id: ObjectId,
                location: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                online: Boolean,
                status: String
            }
        },

        // Внешние факторы
        external: {
            weather: String,                           // Погода
            trafficLevel: String,                      // Уровень трафика
            surgeActive: Boolean,                      // Активен ли surge
            surgeMultiplier: Number                    // Множитель surge
        }
    },

    // Метаданные
    metadata: {
        // Версионирование
        schemaVersion: Number,                         // Версия схемы
        appVersion: String,                            // Версия приложения
        apiVersion: String,                            // Версия API

        // Трассировка
        requestId: String,                             // ID запроса
        sessionId: String,                             // ID сессии
        correlationId: String,                         // ID корреляции

        // Дополнительные данные
        tags: [String],                               // Теги для группировки
        flags: [String],                              // Флаги (suspicious, automated, etc.)
        customData: Object                            // Произвольные данные
    },

    // Связанные события
    relatedEvents: [{
        eventId: ObjectId,                            // ID связанного события
        eventType: String,                            // Тип события
        relation: String                              // caused_by, leads_to, related
    }],

    // Флаги
    flags: {
        isDisputed: Boolean,                          // Оспаривается
        isDeleted: Boolean,                           // Удалено (soft delete)
        isArchived: Boolean,                          // Архивировано
        requiresReview: Boolean,                      // Требует проверки
        wasEdited: Boolean                            // Было отредактировано
    },

    // Аудит
    audit: {
        createdAt: Date,
        createdBy: ObjectId,

        // Если запись была изменена
        edits: [{
            editedAt: Date,
            editedBy: ObjectId,
            reason: String,
            changes: Object                           // Что было изменено
        }]
    }
};

// Класс для работы с историей заказов
class OrderHistoryModel {
    constructor(db) {
        this.collection = db.collection('order_history');
        this.setupIndexes();
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Основные индексы
            await this.collection.createIndex({ orderId: 1, timestamp: -1 });
            await this.collection.createIndex({ eventType: 1, timestamp: -1 });
            await this.collection.createIndex({ 'actor.type': 1, 'actor.id': 1 });
            await this.collection.createIndex({ eventCategory: 1, severity: 1 });

            // Индексы для поиска
            await this.collection.createIndex({ timestamp: -1 });
            await this.collection.createIndex({ 'context.orderState.status': 1 });
            await this.collection.createIndex({ 'metadata.requestId': 1 });
            await this.collection.createIndex({ 'metadata.sessionId': 1 });

            // Геопространственный индекс
            await this.collection.createIndex({ 'location.coordinates': '2dsphere' });

            // Индексы для аналитики
            await this.collection.createIndex({
                orderId: 1,
                eventType: 1,
                timestamp: 1
            });

            // Индекс для связанных событий
            await this.collection.createIndex({ 'relatedEvents.eventId': 1 });

            // TTL индекс для архивных записей (опционально)
            // await this.collection.createIndex(
            //     { timestamp: 1 },
            //     { expireAfterSeconds: 365 * 24 * 60 * 60 } // 1 год
            // );

        } catch (error) {
            console.error('Error creating order history indexes:', error);
        }
    }

    // Создание записи истории
    async create(historyData) {
        const now = new Date();

        const history = {
            _id: new ObjectId(),
            ...historyData,

            // Defaults
            severity: historyData.severity || this.determineSeverity(historyData.eventType),
            eventCategory: historyData.eventCategory || this.determineCategory(historyData.eventType),
            timestamp: historyData.timestamp || now,

            metadata: {
                schemaVersion: 1,
                ...historyData.metadata
            },

            flags: {
                isDisputed: false,
                isDeleted: false,
                isArchived: false,
                requiresReview: false,
                wasEdited: false,
                ...historyData.flags
            },

            audit: {
                createdAt: now,
                createdBy: historyData.actor?.id,
                edits: []
            }
        };

        const result = await this.collection.insertOne(history);
        return { ...history, _id: result.insertedId };
    }

    // Массовое создание записей
    async createMany(historyRecords) {
        if (!historyRecords || historyRecords.length === 0) {
            return [];
        }

        const now = new Date();
        const records = historyRecords.map(record => ({
            _id: new ObjectId(),
            severity: this.determineSeverity(record.eventType),
            eventCategory: this.determineCategory(record.eventType),
            timestamp: now,
            metadata: { schemaVersion: 1 },
            flags: {
                isDisputed: false,
                isDeleted: false,
                isArchived: false,
                requiresReview: false,
                wasEdited: false
            },
            audit: {
                createdAt: now,
                createdBy: record.actor?.id,
                edits: []
            },
            ...record
        }));

        const result = await this.collection.insertMany(records);
        return records;
    }

    // Получение истории заказа
    async getOrderHistory(orderId, options = {}) {
        const {
            eventTypes = null,
            categories = null,
            startDate = null,
            endDate = null,
            limit = 100,
            offset = 0,
            includeDeleted = false
        } = options;

        const query = {
            orderId: new ObjectId(orderId)
        };

        // Фильтры
        if (!includeDeleted) {
            query['flags.isDeleted'] = { $ne: true };
        }

        if (eventTypes && eventTypes.length > 0) {
            query.eventType = { $in: eventTypes };
        }

        if (categories && categories.length > 0) {
            query.eventCategory = { $in: categories };
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = startDate;
            if (endDate) query.timestamp.$lte = endDate;
        }

        return await this.collection
            .find(query)
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    // Получение последнего события определенного типа
    async getLastEvent(orderId, eventType) {
        return await this.collection.findOne(
            {
                orderId: new ObjectId(orderId),
                eventType,
                'flags.isDeleted': { $ne: true }
            },
            { sort: { timestamp: -1 } }
        );
    }

    // Получение истории изменения статусов
    async getStatusHistory(orderId) {
        return await this.collection.find({
            orderId: new ObjectId(orderId),
            eventType: HISTORY_EVENT_TYPES.STATUS_CHANGED,
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: 1 })
            .toArray();
    }

    // Получение истории по актору
    async getActorHistory(actorId, actorType, options = {}) {
        const { limit = 100, offset = 0 } = options;

        return await this.collection.find({
            'actor.id': new ObjectId(actorId),
            'actor.type': actorType,
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    // Поиск подозрительных событий
    async findSuspiciousEvents(orderId) {
        return await this.collection.find({
            orderId: new ObjectId(orderId),
            $or: [
                { 'metadata.flags': 'suspicious' },
                { 'flags.requiresReview': true },
                { severity: EVENT_SEVERITY.CRITICAL },
                { eventType: HISTORY_EVENT_TYPES.ERROR_OCCURRED }
            ]
        }).toArray();
    }

    // Агрегация событий для аналитики
    async aggregateEvents(orderId, groupBy = 'eventType') {
        return await this.collection.aggregate([
            {
                $match: {
                    orderId: new ObjectId(orderId),
                    'flags.isDeleted': { $ne: true }
                }
            },
            {
                $group: {
                    _id: `$${groupBy}`,
                    count: { $sum: 1 },
                    firstEvent: { $min: '$timestamp' },
                    lastEvent: { $max: '$timestamp' },
                    actors: { $addToSet: '$actor.id' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();
    }

    // Восстановление состояния заказа на момент времени
    async reconstructOrderState(orderId, targetTime) {
        const events = await this.collection.find({
            orderId: new ObjectId(orderId),
            timestamp: { $lte: targetTime },
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: 1 })
            .toArray();

        // Начальное состояние
        let state = {
            status: ORDER_STATUS.NEW,
            masterId: null,
            price: null,
            location: null
        };

        // Применяем события последовательно
        for (const event of events) {
            if (event.stateChange) {
                if (event.stateChange.status?.to) {
                    state.status = event.stateChange.status.to;
                }
                if (event.stateChange.master?.toId) {
                    state.masterId = event.stateChange.master.toId;
                }
                if (event.stateChange.price?.to) {
                    state.price = event.stateChange.price.to;
                }
                if (event.stateChange.location?.to) {
                    state.location = event.stateChange.location.to;
                }
            }
        }

        return {
            orderId,
            reconstructedAt: targetTime,
            state,
            eventsProcessed: events.length
        };
    }

    // Создание временной шкалы событий
    async createTimeline(orderId) {
        const events = await this.getOrderHistory(orderId, { limit: 1000 });

        const timeline = events.map(event => ({
            timestamp: event.timestamp,
            type: event.eventType,
            category: event.eventCategory,
            severity: event.severity,
            actor: `${event.actor.type}:${event.actor.name || event.actor.id}`,
            summary: this.generateEventSummary(event)
        }));

        return timeline;
    }

    // Вспомогательные методы

    // Определение важности события
    determineSeverity(eventType) {
        const criticalEvents = [
            HISTORY_EVENT_TYPES.ORDER_FAILED,
            HISTORY_EVENT_TYPES.PAYMENT_FAILED,
            HISTORY_EVENT_TYPES.ERROR_OCCURRED
        ];

        const highEvents = [
            HISTORY_EVENT_TYPES.ORDER_CANCELLED,
            HISTORY_EVENT_TYPES.DISPUTE_OPENED,
            HISTORY_EVENT_TYPES.COMPLAINT_FILED
        ];

        const lowEvents = [
            HISTORY_EVENT_TYPES.LOCATION_UPDATED,
            HISTORY_EVENT_TYPES.MESSAGE_SENT,
            HISTORY_EVENT_TYPES.NOTIFICATION_SENT
        ];

        if (criticalEvents.includes(eventType)) return EVENT_SEVERITY.CRITICAL;
        if (highEvents.includes(eventType)) return EVENT_SEVERITY.HIGH;
        if (lowEvents.includes(eventType)) return EVENT_SEVERITY.LOW;

        return EVENT_SEVERITY.MEDIUM;
    }

    // Определение категории события
    determineCategory(eventType) {
        const categoryMap = {
            [HISTORY_EVENT_TYPES.ORDER_CREATED]: EVENT_CATEGORIES.LIFECYCLE,
            [HISTORY_EVENT_TYPES.STATUS_CHANGED]: EVENT_CATEGORIES.LIFECYCLE,
            [HISTORY_EVENT_TYPES.MASTER_ASSIGNED]: EVENT_CATEGORIES.ASSIGNMENT,
            [HISTORY_EVENT_TYPES.PAYMENT_COMPLETED]: EVENT_CATEGORIES.FINANCIAL,
            [HISTORY_EVENT_TYPES.LOCATION_UPDATED]: EVENT_CATEGORIES.LOCATION,
            [HISTORY_EVENT_TYPES.MESSAGE_SENT]: EVENT_CATEGORIES.COMMUNICATION,
            [HISTORY_EVENT_TYPES.RATING_GIVEN]: EVENT_CATEGORIES.FEEDBACK,
            [HISTORY_EVENT_TYPES.SYSTEM_ACTION]: EVENT_CATEGORIES.SYSTEM
        };

        // Определяем категорию по префиксу типа события
        for (const [prefix, category] of Object.entries({
            'order_': EVENT_CATEGORIES.LIFECYCLE,
            'master_': EVENT_CATEGORIES.ASSIGNMENT,
            'search_': EVENT_CATEGORIES.ASSIGNMENT,
            'payment_': EVENT_CATEGORIES.FINANCIAL,
            'price_': EVENT_CATEGORIES.FINANCIAL,
            'location_': EVENT_CATEGORIES.LOCATION,
            'message_': EVENT_CATEGORIES.COMMUNICATION,
            'rating_': EVENT_CATEGORIES.FEEDBACK,
            'system_': EVENT_CATEGORIES.SYSTEM
        })) {
            if (eventType.startsWith(prefix)) {
                return category;
            }
        }

        return categoryMap[eventType] || EVENT_CATEGORIES.SYSTEM;
    }

    // Генерация краткого описания события
    generateEventSummary(event) {
        const summaries = {
            [HISTORY_EVENT_TYPES.ORDER_CREATED]: 'Заказ создан',
            [HISTORY_EVENT_TYPES.STATUS_CHANGED]: `Статус изменен: ${event.stateChange?.status?.from} → ${event.stateChange?.status?.to}`,
            [HISTORY_EVENT_TYPES.MASTER_ASSIGNED]: `Назначен мастер: ${event.stateChange?.master?.toName}`,
            [HISTORY_EVENT_TYPES.PAYMENT_COMPLETED]: `Оплата завершена: ${event.details?.financial?.amount} UZS`,
            [HISTORY_EVENT_TYPES.MASTER_ARRIVED]: 'Мастер прибыл на место'
        };

        return summaries[event.eventType] || event.eventType;
    }

    // Мягкое удаление записи
    async softDelete(historyId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(historyId) },
            {
                $set: {
                    'flags.isDeleted': true,
                    'audit.edits': {
                        $push: {
                            editedAt: new Date(),
                            reason: 'soft_delete'
                        }
                    }
                }
            }
        );
    }
}

// Экспортируем
module.exports = {
    OrderHistoryModel,
    HISTORY_EVENT_TYPES,
    EVENT_CATEGORIES,
    EVENT_SEVERITY,
    orderHistorySchema
};