// config/order.config.js

'use strict';

const { ORDER_STATUS, STATUS_TIMEOUTS } = require('../src/utils/constants/order-status');
const { SERVICE_TYPES } = require('../src/utils/constants/service-types');
const { TIME_WINDOWS } = require('../src/utils/constants/time-constants');
const { LIMITS } = require('../src/utils/constants/validation-rules');

module.exports = {
    // Основные настройки
    general: {
        // Префикс номера заказа
        numberPrefix: process.env.ORDER_NUMBER_PREFIX || 'Y24',

        // Типы заказов
        types: {
            IMMEDIATE: 'immediate',
            SCHEDULED: 'scheduled',
            RECURRING: 'recurring'
        },

        // Источники заказов
        sources: {
            MOBILE_APP: 'mobile_app',
            WEB: 'web',
            CALL_CENTER: 'call_center',
            API: 'api'
        },

        // Приоритеты
        priorities: {
            LOW: { value: 0, label: 'low' },
            NORMAL: { value: 1, label: 'normal' },
            HIGH: { value: 2, label: 'high' },
            URGENT: { value: 3, label: 'urgent' },
            CRITICAL: { value: 4, label: 'critical' }
        }
    },

    // Временные ограничения (в миллисекундах)
    timeouts: {
        // Поиск мастера
        search: {
            initial: parseInt(process.env.ORDER_SEARCH_TIMEOUT) || 300000,      // 5 минут
            extended: parseInt(process.env.ORDER_SEARCH_EXTENDED) || 600000,    // 10 минут
            max: parseInt(process.env.ORDER_SEARCH_MAX) || 900000              // 15 минут
        },

        // Ответ мастера
        response: {
            default: parseInt(process.env.MASTER_RESPONSE_TIMEOUT) || 30000,    // 30 секунд
            busy: 45000,                                                        // 45 секунд в час пик
            night: 60000                                                        // 60 секунд ночью
        },

        // Прибытие
        arrival: {
            city: 1800000,      // 30 минут в городе
            suburb: 2700000,    // 45 минут в пригороде
            rush: 3600000,      // 60 минут в час пик
            max: 5400000        // 90 минут максимум
        },

        // Выполнение работы
        work: {
            min: 600000,        // 10 минут минимум
            standard: 3600000,  // 1 час стандарт
            complex: 7200000,   // 2 часа сложные работы
            max: 10800000       // 3 часа максимум
        },

        // Оплата
        payment: {
            immediate: 300000,  // 5 минут на оплату на месте
            deferred: 86400000  // 24 часа отложенная оплата
        },

        // Отмена
        cancellation: {
            free: 120000,       // 2 минуты бесплатная отмена
            penalty: 300000     // 5 минут отмена со штрафом
        }
    },

    // Лимиты и ограничения
    limits: {
        // Заказы пользователя
        customer: {
            maxActiveOrders: parseInt(process.env.MAX_ACTIVE_ORDERS_PER_CUSTOMER) || 3,
            maxDailyOrders: parseInt(process.env.MAX_DAILY_ORDERS_PER_CUSTOMER) || 20,
            maxMonthlyOrders: 200,

            // Отмены
            maxFreeCancellations: 3,        // В месяц
            cancellationPenaltyRate: 0.1    // 10% от стоимости
        },

        // Заказы мастера
        master: {
            maxActiveOrders: 3,
            maxDailyOrders: 15,

            // Отклонения
            maxDailyRejections: 5,
            rejectionPenaltyThreshold: 0.3  // 30% отклонений = штраф
        },

        // Планирование
        scheduling: {
            minAheadTime: 300000,           // 5 минут минимум
            maxAheadTime: 2592000000,       // 30 дней максимум
            maxRecurringPeriod: 7776000000  // 90 дней
        },

        // Поиск
        search: {
            initialRadius: 3000,             // 3 км начальный радиус
            radiusStep: 2000,                // Шаг расширения 2 км
            maxRadius: 50000,                // 50 км максимум
            minCandidates: 3,                // Минимум кандидатов
            maxCandidates: 20,               // Максимум кандидатов
            maxAttempts: 5                   // Максимум попыток поиска
        },

        // Медиа файлы
        media: {
            maxPhotos: 5,
            maxPhotoSize: 5242880,           // 5MB
            maxVideoSize: 52428800,          // 50MB
            maxTotalSize: 104857600,         // 100MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
        }
    },

    // Статусы и переходы
    statuses: {
        // Используем константы из order-status.js
        ...ORDER_STATUS,

        // Финальные статусы (для быстрой проверки)
        final: [
            ORDER_STATUS.COMPLETED,
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.FAILED,
            ORDER_STATUS.EXPIRED
        ],

        // Активные статусы
        active: [
            ORDER_STATUS.NEW,
            ORDER_STATUS.SEARCHING,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.EN_ROUTE,
            ORDER_STATUS.ARRIVED,
            ORDER_STATUS.IN_PROGRESS
        ],

        // Статусы, когда можно отменить
        cancellable: [
            ORDER_STATUS.NEW,
            ORDER_STATUS.SEARCHING,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.EN_ROUTE
        ]
    },

    // Правила поиска и назначения
    assignment: {
        // Методы назначения
        methods: {
            AUTO: 'auto',                    // Автоматический подбор
            MANUAL: 'manual',                // Ручное назначение
            CUSTOMER_CHOICE: 'customer',     // Выбор клиента
            PREFERRED: 'preferred'           // Предпочитаемый мастер
        },

        // Алгоритм подбора
        algorithm: {
            // Веса факторов (сумма = 1.0)
            weights: {
                distance: 0.3,               // 30% - расстояние
                rating: 0.25,                // 25% - рейтинг
                experience: 0.15,            // 15% - опыт
                price: 0.15,                 // 15% - цена
                availability: 0.1,           // 10% - доступность
                loyalty: 0.05                // 5% - лояльность
            },

            // Пороги
            thresholds: {
                minRating: 3.5,              // Минимальный рейтинг
                maxDistance: 20000,          // Максимальное расстояние (м)
                minBatteryLevel: 20,         // Минимальный заряд батареи
                maxActiveOrders: 3           // Максимум активных заказов
            },

            // Бонусы/штрафы
            modifiers: {
                preferredMaster: 1.5,        // x1.5 для предпочитаемых
                previousMaster: 1.3,         // x1.3 для прошлых мастеров
                lowBattery: 0.8,             // x0.8 при низком заряде
                highLoad: 0.7,               // x0.7 при высокой загрузке
                recentRejection: 0.5         // x0.5 после недавнего отказа
            }
        },

        // Настройки уведомлений
        notifications: {
            batchSize: 5,                    // Уведомлять по 5 мастеров
            batchDelay: 10000,               // 10 секунд между батчами
            maxBatches: 4,                   // Максимум 4 батча (20 мастеров)

            // Приоритетное уведомление
            priority: {
                vipCustomer: true,           // VIP клиенты
                urgentOrder: true,           // Срочные заказы
                preferredMaster: true        // Предпочитаемые мастера
            }
        }
    },

    // Ценообразование
    pricing: {
        // Комиссии платформы
        commission: {
            base: 0.15,                      // 15% базовая

            // По типам исполнителей
            byExecutorType: {
                master: 0.15,                // 15% с независимых мастеров
                sto_employee: 0.10,          // 10% с сотрудников СТО
                sto: 0.10,                   // 10% с СТО
                specialist: 0.12             // 12% со специалистов
            },

            // Льготы
            discounts: {
                newMaster: 0.5,              // 50% скидка первый месяц
                highVolume: 0.9,             // 10% скидка за объем
                vipPartner: 0.8              // 20% скидка VIP партнерам
            }
        },

        // Минимальные суммы
        minimums: {
            orderAmount: 30000,              // Минимальная сумма заказа
            platformFee: 5000,               // Минимальная комиссия
            cancellationFee: 10000           // Минимальный штраф за отмену
        },

        // Дополнительные сборы
        surcharges: {
            night: 0.3,                      // +30% ночью (22:00-06:00)
            weekend: 0.2,                    // +20% в выходные
            holiday: 0.5,                    // +50% в праздники
            urgent: 0.3,                     // +30% за срочность
            distance: 5000                   // 5000 сум/км свыше лимита
        }
    },

    // Рейтинги и отзывы
    feedback: {
        // Настройки рейтинга
        rating: {
            scale: { min: 1, max: 5 },
            required: true,                  // Обязательная оценка

            // Категории оценки
            categories: [
                'quality',                   // Качество работы
                'speed',                     // Скорость выполнения
                'price',                     // Соответствие цены
                'communication',             // Общение
                'cleanliness'               // Чистота/аккуратность
            ],

            // Веса категорий для общего рейтинга
            weights: {
                quality: 0.4,
                speed: 0.2,
                price: 0.15,
                communication: 0.15,
                cleanliness: 0.1
            }
        },

        // Временные ограничения
        timeLimit: 604800000,                // 7 дней на оставление отзыва
        editWindow: 86400000,                // 24 часа на редактирование

        // Модерация
        moderation: {
            enabled: true,
            autoApprove: true,               // Автоодобрение

            // Триггеры для ручной модерации
            triggers: {
                lowRating: 2,                // Рейтинг <= 2
                keywords: ['обман', 'мошенник', 'украл'],
                complaintsCount: 3           // 3+ жалобы
            }
        }
    },

    // Повторяющиеся заказы
    recurring: {
        // Частоты повторения
        frequencies: {
            DAILY: { value: 'daily', interval: 86400000 },
            WEEKLY: { value: 'weekly', interval: 604800000 },
            BIWEEKLY: { value: 'biweekly', interval: 1209600000 },
            MONTHLY: { value: 'monthly', interval: 2592000000 }
        },

        // Настройки
        settings: {
            maxActive: 5,                    // Максимум активных подписок
            advanceNotice: 86400000,         // Уведомление за 24 часа
            autoConfirm: false,              // Автоподтверждение

            // Пропуски
            maxSkips: 3,                     // Максимум пропусков подряд
            skipOnHolidays: true,            // Пропускать в праздники

            // Отмена
            cancellationNotice: 172800000    // 48 часов до отмены
        }
    },

    // Коммуникация
    communication: {
        // Чат
        chat: {
            enabled: true,
            maxMessageLength: 1000,
            maxMediaSize: 10485760,          // 10MB

            // Автосообщения
            autoMessages: {
                onAssign: true,              // При назначении
                onArrival: true,             // При прибытии
                onComplete: true             // При завершении
            }
        },

        // Звонки
        calls: {
            enabled: true,
            provider: process.env.CALL_PROVIDER || 'twilio',

            // Маскировка номеров
            masking: {
                enabled: true,
                duration: 86400000           // 24 часа после заказа
            },

            // Лимиты
            limits: {
                maxDuration: 600,            // 10 минут максимум
                maxPerOrder: 5               // 5 звонков на заказ
            }
        }
    },

    // Безопасность и антифрод
    security: {
        // Подозрительная активность
        fraud: {
            triggers: {
                // Клиент
                customer: {
                    tooManyOrders: 10,       // 10+ заказов в день
                    tooManyCancellations: 5, // 5+ отмен в день
                    unusualLocations: 5,     // 5+ разных локаций
                    rapidOrders: 3           // 3+ заказа за час
                },

                // Мастер
                master: {
                    tooManyRejections: 10,   // 10+ отказов в день
                    suspiciousRoute: true,   // Странный маршрут
                    quickCompletion: 300     // Завершение < 5 минут
                }
            },

            // Действия
            actions: {
                flag: true,                  // Пометить
                notify: true,                // Уведомить безопасность
                block: false,                // Блокировать
                requireVerification: true    // Требовать проверку
            }
        },

        // Верификация
        verification: {
            // Фото подтверждение
            photoProof: {
                required: ['towing', 'complex_service'],
                beforeWork: true,
                afterWork: true
            },

            // Геолокация
            location: {
                continuous: true,            // Постоянное отслеживание
                accuracy: 50,                // Точность 50м
                spoofingCheck: true          // Проверка подделки
            }
        }
    },

    // Аналитика и метрики
    analytics: {
        // Что отслеживать
        track: {
            searchTime: true,
            responseTime: true,
            arrivalTime: true,
            completionTime: true,
            cancellationRate: true,
            customerSatisfaction: true,
            masterUtilization: true
        },

        // Цели SLA
        sla: {
            searchTime: 180,                 // 3 минуты
            responseTime: 30,                // 30 секунд
            arrivalTime: 1800,               // 30 минут
            completionRate: 0.95,            // 95%
            satisfactionScore: 4.5           // 4.5+
        },

        // Алерты
        alerts: {
            slaViolation: true,
            highCancellation: true,
            lowSatisfaction: true,
            fraudDetection: true
        }
    },

    // Интеграции
    integrations: {
        // Карты
        maps: {
            provider: process.env.MAPS_PROVIDER || 'google',

            // Настройки маршрутизации
            routing: {
                mode: 'driving',
                avoidTolls: false,
                avoidHighways: false,
                optimizeWaypoints: true
            },

            // Обновление ETA
            eta: {
                updateInterval: 30000,       // 30 секунд
                significantChange: 120       // 2 минуты изменение
            }
        },

        // Платежи
        payments: {
            providers: {
                payme: { enabled: true, priority: 1 },
                click: { enabled: true, priority: 2 },
                uzcard: { enabled: true, priority: 3 }
            },

            // Автоматические действия
            auto: {
                chargeOnComplete: false,     // Автосписание
                refundOnCancel: true,        // Автовозврат
                holdAmount: true             // Холдирование
            }
        }
    },

    // Кэширование
    cache: {
        // TTL в секундах
        ttl: {
            orderDetails: 300,               // 5 минут
            customerOrders: 60,              // 1 минута
            masterOrders: 60,                // 1 минута
            searchResults: 30,               // 30 секунд
            pricing: 600                     // 10 минут
        },

        // Префиксы ключей
        keys: {
            order: 'order:',
            search: 'order:search:',
            pricing: 'order:price:',
            tracking: 'order:track:'
        }
    },

    // Очереди и воркеры
    queues: {
        // Названия очередей
        names: {
            search: 'order.search',
            assignment: 'order.assignment',
            notification: 'order.notification',
            tracking: 'order.tracking',
            completion: 'order.completion',
            analytics: 'order.analytics'
        },

        // Настройки обработки
        processing: {
            search: {
                concurrency: 10,
                timeout: 30000,
                retries: 3
            },
            assignment: {
                concurrency: 20,
                timeout: 10000,
                retries: 2
            },
            tracking: {
                concurrency: 50,
                timeout: 5000,
                retries: 1
            }
        }
    }
};