

'use strict';

const { ORDER_STATUS } = require('./order-status');
const { PAYMENT_STATUS } = require('./payment-status');
const { USER_ROLES } = require('./user-roles');


const NOTIFICATION_TYPES = {
    
    
    ORDER_CREATED: 'order_created',                     
    ORDER_SEARCHING_MASTER: 'order_searching_master',   
    ORDER_MASTER_ASSIGNED: 'order_master_assigned',     
    ORDER_MASTER_ACCEPTED: 'order_master_accepted',     
    ORDER_MASTER_EN_ROUTE: 'order_master_en_route',     
    ORDER_MASTER_ARRIVED: 'order_master_arrived',       
    ORDER_WORK_STARTED: 'order_work_started',           
    ORDER_COMPLETED: 'order_completed',                 
    ORDER_CANCELLED: 'order_cancelled',                 
    ORDER_FAILED: 'order_failed',                       
    ORDER_EXPIRED: 'order_expired',                     
    ORDER_PRICE_UPDATED: 'order_price_updated',         

    
    NEW_ORDER_AVAILABLE: 'new_order_available',         
    ORDER_ASSIGNED_TO_YOU: 'order_assigned_to_you',     
    ORDER_ACCEPTANCE_REMINDER: 'order_acceptance_reminder', 
    ORDER_CANCELLED_BY_CLIENT: 'order_cancelled_by_client', 
    ORDER_REASSIGNED: 'order_reassigned',               

    
    PAYMENT_PENDING: 'payment_pending',                 
    PAYMENT_PROCESSING: 'payment_processing',           
    PAYMENT_COMPLETED: 'payment_completed',             
    PAYMENT_FAILED: 'payment_failed',                   
    PAYMENT_REFUNDED: 'payment_refunded',               
    WITHDRAWAL_REQUESTED: 'withdrawal_requested',        
    WITHDRAWAL_COMPLETED: 'withdrawal_completed',        
    WITHDRAWAL_FAILED: 'withdrawal_failed',              

    
    RATING_REQUEST: 'rating_request',                   
    RATING_RECEIVED: 'rating_received',                 
    REVIEW_RECEIVED: 'review_received',                  
    REVIEW_RESPONSE: 'review_response',                  

    
    DOCUMENTS_VERIFICATION_PENDING: 'documents_verification_pending',
    DOCUMENTS_VERIFIED: 'documents_verified',
    DOCUMENTS_REJECTED: 'documents_rejected',
    DOCUMENTS_EXPIRING: 'documents_expiring',

    
    ACCOUNT_CREATED: 'account_created',                 
    ACCOUNT_VERIFIED: 'account_verified',               
    ACCOUNT_BLOCKED: 'account_blocked',                 
    ACCOUNT_UNBLOCKED: 'account_unblocked',             
    PASSWORD_RESET: 'password_reset',                   
    OTP_CODE: 'otp_code',                              

    
    PROMO_AVAILABLE: 'promo_available',                 
    BONUS_RECEIVED: 'bonus_received',                   
    REFERRAL_BONUS: 'referral_bonus',                   
    LOYALTY_REWARD: 'loyalty_reward',                   

    
    STO_NEW_ORDER: 'sto_new_order',                     
    STO_DAILY_REPORT: 'sto_daily_report',               
    STO_WEEKLY_REPORT: 'sto_weekly_report',             
    STO_LOW_RATING_ALERT: 'sto_low_rating_alert',       
    STO_MASTER_OFFLINE: 'sto_master_offline',           

    
    SLA_VIOLATION: 'sla_violation',                     
    FRAUD_DETECTED: 'fraud_detected',                   
    SYSTEM_MAINTENANCE: 'system_maintenance',           
    EMERGENCY_ALERT: 'emergency_alert',                 

    
    CHAT_MESSAGE: 'chat_message',                       
    SUPPORT_RESPONSE: 'support_response',               
    ANNOUNCEMENT: 'announcement'                        
};


