// config/notification.config.js

'use strict';

module.exports = {
    // Основные настройки
    general: {
        enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
        batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || 100),
        defaultLanguage: process.env.DEFAULT_LOCALE || 'ru',
        supportedLanguages: ['ru', 'uz', 'en'],

        // Режимы работы
        testMode: process.env.NODE_ENV === 'test',
        dryRun: process.env.NOTIFICATION_DRY_RUN === 'true',

        // Логирование
        logLevel: process.env.NOTIFICATION_LOG_LEVEL || 'info',
        debugChannels: process.env.DEBUG_CHANNELS?.split(',') || []
    },

    // Типы уведомлений (приоритеты и настройки)
    types: {
        // OTP и авторизация
        OTP_CODE: {
            channels: ['sms'],
            priority: 'critical',
            ttl: 300, // 5 минут
            noThrottle: true,
            requireDelivery: true
        },

        // Заказы - критичные
        ORDER_CREATED: {
            channels: ['push', 'sms'],
            priority: 'high',
            ttl: 3600,
            template: 'order_created'
        },
        ORDER_ASSIGNED: {
            channels: ['push', 'sms', 'inApp'],
            priority: 'critical',
            ttl: 1800,
            requireAck: true
        },
        ORDER_ARRIVING: {
            channels: ['push', 'inApp'],
            priority: 'high',
            ttl: 600,
            sound: 'arriving.mp3'
        },
        ORDER_COMPLETED: {
            channels: ['push', 'email', 'inApp'],
            priority: 'normal',
            ttl: 86400
        },
        ORDER_CANCELLED: {
            channels: ['push', 'sms', 'inApp'],
            priority: 'high',
            ttl: 3600
        },

        // Платежи
        PAYMENT_SUCCESS: {
            channels: ['push', 'email', 'inApp'],
            priority: 'high',
            ttl: 86400,
            template: 'payment_success'
        },
        PAYMENT_FAILED: {
            channels: ['push', 'sms', 'inApp'],
            priority: 'high',
            ttl: 3600
        },

        // Маркетинг и промо
        PROMO_OFFER: {
            channels: ['push', 'email'],
            priority: 'low',
            ttl: 604800, // 7 дней
            respectQuietHours: true,
            requireConsent: true
        },

        // Системные
        SYSTEM_MAINTENANCE: {
            channels: ['push', 'email', 'inApp'],
            priority: 'normal',
            ttl: 86400
        },
        ACCOUNT_SECURITY: {
            channels: ['sms', 'email'],
            priority: 'critical',
            ttl: 3600,
            noThrottle: true
        }
    },

    // Настройки каналов доставки
    channels: {
        // Push уведомления (FCM)
        push: {
            enabled: process.env.FCM_ENABLED !== 'false',
            provider: 'fcm',

            fcm: {
                serverKey: process.env.FCM_SERVER_KEY,
                senderId: process.env.FCM_SENDER_ID,
                apiUrl: 'https://fcm.googleapis.com/fcm/send',

                // Настройки отправки
                options: {
                    priority: 'high',
                    contentAvailable: true,
                    mutableContent: true,
                    ttl: 86400, // 24 часа по умолчанию

                    // Android специфичные
                    android: {
                        channelId: 'yordam24_default',
                        sound: 'default',
                        color: '#FF6B00',
                        icon: 'ic_notification'
                    },

                    // iOS специфичные
                    ios: {
                        sound: 'default.caf',
                        badge: true,
                        alert: true
                    }
                }
            },

            // Rate limiting
            rateLimit: {
                perDevice: {
                    hourly: 20,
                    daily: 100
                },
                perUser: {
                    hourly: 50,
                    daily: 200
                }
            },

            // Retry политика
            retry: {
                enabled: true,
                maxAttempts: 3,
                backoff: 'exponential',
                delays: [1000, 5000, 15000] // мс
            }
        },

        // SMS уведомления
        sms: {
            enabled: process.env.SMS_ENABLED !== 'false',
            primaryProvider: process.env.SMS_PROVIDER || 'playmobile',

            // Провайдеры для Узбекистана
            providers: {
                playmobile: {
                    enabled: true,
                    priority: 1,
                    apiUrl: process.env.PLAYMOBILE_URL || 'https://api.playmobile.uz/v1/sms/send',
                    apiKey: process.env.PLAYMOBILE_API_KEY,
                    sender: process.env.PLAYMOBILE_SENDER || 'Yordam24',

                    // Специфичные настройки
                    supportsBulk: true,
                    maxBulkSize: 1000,
                    encoding: 'utf-8',

                    // Стоимость (для аналитики)
                    pricing: {
                        local: 25, // сум за SMS
                        international: 150
                    }
                },

                eskiz: {
                    enabled: !!process.env.ESKIZ_EMAIL,
                    priority: 2,
                    apiUrl: process.env.ESKIZ_URL || 'https://notify.eskiz.uz/api/message/sms/send',
                    authUrl: 'https://notify.eskiz.uz/api/auth/login',
                    email: process.env.ESKIZ_EMAIL,
                    password: process.env.ESKIZ_PASSWORD,
                    sender: process.env.ESKIZ_SENDER || 'Yordam24',

                    tokenTTL: 25 * 24 * 60 * 60, // 25 дней
                    supportsBulk: true,
                    maxBulkSize: 500
                },

                smsfly: {
                    enabled: !!process.env.SMSFLY_API_KEY,
                    priority: 3,
                    apiUrl: process.env.SMSFLY_URL || 'https://sms-fly.com/api/v2/api.php',
                    apiKey: process.env.SMSFLY_API_KEY,
                    sender: process.env.SMSFLY_SENDER || 'Yordam24',

                    supportsBulk: false
                }
            },

            // Общие настройки SMS
            settings: {
                // Длина сообщения
                maxLength: 160,
                maxParts: 3,
                encoding: 'utf-8',

                // Валидация номеров для UZ
                phoneValidation: {
                    pattern: /^\+998[0-9]{9}$/,
                    prefixes: ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88']
                },

                // Подозрительные паттерны
                suspiciousPatterns: [
                    /^998[0-9]{2}0{7}$/,
                    /^998[0-9]{2}1{7}$/,
                    /^998[0-9]{2}123456/
                ]
            },

            // Rate limiting
            rateLimit: {
                global: {
                    perSecond: 10,
                    perMinute: 300,
                    perHour: 5000
                },
                perPhone: {
                    hourly: 5,
                    daily: 20
                },
                perUser: {
                    hourly: 10,
                    daily: 50
                }
            },

            // Security
            security: {
                blacklistTTL: 86400, // 24 часа
                maxOTPperPhone: 5, // за час
                blockAfterFailures: 10
            },

            // Retry
            retry: {
                enabled: true,
                maxAttempts: 2,
                delays: [5000, 15000],
                changeProvider: true // Пробовать другого провайдера
            }
        },

        // Email уведомления
        email: {
            enabled: process.env.EMAIL_ENABLED !== 'false',
            provider: process.env.EMAIL_PROVIDER || 'smtp',

            smtp: {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || 587),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                },

                // Настройки отправителя
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Yordam24',
                    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@yordam24.uz'
                },

                // Настройки пула
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            },

            // Шаблоны
            templates: {
                path: './templates/email',
                engine: 'handlebars',
                cache: process.env.NODE_ENV === 'production'
            },

            // Rate limiting
            rateLimit: {
                perEmail: {
                    hourly: 5,
                    daily: 20
                },
                perUser: {
                    hourly: 10,
                    daily: 50
                }
            },

            // Retry
            retry: {
                enabled: true,
                maxAttempts: 3,
                delays: [30000, 300000] // 30 сек, 5 мин
            }
        },

        // In-App уведомления
        inApp: {
            enabled: true,

            // Настройки хранения
            storage: {
                ttl: 30 * 24 * 60 * 60, // 30 дней
                maxPerUser: 100,

                // Автоочистка
                autoCleanup: {
                    enabled: true,
                    olderThan: 90 * 24 * 60 * 60, // 90 дней
                    readOlderThan: 30 * 24 * 60 * 60 // 30 дней для прочитанных
                }
            },

            // WebSocket настройки
            realtime: {
                enabled: true,
                broadcastDelay: 100 // мс
            }
        }
    },

    // Настройки приоритетов
    priorities: {
        critical: {
            order: 0,
            skipThrottle: true,
            skipQuietHours: true,
            requireDelivery: true,
            alertOncall: true
        },
        high: {
            order: 1,
            skipThrottle: false,
            skipQuietHours: true,
            requireDelivery: true
        },
        normal: {
            order: 2,
            skipThrottle: false,
            skipQuietHours: false,
            requireDelivery: false
        },
        low: {
            order: 3,
            skipThrottle: false,
            skipQuietHours: false,
            requireDelivery: false,
            batchable: true
        }
    },

    // Throttling (ограничение частоты)
    throttling: {
        enabled: process.env.THROTTLING_ENABLED !== 'false',

        // Глобальные лимиты
        global: {
            perSecond: 100,
            perMinute: 3000,
            perHour: 50000
        },

        // По типам
        byType: {
            marketing: {
                perUserDaily: 3,
                perUserWeekly: 10
            },
            transactional: {
                perUserHourly: 20,
                perUserDaily: 100
            }
        },

        // Исключения
        whitelist: {
            users: process.env.THROTTLE_WHITELIST_USERS?.split(',') || [],
            types: ['OTP_CODE', 'ACCOUNT_SECURITY']
        }
    },

    // Quiet hours (тихие часы)
    quietHours: {
        enabled: process.env.QUIET_HOURS_ENABLED !== 'false',

        // Дефолтные настройки
        default: {
            start: '22:00',
            end: '08:00',
            timezone: 'Asia/Tashkent',

            // Разрешенные типы в тихие часы
            allowedTypes: [
                'OTP_CODE',
                'ORDER_ASSIGNED',
                'ACCOUNT_SECURITY',
                'PAYMENT_FAILED'
            ]
        },

        // Можно переопределить для пользователя
        respectUserPreferences: true
    },

    // Шаблоны
    templates: {
        // Путь к шаблонам
        basePath: './templates/notifications',

        // Движок шаблонов
        engine: 'handlebars',

        // Кэширование
        cache: {
            enabled: process.env.NODE_ENV === 'production',
            ttl: 3600 // 1 час
        },

        // Переменные по умолчанию
        defaultVars: {
            appName: 'Yordam24',
            supportPhone: '+998 71 200 00 24',
            supportEmail: 'support@yordam24.uz',
            website: 'https://yordam24.uz'
        },

        // Хелперы для шаблонов
        helpers: {
            formatPrice: 'number_format',
            formatDate: 'date_format',
            pluralize: 'pluralize'
        }
    },

    // Батчинг (группировка)
    batching: {
        enabled: true,

        // Настройки батчей
        settings: {
            maxBatchSize: 1000,
            batchWindow: 60000, // 1 минута

            // Группировка по
            groupBy: ['type', 'channel', 'priority'],

            // Типы, которые можно батчить
            batchableTypes: [
                'PROMO_OFFER',
                'SYSTEM_UPDATE',
                'NEWSLETTER'
            ]
        }
    },

    // A/B тестирование
    experiments: {
        enabled: process.env.AB_TESTING_ENABLED === 'true',

        // Активные эксперименты
        active: {
            pushTiming: {
                enabled: false,
                variants: ['immediate', 'delayed_5m', 'delayed_15m'],
                allocation: [0.33, 0.33, 0.34]
            },
            smsContent: {
                enabled: false,
                variants: ['short', 'detailed'],
                allocation: [0.5, 0.5]
            }
        }
    },

    // Аналитика
    analytics: {
        enabled: true,

        // Трекинг событий
        events: {
            sent: true,
            delivered: true,
            opened: true,
            clicked: true,
            converted: true,
            failed: true
        },

        // Экспорт метрик
        export: {
            enabled: process.env.METRICS_EXPORT_ENABLED === 'true',
            interval: 60000, // 1 минута

            // Prometheus метрики
            prometheus: {
                enabled: true,
                prefix: 'yordam24_notifications_'
            }
        }
    },

    // Очереди и обработка
    processing: {
        // Настройки воркеров
        workers: {
            push: parseInt(process.env.PUSH_WORKERS || 3),
            sms: parseInt(process.env.SMS_WORKERS || 2),
            email: parseInt(process.env.EMAIL_WORKERS || 2),
            inApp: parseInt(process.env.INAPP_WORKERS || 1)
        },

        // Настройки очередей
        queues: {
            // Приоритетные очереди
            priorities: {
                critical: { concurrency: 10, rateLimit: null },
                high: { concurrency: 5, rateLimit: 100 },
                normal: { concurrency: 3, rateLimit: 50 },
                low: { concurrency: 1, rateLimit: 10 }
            },

            // Dead letter queue
            dlq: {
                enabled: true,
                maxRetries: 3,
                ttl: 7 * 24 * 60 * 60 // 7 дней
            }
        },

        // Обработка ошибок
        errorHandling: {
            // Действия при ошибках
            strategies: {
                'rate_limited': 'exponential_backoff',
                'provider_error': 'failover',
                'invalid_token': 'remove_token',
                'user_blocked': 'disable_channel'
            },

            // Алерты
            alerts: {
                enabled: true,
                thresholds: {
                    errorRate: 0.1, // 10%
                    consecutiveFailures: 10
                }
            }
        }
    },

    // Безопасность
    security: {
        // Шифрование чувствительных данных
        encryption: {
            enabled: process.env.ENCRYPT_NOTIFICATIONS === 'true',
            algorithm: 'aes-256-gcm',
            fields: ['content.body', 'content.data']
        },

        // Аудит
        audit: {
            enabled: true,
            logLevel: 'info',

            // События для аудита
            events: [
                'notification_sent',
                'notification_failed',
                'user_unsubscribed',
                'token_invalid'
            ]
        },

        // Защита от спама
        antispam: {
            enabled: true,

            // Проверки
            checks: {
                duplicateContent: true,
                rateLimits: true,
                blacklist: true
            }
        }
    },

    // Фолбэки и деградация
    fallbacks: {
        // Альтернативные каналы
        channelFallbacks: {
            push: ['sms', 'email'],
            sms: ['email', 'push'],
            email: ['push', 'sms']
        },

        // Деградация при нагрузке
        degradation: {
            enabled: true,
            thresholds: {
                cpuUsage: 80,
                memoryUsage: 85,
                queueSize: 10000
            },

            // Действия при деградации
            actions: {
                disableLowPriority: true,
                reduceWorkers: true,
                enableBatching: true
            }
        }
    },

    // Локализация
    localization: {
        defaultLanguage: 'ru',
        fallbackLanguage: 'ru',

        // Поддерживаемые языки
        languages: {
            ru: { name: 'Русский', enabled: true },
            uz: { name: "O'zbek", enabled: true },
            en: { name: 'English', enabled: true }
        },

        // Детекция языка
        detection: {
            fromUser: true,
            fromDevice: true,
            fromGeo: false
        }
    },

    // Мониторинг и health checks
    monitoring: {
        healthCheck: {
            enabled: true,
            interval: 30000, // 30 секунд

            // Проверки
            checks: {
                providers: true,
                queues: true,
                workers: true,
                database: true
            }
        },

        // Метрики
        metrics: {
            // Счетчики
            counters: [
                'notifications_sent_total',
                'notifications_failed_total',
                'notifications_delivered_total'
            ],

            // Гистограммы
            histograms: [
                'notification_processing_duration',
                'notification_delivery_time'
            ],

            // Gauges
            gauges: [
                'notification_queue_size',
                'active_workers'
            ]
        }
    }
};