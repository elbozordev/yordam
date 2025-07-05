

'use strict';

module.exports = {
    
    general: {
        enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
        batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || 100),
        defaultLanguage: process.env.DEFAULT_LOCALE || 'ru',
        supportedLanguages: ['ru', 'uz', 'en'],

        
        testMode: process.env.NODE_ENV === 'test',
        dryRun: process.env.NOTIFICATION_DRY_RUN === 'true',

        
        logLevel: process.env.NOTIFICATION_LOG_LEVEL || 'info',
        debugChannels: process.env.DEBUG_CHANNELS?.split(',') || []
    },

    
    types: {
        
        OTP_CODE: {
            channels: ['sms'],
            priority: 'critical',
            ttl: 300, 
            noThrottle: true,
            requireDelivery: true
        },

        
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

        
        PROMO_OFFER: {
            channels: ['push', 'email'],
            priority: 'low',
            ttl: 604800, 
            respectQuietHours: true,
            requireConsent: true
        },

        
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

    
    channels: {
        
        push: {
            enabled: process.env.FCM_ENABLED !== 'false',
            provider: 'fcm',

            fcm: {
                serverKey: process.env.FCM_SERVER_KEY,
                senderId: process.env.FCM_SENDER_ID,
                apiUrl: 'https:

                
                options: {
                    priority: 'high',
                    contentAvailable: true,
                    mutableContent: true,
                    ttl: 86400, 

                    
                    android: {
                        channelId: 'yordam24_default',
                        sound: 'default',
                        color: '#FF6B00',
                        icon: 'ic_notification'
                    },

                    
                    ios: {
                        sound: 'default.caf',
                        badge: true,
                        alert: true
                    }
                }
            },

            
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

            
            retry: {
                enabled: true,
                maxAttempts: 3,
                backoff: 'exponential',
                delays: [1000, 5000, 15000] 
            }
        },

        
        sms: {
            enabled: process.env.SMS_ENABLED !== 'false',
            primaryProvider: process.env.SMS_PROVIDER || 'playmobile',

            
            providers: {
                playmobile: {
                    enabled: true,
                    priority: 1,
                    apiUrl: process.env.PLAYMOBILE_URL || 'https:
                    apiKey: process.env.PLAYMOBILE_API_KEY,
                    sender: process.env.PLAYMOBILE_SENDER || 'Yordam24',

                    
                    supportsBulk: true,
                    maxBulkSize: 1000,
                    encoding: 'utf-8',

                    
                    pricing: {
                        local: 25, 
                        international: 150
                    }
                },

                eskiz: {
                    enabled: !!process.env.ESKIZ_EMAIL,
                    priority: 2,
                    apiUrl: process.env.ESKIZ_URL || 'https:
                    authUrl: 'https:
                    email: process.env.ESKIZ_EMAIL,
                    password: process.env.ESKIZ_PASSWORD,
                    sender: process.env.ESKIZ_SENDER || 'Yordam24',

                    tokenTTL: 25 * 24 * 60 * 60, 
                    supportsBulk: true,
                    maxBulkSize: 500
                },

                smsfly: {
                    enabled: !!process.env.SMSFLY_API_KEY,
                    priority: 3,
                    apiUrl: process.env.SMSFLY_URL || 'https:
                    apiKey: process.env.SMSFLY_API_KEY,
                    sender: process.env.SMSFLY_SENDER || 'Yordam24',

                    supportsBulk: false
                }
            },

            
            settings: {
                
                maxLength: 160,
                maxParts: 3,
                encoding: 'utf-8',

                
                phoneValidation: {
                    pattern: /^\+998[0-9]{9}$/,
                    prefixes: ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88']
                },

                
                suspiciousPatterns: [
                    /^998[0-9]{2}0{7}$/,
                    /^998[0-9]{2}1{7}$/,
                    /^998[0-9]{2}123456/
                ]
            },

            
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

            
            security: {
                blacklistTTL: 86400, 
                maxOTPperPhone: 5, 
                blockAfterFailures: 10
            },

            
            retry: {
                enabled: true,
                maxAttempts: 2,
                delays: [5000, 15000],
                changeProvider: true 
            }
        },

        
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

                
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Yordam24',
                    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@yordam24.uz'
                },

                
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            },

            
            templates: {
                path: './templates/email',
                engine: 'handlebars',
                cache: process.env.NODE_ENV === 'production'
            },

            
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

            
            retry: {
                enabled: true,
                maxAttempts: 3,
                delays: [30000, 300000] 
            }
        },

        
        inApp: {
            enabled: true,

            
            storage: {
                ttl: 30 * 24 * 60 * 60, 
                maxPerUser: 100,

                
                autoCleanup: {
                    enabled: true,
                    olderThan: 90 * 24 * 60 * 60, 
                    readOlderThan: 30 * 24 * 60 * 60 
                }
            },

            
            realtime: {
                enabled: true,
                broadcastDelay: 100 
            }
        }
    },

    
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

    
    throttling: {
        enabled: process.env.THROTTLING_ENABLED !== 'false',

        
        global: {
            perSecond: 100,
            perMinute: 3000,
            perHour: 50000
        },

        
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

        
        whitelist: {
            users: process.env.THROTTLE_WHITELIST_USERS?.split(',') || [],
            types: ['OTP_CODE', 'ACCOUNT_SECURITY']
        }
    },

    
    quietHours: {
        enabled: process.env.QUIET_HOURS_ENABLED !== 'false',

        
        default: {
            start: '22:00',
            end: '08:00',
            timezone: 'Asia/Tashkent',

            
            allowedTypes: [
                'OTP_CODE',
                'ORDER_ASSIGNED',
                'ACCOUNT_SECURITY',
                'PAYMENT_FAILED'
            ]
        },

        
        respectUserPreferences: true
    },

    
    templates: {
        
        basePath: './templates/notifications',

        
        engine: 'handlebars',

        
        cache: {
            enabled: process.env.NODE_ENV === 'production',
            ttl: 3600 
        },

        
        defaultVars: {
            appName: 'Yordam24',
            supportPhone: '+998 71 200 00 24',
            supportEmail: 'support@yordam24.uz',
            website: 'https:
        },

        
        helpers: {
            formatPrice: 'number_format',
            formatDate: 'date_format',
            pluralize: 'pluralize'
        }
    },

    
    batching: {
        enabled: true,

        
        settings: {
            maxBatchSize: 1000,
            batchWindow: 60000, 

            
            groupBy: ['type', 'channel', 'priority'],

            
            batchableTypes: [
                'PROMO_OFFER',
                'SYSTEM_UPDATE',
                'NEWSLETTER'
            ]
        }
    },

    
    experiments: {
        enabled: process.env.AB_TESTING_ENABLED === 'true',

        
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

    
    analytics: {
        enabled: true,

        
        events: {
            sent: true,
            delivered: true,
            opened: true,
            clicked: true,
            converted: true,
            failed: true
        },

        
        export: {
            enabled: process.env.METRICS_EXPORT_ENABLED === 'true',
            interval: 60000, 

            
            prometheus: {
                enabled: true,
                prefix: 'yordam24_notifications_'
            }
        }
    },

    
    processing: {
        
        workers: {
            push: parseInt(process.env.PUSH_WORKERS || 3),
            sms: parseInt(process.env.SMS_WORKERS || 2),
            email: parseInt(process.env.EMAIL_WORKERS || 2),
            inApp: parseInt(process.env.INAPP_WORKERS || 1)
        },

        
        queues: {
            
            priorities: {
                critical: { concurrency: 10, rateLimit: null },
                high: { concurrency: 5, rateLimit: 100 },
                normal: { concurrency: 3, rateLimit: 50 },
                low: { concurrency: 1, rateLimit: 10 }
            },

            
            dlq: {
                enabled: true,
                maxRetries: 3,
                ttl: 7 * 24 * 60 * 60 
            }
        },

        
        errorHandling: {
            
            strategies: {
                'rate_limited': 'exponential_backoff',
                'provider_error': 'failover',
                'invalid_token': 'remove_token',
                'user_blocked': 'disable_channel'
            },

            
            alerts: {
                enabled: true,
                thresholds: {
                    errorRate: 0.1, 
                    consecutiveFailures: 10
                }
            }
        }
    },

    
    security: {
        
        encryption: {
            enabled: process.env.ENCRYPT_NOTIFICATIONS === 'true',
            algorithm: 'aes-256-gcm',
            fields: ['content.body', 'content.data']
        },

        
        audit: {
            enabled: true,
            logLevel: 'info',

            
            events: [
                'notification_sent',
                'notification_failed',
                'user_unsubscribed',
                'token_invalid'
            ]
        },

        
        antispam: {
            enabled: true,

            
            checks: {
                duplicateContent: true,
                rateLimits: true,
                blacklist: true
            }
        }
    },

    
    fallbacks: {
        
        channelFallbacks: {
            push: ['sms', 'email'],
            sms: ['email', 'push'],
            email: ['push', 'sms']
        },

        
        degradation: {
            enabled: true,
            thresholds: {
                cpuUsage: 80,
                memoryUsage: 85,
                queueSize: 10000
            },

            
            actions: {
                disableLowPriority: true,
                reduceWorkers: true,
                enableBatching: true
            }
        }
    },

    
    localization: {
        defaultLanguage: 'ru',
        fallbackLanguage: 'ru',

        
        languages: {
            ru: { name: 'Русский', enabled: true },
            uz: { name: "O'zbek", enabled: true },
            en: { name: 'English', enabled: true }
        },

        
        detection: {
            fromUser: true,
            fromDevice: true,
            fromGeo: false
        }
    },

    
    monitoring: {
        healthCheck: {
            enabled: true,
            interval: 30000, 

            
            checks: {
                providers: true,
                queues: true,
                workers: true,
                database: true
            }
        },

        
        metrics: {
            
            counters: [
                'notifications_sent_total',
                'notifications_failed_total',
                'notifications_delivered_total'
            ],

            
            histograms: [
                'notification_processing_duration',
                'notification_delivery_time'
            ],

            
            gauges: [
                'notification_queue_size',
                'active_workers'
            ]
        }
    }
};