const NOTIFICATION_CATEGORIES = {
    ORDER: 'order',                    
    PAYMENT: 'payment',                
    ACCOUNT: 'account',                
    RATING: 'rating',                  
    PROMO: 'promo',                    
    SYSTEM: 'system',                  
    CRITICAL: 'critical',              
    COMMUNICATION: 'communication',     
    REPORT: 'report'                   
};


const NOTIFICATION_PRIORITY = {
    CRITICAL: 'critical',              
    HIGH: 'high',                      
    NORMAL: 'normal',                  
    LOW: 'low',                        
    INFO: 'info'                       
};


const NOTIFICATION_CHANNELS = {
    PUSH: 'push',                      
    SMS: 'sms',                        
    EMAIL: 'email',                    
    IN_APP: 'in_app',                  
    WHATSAPP: 'whatsapp',              
    TELEGRAM: 'telegram'               
};


const NOTIFICATION_TTL = {
    INSTANT: 0,                        
    MINUTE_5: 5 * 60,                  
    MINUTE_30: 30 * 60,                
    HOUR_1: 60 * 60,                   
    HOUR_24: 24 * 60 * 60,             
    WEEK_1: 7 * 24 * 60 * 60           
};


const NOTIFICATION_METADATA = {
    
    [NOTIFICATION_TYPES.ORDER_CREATED]: {
        category: NOTIFICATION_CATEGORIES.ORDER,
        priority: NOTIFICATION_PRIORITY.HIGH,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.IN_APP],
        recipients: [USER_ROLES.CLIENT],
        ttl: NOTIFICATION_TTL.HOUR_1,

        templates: {
            push: {
                title: {
                    ru: 'Заказ создан',
                    uz: 'Buyurtma yaratildi',
                    en: 'Order created'
                },
                body: {
                    ru: 'Ваш заказ №{orderNumber} принят. Ищем мастера...',
                    uz: '№{orderNumber} buyurtmangiz qabul qilindi. Usta qidirilmoqda...',
                    en: 'Your order #{orderNumber} has been accepted. Searching for a master...'
                }
            }
        },

        actions: [
            {
                id: 'view_order',
                label: { ru: 'Посмотреть', uz: 'Ko\'rish', en: 'View' },
                deeplink: '/orders/{orderId}'
            },
            {
                id: 'cancel_order',
                label: { ru: 'Отменить', uz: 'Bekor qilish', en: 'Cancel' }
            }
        ],

        sound: 'order_created.mp3',
        vibration: true,
        badge: true
    },

    [NOTIFICATION_TYPES.ORDER_MASTER_ASSIGNED]: {
        category: NOTIFICATION_CATEGORIES.ORDER,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.IN_APP],
        recipients: [USER_ROLES.CLIENT],
        ttl: NOTIFICATION_TTL.HOUR_24,

        templates: {
            push: {
                title: {
                    ru: 'Мастер найден!',
                    uz: 'Usta topildi!',
                    en: 'Master found!'
                },
                body: {
                    ru: '{masterName} принял ваш заказ. Время прибытия: {eta} минут',
                    uz: '{masterName} buyurtmangizni qabul qildi. Kelish vaqti: {eta} daqiqa',
                    en: '{masterName} accepted your order. ETA: {eta} minutes'
                }
            },
            sms: {
                body: {
                    ru: 'Заказ #{orderNumber}: Мастер {masterName} выезжает к вам. Тел: {masterPhone}',
                    uz: 'Buyurtma #{orderNumber}: {masterName} sizga kelmoqda. Tel: {masterPhone}',
                    en: 'Order #{orderNumber}: Master {masterName} is on the way. Phone: {masterPhone}'
                }
            }
        },

        actions: [
            {
                id: 'track_master',
                label: { ru: 'Отследить', uz: 'Kuzatish', en: 'Track' },
                deeplink: '/orders/{orderId}/tracking'
            },
            {
                id: 'call_master',
                label: { ru: 'Позвонить', uz: 'Qo\'ng\'iroq', en: 'Call' },
                action: 'tel:{masterPhone}'
            }
        ],

        sound: 'master_assigned.mp3',
        vibration: [100, 200, 100],
        badge: true,
        persistent: true
    },

    [NOTIFICATION_TYPES.ORDER_COMPLETED]: {
        category: NOTIFICATION_CATEGORIES.ORDER,
        priority: NOTIFICATION_PRIORITY.HIGH,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.IN_APP],
        recipients: [USER_ROLES.CLIENT],
        ttl: NOTIFICATION_TTL.WEEK_1,

        templates: {
            push: {
                title: {
                    ru: 'Заказ выполнен',
                    uz: 'Buyurtma bajarildi',
                    en: 'Order completed'
                },
                body: {
                    ru: 'Заказ №{orderNumber} выполнен. Сумма: {amount} сум',
                    uz: '№{orderNumber} buyurtma bajarildi. Summa: {amount} so\'m',
                    en: 'Order #{orderNumber} completed. Amount: {amount} UZS'
                }
            }
        },

        actions: [
            {
                id: 'rate_order',
                label: { ru: 'Оценить', uz: 'Baholash', en: 'Rate' },
                deeplink: '/orders/{orderId}/rate'
            },
            {
                id: 'view_receipt',
                label: { ru: 'Чек', uz: 'Chek', en: 'Receipt' },
                deeplink: '/orders/{orderId}/receipt'
            }
        ],

        autoCancel: 86400, 
        requiresInteraction: false
    },

    
    [NOTIFICATION_TYPES.NEW_ORDER_AVAILABLE]: {
        category: NOTIFICATION_CATEGORIES.ORDER,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.IN_APP],
        recipients: [USER_ROLES.MASTER, USER_ROLES.STO_EMPLOYEE],
        ttl: NOTIFICATION_TTL.MINUTE_5,

        templates: {
            push: {
                title: {
                    ru: 'Новый заказ!',
                    uz: 'Yangi buyurtma!',
                    en: 'New order!'
                },
                body: {
                    ru: '{serviceType} • {distance} км • ~{price} сум',
                    uz: '{serviceType} • {distance} km • ~{price} so\'m',
                    en: '{serviceType} • {distance} km • ~{price} UZS'
                }
            }
        },

        actions: [
            {
                id: 'accept_order',
                label: { ru: 'Принять', uz: 'Qabul qilish', en: 'Accept' },
                style: 'success',
                autoResponse: true
            },
            {
                id: 'reject_order',
                label: { ru: 'Отклонить', uz: 'Rad etish', en: 'Reject' },
                style: 'danger'
            }
        ],

        sound: 'new_order.mp3',
        vibration: [200, 100, 200],
        badge: true,
        persistent: true,
        autoExpire: 30, 

        
        masterSettings: {
            minDistance: 0,
            maxDistance: 20000,
            serviceTypes: 'all',
            quietHours: null
        }
    },

    [NOTIFICATION_TYPES.ORDER_ASSIGNED_TO_YOU]: {
        category: NOTIFICATION_CATEGORIES.ORDER,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.SMS],
        recipients: [USER_ROLES.MASTER, USER_ROLES.STO_EMPLOYEE],
        ttl: NOTIFICATION_TTL.HOUR_1,

        templates: {
            push: {
                title: {
                    ru: 'Заказ назначен вам',
                    uz: 'Buyurtma sizga tayinlandi',
                    en: 'Order assigned to you'
                },
                body: {
                    ru: 'У вас есть {timeout} секунд чтобы принять заказ №{orderNumber}',
                    uz: '№{orderNumber} buyurtmani qabul qilish uchun {timeout} soniya vaqtingiz bor',
                    en: 'You have {timeout} seconds to accept order #{orderNumber}'
                }
            }
        },

        countdown: true,
        requiresResponse: true,
        responseTimeout: 30
    },

    
    [NOTIFICATION_TYPES.PAYMENT_COMPLETED]: {
        category: NOTIFICATION_CATEGORIES.PAYMENT,
        priority: NOTIFICATION_PRIORITY.HIGH,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
        recipients: [USER_ROLES.CLIENT, USER_ROLES.MASTER],
        ttl: NOTIFICATION_TTL.WEEK_1,

        templates: {
            push: {
                title: {
                    ru: 'Оплата прошла успешно',
                    uz: 'To\'lov muvaffaqiyatli o\'tdi',
                    en: 'Payment successful'
                },
                body: {
                    ru: 'Оплачено {amount} сум за заказ №{orderNumber}',
                    uz: '№{orderNumber} buyurtma uchun {amount} so\'m to\'landi',
                    en: '{amount} UZS paid for order #{orderNumber}'
                }
            },
            email: {
                subject: {
                    ru: 'Подтверждение оплаты - Yordam24',
                    uz: 'To\'lov tasdiqi - Yordam24',
                    en: 'Payment confirmation - Yordam24'
                },
                template: 'payment_confirmation'
            }
        },

        includeReceipt: true
    },

    [NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED]: {
        category: NOTIFICATION_CATEGORIES.PAYMENT,
        priority: NOTIFICATION_PRIORITY.HIGH,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.EMAIL],
        recipients: [USER_ROLES.MASTER, USER_ROLES.STO_OWNER],
        ttl: NOTIFICATION_TTL.WEEK_1,

        templates: {
            push: {
                title: {
                    ru: 'Вывод средств выполнен',
                    uz: 'Pul yechib olish bajarildi',
                    en: 'Withdrawal completed'
                },
                body: {
                    ru: '{amount} сум переведено на вашу карту {cardMask}',
                    uz: '{amount} so\'m {cardMask} kartangizga o\'tkazildi',
                    en: '{amount} UZS transferred to your card {cardMask}'
                }
            },
            sms: {
                body: {
                    ru: 'Yordam24: Вывод {amount} сум выполнен. Карта {cardMask}',
                    uz: 'Yordam24: {amount} so\'m yechib olindi. Karta {cardMask}',
                    en: 'Yordam24: {amount} UZS withdrawn. Card {cardMask}'
                }
            }
        }
    },

    
    [NOTIFICATION_TYPES.OTP_CODE]: {
        category: NOTIFICATION_CATEGORIES.ACCOUNT,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        channels: [NOTIFICATION_CHANNELS.SMS],
        recipients: 'all',
        ttl: NOTIFICATION_TTL.MINUTE_5,

        templates: {
            sms: {
                body: {
                    ru: 'Yordam24: Ваш код подтверждения: {code}',
                    uz: 'Yordam24: Tasdiqlash kodingiz: {code}',
                    en: 'Yordam24: Your verification code: {code}'
                }
            }
        },

        security: true,
        resendDelay: 60,
        maxAttempts: 5
    },

    [NOTIFICATION_TYPES.DOCUMENTS_EXPIRING]: {
        category: NOTIFICATION_CATEGORIES.ACCOUNT,
        priority: NOTIFICATION_PRIORITY.HIGH,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
        recipients: [USER_ROLES.MASTER, USER_ROLES.STO_OWNER],
        ttl: NOTIFICATION_TTL.WEEK_1,

        templates: {
            push: {
                title: {
                    ru: 'Истекает срок документов',
                    uz: 'Hujjatlar muddati tugamoqda',
                    en: 'Documents expiring'
                },
                body: {
                    ru: 'Ваши {documentType} истекают через {days} дней',
                    uz: '{documentType} hujjatlaringiz {days} kundan keyin tugaydi',
                    en: 'Your {documentType} expire in {days} days'
                }
            }
        },

        schedule: {
            daysBeforeExpiry: [30, 14, 7, 3, 1]
        }
    },

    
    [NOTIFICATION_TYPES.SLA_VIOLATION]: {
        category: NOTIFICATION_CATEGORIES.CRITICAL,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        channels: [NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.EMAIL],
        recipients: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
        ttl: NOTIFICATION_TTL.HOUR_24,

        templates: {
            push: {
                title: {
                    ru: '⚠️ Нарушение SLA',
                    uz: '⚠️ SLA buzilishi',
                    en: '⚠️ SLA Violation'
                },
                body: {
                    ru: 'Заказ #{orderNumber}: {violationType}',
                    uz: '#{orderNumber} buyurtma: {violationType}',
                    en: 'Order #{orderNumber}: {violationType}'
                }
            }
        },

        escalation: {
            levels: [
                { delay: 0, recipients: [USER_ROLES.ADMIN] },
                { delay: 300, recipients: [USER_ROLES.SUPER_ADMIN] }
            ]
        },

        requiresAcknowledgment: true
    },

    
    [NOTIFICATION_TYPES.STO_DAILY_REPORT]: {
        category: NOTIFICATION_CATEGORIES.REPORT,
        priority: NOTIFICATION_PRIORITY.NORMAL,
        channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.PUSH],
        recipients: [USER_ROLES.STO_OWNER],
        ttl: NOTIFICATION_TTL.WEEK_1,

        templates: {
            email: {
                subject: {
                    ru: 'Ежедневный отчет - {date}',
                    uz: 'Kunlik hisobot - {date}',
                    en: 'Daily report - {date}'
                },
                template: 'daily_report_sto'
            },
            push: {
                title: {
                    ru: 'Отчет за день готов',
                    uz: 'Kunlik hisobot tayyor',
                    en: 'Daily report ready'
                },
                body: {
                    ru: 'Заказов: {ordersCount} • Выручка: {revenue} сум',
                    uz: 'Buyurtmalar: {ordersCount} • Daromad: {revenue} so\'m',
                    en: 'Orders: {ordersCount} • Revenue: {revenue} UZS'
                }
            }
        },

        schedule: {
            time: '21:00',
            timezone: 'Asia/Tashkent'
        },

        includeAttachments: ['pdf', 'excel']
    }
};


const NOTIFICATION_GROUPS = {
    CLIENT: [
        NOTIFICATION_TYPES.ORDER_CREATED,
        NOTIFICATION_TYPES.ORDER_SEARCHING_MASTER,
        NOTIFICATION_TYPES.ORDER_MASTER_ASSIGNED,
        NOTIFICATION_TYPES.ORDER_MASTER_ACCEPTED,
        NOTIFICATION_TYPES.ORDER_MASTER_EN_ROUTE,
        NOTIFICATION_TYPES.ORDER_MASTER_ARRIVED,
        NOTIFICATION_TYPES.ORDER_WORK_STARTED,
        NOTIFICATION_TYPES.ORDER_COMPLETED,
        NOTIFICATION_TYPES.ORDER_CANCELLED,
        NOTIFICATION_TYPES.PAYMENT_COMPLETED,
        NOTIFICATION_TYPES.RATING_REQUEST
    ],

    MASTER: [
        NOTIFICATION_TYPES.NEW_ORDER_AVAILABLE,
        NOTIFICATION_TYPES.ORDER_ASSIGNED_TO_YOU,
        NOTIFICATION_TYPES.ORDER_CANCELLED_BY_CLIENT,
        NOTIFICATION_TYPES.PAYMENT_COMPLETED,
        NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED,
        NOTIFICATION_TYPES.RATING_RECEIVED,
        NOTIFICATION_TYPES.DOCUMENTS_EXPIRING
    ],

    STO: [
        NOTIFICATION_TYPES.STO_NEW_ORDER,
        NOTIFICATION_TYPES.STO_DAILY_REPORT,
        NOTIFICATION_TYPES.STO_WEEKLY_REPORT,
        NOTIFICATION_TYPES.STO_LOW_RATING_ALERT,
        NOTIFICATION_TYPES.STO_MASTER_OFFLINE,
        NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED
    ],

    ADMIN: [
        NOTIFICATION_TYPES.SLA_VIOLATION,
        NOTIFICATION_TYPES.FRAUD_DETECTED,
        NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
        NOTIFICATION_TYPES.EMERGENCY_ALERT
    ]
};


const DEFAULT_CHANNEL_SETTINGS = {
    [USER_ROLES.CLIENT]: {
        [NOTIFICATION_CHANNELS.PUSH]: true,
        [NOTIFICATION_CHANNELS.SMS]: false,
        [NOTIFICATION_CHANNELS.EMAIL]: false,
        [NOTIFICATION_CHANNELS.IN_APP]: true
    },

    [USER_ROLES.MASTER]: {
        [NOTIFICATION_CHANNELS.PUSH]: true,
        [NOTIFICATION_CHANNELS.SMS]: true,
        [NOTIFICATION_CHANNELS.EMAIL]: false,
        [NOTIFICATION_CHANNELS.IN_APP]: true
    },

    [USER_ROLES.STO_OWNER]: {
        [NOTIFICATION_CHANNELS.PUSH]: true,
        [NOTIFICATION_CHANNELS.SMS]: true,
        [NOTIFICATION_CHANNELS.EMAIL]: true,
        [NOTIFICATION_CHANNELS.IN_APP]: true
    },

    [USER_ROLES.ADMIN]: {
        [NOTIFICATION_CHANNELS.PUSH]: true,
        [NOTIFICATION_CHANNELS.SMS]: true,
        [NOTIFICATION_CHANNELS.EMAIL]: true,
        [NOTIFICATION_CHANNELS.IN_APP]: true,
        [NOTIFICATION_CHANNELS.TELEGRAM]: true
    }
};


const ORDER_STATUS_NOTIFICATIONS = {
    [ORDER_STATUS.NEW]: [NOTIFICATION_TYPES.ORDER_CREATED],
    [ORDER_STATUS.SEARCHING]: [NOTIFICATION_TYPES.ORDER_SEARCHING_MASTER],
    [ORDER_STATUS.ASSIGNED]: [NOTIFICATION_TYPES.ORDER_MASTER_ASSIGNED, NOTIFICATION_TYPES.ORDER_ASSIGNED_TO_YOU],
    [ORDER_STATUS.ACCEPTED]: [NOTIFICATION_TYPES.ORDER_MASTER_ACCEPTED],
    [ORDER_STATUS.EN_ROUTE]: [NOTIFICATION_TYPES.ORDER_MASTER_EN_ROUTE],
    [ORDER_STATUS.ARRIVED]: [NOTIFICATION_TYPES.ORDER_MASTER_ARRIVED],
    [ORDER_STATUS.IN_PROGRESS]: [NOTIFICATION_TYPES.ORDER_WORK_STARTED],
    [ORDER_STATUS.COMPLETED]: [NOTIFICATION_TYPES.ORDER_COMPLETED, NOTIFICATION_TYPES.RATING_REQUEST],
    [ORDER_STATUS.CANCELLED]: [NOTIFICATION_TYPES.ORDER_CANCELLED, NOTIFICATION_TYPES.ORDER_CANCELLED_BY_CLIENT],
    [ORDER_STATUS.FAILED]: [NOTIFICATION_TYPES.ORDER_FAILED],
    [ORDER_STATUS.EXPIRED]: [NOTIFICATION_TYPES.ORDER_EXPIRED]
};


const PAYMENT_STATUS_NOTIFICATIONS = {
    [PAYMENT_STATUS.PENDING]: [NOTIFICATION_TYPES.PAYMENT_PENDING],
    [PAYMENT_STATUS.PROCESSING]: [NOTIFICATION_TYPES.PAYMENT_PROCESSING],
    [PAYMENT_STATUS.COMPLETED]: [NOTIFICATION_TYPES.PAYMENT_COMPLETED],
    [PAYMENT_STATUS.FAILED]: [NOTIFICATION_TYPES.PAYMENT_FAILED],
    [PAYMENT_STATUS.REFUNDED]: [NOTIFICATION_TYPES.PAYMENT_REFUNDED]
};




function getNotificationMetadata(type) {
    return NOTIFICATION_METADATA[type] || null;
}


function getNotificationTemplate(type, channel, lang = 'ru') {
    const metadata = NOTIFICATION_METADATA[type];
    if (!metadata || !metadata.templates[channel]) return null;

    const template = metadata.templates[channel];
    const result = {};

    
    Object.keys(template).forEach(key => {
        if (template[key] && typeof template[key] === 'object' && template[key][lang]) {
            result[key] = template[key][lang];
        } else {
            result[key] = template[key];
        }
    });

    return result;
}


function isChannelAvailable(type, channel) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata && metadata.channels.includes(channel);
}


function getNotificationPriority(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.priority || NOTIFICATION_PRIORITY.NORMAL;
}


function getNotificationTTL(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.ttl || NOTIFICATION_TTL.HOUR_24;
}


function getNotificationRecipients(type) {
    const metadata = NOTIFICATION_METADATA[type];
    if (!metadata) return [];

    if (metadata.recipients === 'all') {
        return Object.values(USER_ROLES);
    }

    return metadata.recipients || [];
}


function getOrderStatusNotifications(newStatus, oldStatus = null) {
    return ORDER_STATUS_NOTIFICATIONS[newStatus] || [];
}


function getPaymentStatusNotifications(newStatus, oldStatus = null) {
    return PAYMENT_STATUS_NOTIFICATIONS[newStatus] || [];
}


function requiresAcknowledgment(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.requiresAcknowledgment || false;
}


function getNotificationActions(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.actions || [];
}


function isCriticalNotification(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.priority === NOTIFICATION_PRIORITY.CRITICAL ||
        metadata?.category === NOTIFICATION_CATEGORIES.CRITICAL;
}


function getDefaultChannelSettings(role) {
    return DEFAULT_CHANNEL_SETTINGS[role] || DEFAULT_CHANNEL_SETTINGS[USER_ROLES.CLIENT];
}


function filterByCategory(types, category) {
    return types.filter(type => {
        const metadata = NOTIFICATION_METADATA[type];
        return metadata && metadata.category === category;
    });
}


function getNotificationSound(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.sound || 'default.mp3';
}


function shouldVibrate(type) {
    const metadata = NOTIFICATION_METADATA[type];
    return metadata?.vibration || false;
}


function getVibrationPattern(type) {
    const metadata = NOTIFICATION_METADATA[type];
    if (Array.isArray(metadata?.vibration)) {
        return metadata.vibration;
    }
    return metadata?.vibration ? [200] : null;
}


function isValidNotificationType(type) {
    return Object.values(NOTIFICATION_TYPES).includes(type);
}


function isValidChannel(channel) {
    return Object.values(NOTIFICATION_CHANNELS).includes(channel);
}


module.exports = {
    NOTIFICATION_TYPES,
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_CHANNELS,
    NOTIFICATION_TTL,
    NOTIFICATION_METADATA,
    NOTIFICATION_GROUPS,
    DEFAULT_CHANNEL_SETTINGS,
    ORDER_STATUS_NOTIFICATIONS,
    PAYMENT_STATUS_NOTIFICATIONS,

    
    getNotificationMetadata,
    getNotificationTemplate,
    isChannelAvailable,
    getNotificationPriority,
    getNotificationTTL,
    getNotificationRecipients,
    getOrderStatusNotifications,
    getPaymentStatusNotifications,
    requiresAcknowledgment,
    getNotificationActions,
    isCriticalNotification,
    getDefaultChannelSettings,
    filterByCategory,
    getNotificationSound,
    shouldVibrate,
    getVibrationPattern,
    isValidNotificationType,
    isValidChannel
};