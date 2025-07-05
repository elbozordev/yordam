

'use strict';

const { NOTIFICATION_TYPES } = require('./notification-types');
const { USER_ROLES } = require('./user-roles');


const NOTIFICATION_EVENTS = {
    
    ORDER_CREATED: 'order.created',                           
    ORDER_PAYMENT_PENDING: 'order.payment_pending',           
    ORDER_SEARCHING_STARTED: 'order.searching_started',       
    ORDER_MASTER_FOUND: 'order.master_found',                 
    ORDER_MASTER_ASSIGNED: 'order.master_assigned',           
    ORDER_MASTER_ACCEPTED: 'order.master_accepted',           
    ORDER_MASTER_REJECTED: 'order.master_rejected',           
    ORDER_MASTER_EN_ROUTE: 'order.master_en_route',           
    ORDER_MASTER_ARRIVED: 'order.master_arrived',             
    ORDER_WORK_STARTED: 'order.work_started',                 
    ORDER_WORK_COMPLETED: 'order.work_completed',             
    ORDER_CANCELLED_BY_CLIENT: 'order.cancelled_by_client',   
    ORDER_CANCELLED_BY_MASTER: 'order.cancelled_by_master',   
    ORDER_CANCELLED_BY_SYSTEM: 'order.cancelled_by_system',   
    ORDER_EXPIRED: 'order.expired',                           
    ORDER_PRICE_CHANGED: 'order.price_changed',               
    ORDER_SEARCH_RADIUS_EXPANDED: 'order.search_radius_expanded', 
    ORDER_NO_MASTERS_AVAILABLE: 'order.no_masters_available', 
    ORDER_REASSIGNED: 'order.reassigned',                     

    
    PAYMENT_INITIATED: 'payment.initiated',                    
    PAYMENT_PROCESSING: 'payment.processing',                  
    PAYMENT_COMPLETED: 'payment.completed',                    
    PAYMENT_FAILED: 'payment.failed',                          
    PAYMENT_CANCELLED: 'payment.cancelled',                    
    PAYMENT_REFUND_REQUESTED: 'payment.refund_requested',     
    PAYMENT_REFUNDED: 'payment.refunded',                      
    PAYMENT_CHARGEBACK: 'payment.chargeback',                  
    WITHDRAWAL_REQUESTED: 'withdrawal.requested',              
    WITHDRAWAL_APPROVED: 'withdrawal.approved',                
    WITHDRAWAL_COMPLETED: 'withdrawal.completed',              
    WITHDRAWAL_FAILED: 'withdrawal.failed',                    
    WITHDRAWAL_REJECTED: 'withdrawal.rejected',                

    
    USER_REGISTERED: 'user.registered',                        
    USER_OTP_REQUESTED: 'user.otp_requested',                  
    USER_PHONE_VERIFIED: 'user.phone_verified',               
    USER_EMAIL_VERIFIED: 'user.email_verified',               
    USER_PROFILE_UPDATED: 'user.profile_updated',             
    USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested', 
    USER_PASSWORD_CHANGED: 'user.password_changed',           
    USER_BLOCKED: 'user.blocked',                              
    USER_UNBLOCKED: 'user.unblocked',                          
    USER_DELETED: 'user.deleted',                              
    USER_DEVICE_LOGIN: 'user.device_login',                    
    USER_SUSPICIOUS_ACTIVITY: 'user.suspicious_activity',      

    
    MASTER_APPLICATION_SUBMITTED: 'master.application_submitted', 
    MASTER_DOCUMENTS_UPLOADED: 'master.documents_uploaded',     
    MASTER_DOCUMENTS_VERIFIED: 'master.documents_verified',     
    MASTER_DOCUMENTS_REJECTED: 'master.documents_rejected',     
    MASTER_APPROVED: 'master.approved',                         
    MASTER_REJECTED: 'master.rejected',                         
    MASTER_ONLINE: 'master.online',                             
    MASTER_OFFLINE: 'master.offline',                           
    MASTER_SHIFT_STARTED: 'master.shift_started',               
    MASTER_SHIFT_ENDED: 'master.shift_ended',                   
    MASTER_LOCATION_UPDATED: 'master.location_updated',         
    MASTER_DOCUMENTS_EXPIRING: 'master.documents_expiring',     
    MASTER_DOCUMENTS_EXPIRED: 'master.documents_expired',       
    MASTER_LOW_RATING: 'master.low_rating',                     
    MASTER_HIGH_CANCELLATION_RATE: 'master.high_cancellation_rate', 

    
    STO_REGISTERED: 'sto.registered',                          
    STO_VERIFIED: 'sto.verified',                              
    STO_MASTER_ADDED: 'sto.master_added',                      
    STO_MASTER_REMOVED: 'sto.master_removed',                  
    STO_SERVICE_ADDED: 'sto.service_added',                    
    STO_SERVICE_UPDATED: 'sto.service_updated',                
    STO_SCHEDULE_CHANGED: 'sto.schedule_changed',              
    STO_LOW_BALANCE: 'sto.low_balance',                        
    STO_SUBSCRIPTION_EXPIRING: 'sto.subscription_expiring',    
    STO_HIGH_DEMAND: 'sto.high_demand',                        
    STO_DAILY_SUMMARY: 'sto.daily_summary',                    
    STO_WEEKLY_REPORT: 'sto.weekly_report',                    
    STO_MONTHLY_REPORT: 'sto.monthly_report',                  

    
    RATING_REQUESTED: 'rating.requested',                       
    RATING_RECEIVED: 'rating.received',                         
    RATING_LOW_RECEIVED: 'rating.low_received',                
    REVIEW_RECEIVED: 'review.received',                         
    REVIEW_REPLIED: 'review.replied',                           
    COMPLAINT_RECEIVED: 'complaint.received',                   
    COMPLAINT_RESOLVED: 'complaint.resolved',                   

    
    PROMO_ACTIVATED: 'promo.activated',                         
    PROMO_EXPIRING: 'promo.expiring',                          
    PROMO_EXPIRED: 'promo.expired',                            
    BONUS_CREDITED: 'bonus.credited',                          
    BONUS_EXPIRING: 'bonus.expiring',                          
    REFERRAL_REGISTERED: 'referral.registered',                
    REFERRAL_COMPLETED_ORDER: 'referral.completed_order',      
    LOYALTY_LEVEL_UPGRADED: 'loyalty.level_upgraded',          
    ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',              

    
    SYSTEM_MAINTENANCE_SCHEDULED: 'system.maintenance_scheduled', 
    SYSTEM_MAINTENANCE_STARTED: 'system.maintenance_started',   
    SYSTEM_MAINTENANCE_COMPLETED: 'system.maintenance_completed', 
    SYSTEM_UPDATE_AVAILABLE: 'system.update_available',         
    SYSTEM_CRITICAL_ERROR: 'system.critical_error',             
    SYSTEM_PERFORMANCE_DEGRADED: 'system.performance_degraded', 

    
    SECURITY_LOGIN_ATTEMPT_FAILED: 'security.login_attempt_failed', 
    SECURITY_LOGIN_FROM_NEW_LOCATION: 'security.login_from_new_location', 
    SECURITY_PASSWORD_RESET: 'security.password_reset',         
    SECURITY_2FA_ENABLED: 'security.2fa_enabled',               
    SECURITY_2FA_DISABLED: 'security.2fa_disabled',             
    SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity', 

    
    CHAT_MESSAGE_RECEIVED: 'chat.message_received',             
    CHAT_MESSAGE_READ: 'chat.message_read',                     
    SUPPORT_TICKET_CREATED: 'support.ticket_created',           
    SUPPORT_TICKET_UPDATED: 'support.ticket_updated',           
    SUPPORT_TICKET_RESOLVED: 'support.ticket_resolved',         
    ANNOUNCEMENT_PUBLISHED: 'announcement.published'            
};


const EVENT_TO_NOTIFICATION_TYPE = {
    
    [NOTIFICATION_EVENTS.ORDER_CREATED]: NOTIFICATION_TYPES.ORDER_CREATED,
    [NOTIFICATION_EVENTS.ORDER_SEARCHING_STARTED]: NOTIFICATION_TYPES.ORDER_SEARCHING_MASTER,
    [NOTIFICATION_EVENTS.ORDER_MASTER_ASSIGNED]: NOTIFICATION_TYPES.ORDER_MASTER_ASSIGNED,
    [NOTIFICATION_EVENTS.ORDER_MASTER_ACCEPTED]: NOTIFICATION_TYPES.ORDER_MASTER_ACCEPTED,
    [NOTIFICATION_EVENTS.ORDER_MASTER_EN_ROUTE]: NOTIFICATION_TYPES.ORDER_MASTER_EN_ROUTE,
    [NOTIFICATION_EVENTS.ORDER_MASTER_ARRIVED]: NOTIFICATION_TYPES.ORDER_MASTER_ARRIVED,
    [NOTIFICATION_EVENTS.ORDER_WORK_STARTED]: NOTIFICATION_TYPES.ORDER_WORK_STARTED,
    [NOTIFICATION_EVENTS.ORDER_WORK_COMPLETED]: NOTIFICATION_TYPES.ORDER_COMPLETED,
    [NOTIFICATION_EVENTS.ORDER_CANCELLED_BY_CLIENT]: NOTIFICATION_TYPES.ORDER_CANCELLED_BY_CLIENT,
    [NOTIFICATION_EVENTS.ORDER_CANCELLED_BY_MASTER]: NOTIFICATION_TYPES.ORDER_CANCELLED,
    [NOTIFICATION_EVENTS.ORDER_CANCELLED_BY_SYSTEM]: NOTIFICATION_TYPES.ORDER_CANCELLED,
    [NOTIFICATION_EVENTS.ORDER_EXPIRED]: NOTIFICATION_TYPES.ORDER_EXPIRED,
    [NOTIFICATION_EVENTS.ORDER_PRICE_CHANGED]: NOTIFICATION_TYPES.ORDER_PRICE_UPDATED,
    [NOTIFICATION_EVENTS.ORDER_REASSIGNED]: NOTIFICATION_TYPES.ORDER_REASSIGNED,

    
    [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
    [NOTIFICATION_EVENTS.PAYMENT_FAILED]: NOTIFICATION_TYPES.PAYMENT_FAILED,
    [NOTIFICATION_EVENTS.PAYMENT_REFUNDED]: NOTIFICATION_TYPES.PAYMENT_REFUNDED,
    [NOTIFICATION_EVENTS.WITHDRAWAL_COMPLETED]: NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED,
    [NOTIFICATION_EVENTS.WITHDRAWAL_FAILED]: NOTIFICATION_TYPES.WITHDRAWAL_FAILED,

    
    [NOTIFICATION_EVENTS.USER_REGISTERED]: NOTIFICATION_TYPES.ACCOUNT_CREATED,
    [NOTIFICATION_EVENTS.USER_OTP_REQUESTED]: NOTIFICATION_TYPES.OTP_CODE,
    [NOTIFICATION_EVENTS.USER_PHONE_VERIFIED]: NOTIFICATION_TYPES.ACCOUNT_VERIFIED,
    [NOTIFICATION_EVENTS.USER_BLOCKED]: NOTIFICATION_TYPES.ACCOUNT_BLOCKED,
    [NOTIFICATION_EVENTS.USER_UNBLOCKED]: NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED,
    [NOTIFICATION_EVENTS.USER_PASSWORD_RESET_REQUESTED]: NOTIFICATION_TYPES.PASSWORD_RESET,

    
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_VERIFIED]: NOTIFICATION_TYPES.DOCUMENTS_VERIFIED,
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_REJECTED]: NOTIFICATION_TYPES.DOCUMENTS_REJECTED,
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_EXPIRING]: NOTIFICATION_TYPES.DOCUMENTS_EXPIRING,

    
    [NOTIFICATION_EVENTS.RATING_REQUESTED]: NOTIFICATION_TYPES.RATING_REQUEST,
    [NOTIFICATION_EVENTS.RATING_RECEIVED]: NOTIFICATION_TYPES.RATING_RECEIVED,
    [NOTIFICATION_EVENTS.REVIEW_RECEIVED]: NOTIFICATION_TYPES.REVIEW_RECEIVED,

    
    [NOTIFICATION_EVENTS.PROMO_ACTIVATED]: NOTIFICATION_TYPES.PROMO_AVAILABLE,
    [NOTIFICATION_EVENTS.BONUS_CREDITED]: NOTIFICATION_TYPES.BONUS_RECEIVED,
    [NOTIFICATION_EVENTS.REFERRAL_COMPLETED_ORDER]: NOTIFICATION_TYPES.REFERRAL_BONUS,
    [NOTIFICATION_EVENTS.LOYALTY_LEVEL_UPGRADED]: NOTIFICATION_TYPES.LOYALTY_REWARD,

    
    [NOTIFICATION_EVENTS.STO_MASTER_OFFLINE]: NOTIFICATION_TYPES.STO_MASTER_OFFLINE,
    [NOTIFICATION_EVENTS.STO_DAILY_SUMMARY]: NOTIFICATION_TYPES.STO_DAILY_REPORT,
    [NOTIFICATION_EVENTS.STO_WEEKLY_REPORT]: NOTIFICATION_TYPES.STO_WEEKLY_REPORT,

    
    [NOTIFICATION_EVENTS.SYSTEM_MAINTENANCE_SCHEDULED]: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
    [NOTIFICATION_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY]: NOTIFICATION_TYPES.FRAUD_DETECTED,

    
    [NOTIFICATION_EVENTS.CHAT_MESSAGE_RECEIVED]: NOTIFICATION_TYPES.CHAT_MESSAGE,
    [NOTIFICATION_EVENTS.SUPPORT_TICKET_UPDATED]: NOTIFICATION_TYPES.SUPPORT_RESPONSE,
    [NOTIFICATION_EVENTS.ANNOUNCEMENT_PUBLISHED]: NOTIFICATION_TYPES.ANNOUNCEMENT
};


const EVENT_METADATA = {
    
    [NOTIFICATION_EVENTS.ORDER_CREATED]: {
        name: { ru: 'Заказ создан', uz: 'Buyurtma yaratildi', en: 'Order created' },
        description: {
            ru: 'Клиент создал новый заказ',
            uz: 'Mijoz yangi buyurtma yaratdi',
            en: 'Client created a new order'
        },
        category: 'order',
        recipients: [
            { role: USER_ROLES.CLIENT, mandatory: true },
            { role: USER_ROLES.ADMIN, optional: true }
        ],
        data: ['orderId', 'orderNumber', 'serviceType', 'location'],
        triggers: ['api:order.create', 'user:create_order']
    },

    [NOTIFICATION_EVENTS.ORDER_MASTER_ASSIGNED]: {
        name: { ru: 'Мастер назначен', uz: 'Usta tayinlandi', en: 'Master assigned' },
        description: {
            ru: 'На заказ назначен мастер',
            uz: 'Buyurtmaga usta tayinlandi',
            en: 'Master assigned to order'
        },
        category: 'order',
        recipients: [
            { role: USER_ROLES.CLIENT, mandatory: true },
            { role: USER_ROLES.MASTER, mandatory: true },
            { role: USER_ROLES.STO_OWNER, optional: true }
        ],
        data: ['orderId', 'masterId', 'masterName', 'masterPhone', 'eta'],
        triggers: ['system:master_assigned', 'master:accept_order']
    },

    [NOTIFICATION_EVENTS.ORDER_WORK_COMPLETED]: {
        name: { ru: 'Работа завершена', uz: 'Ish tugallandi', en: 'Work completed' },
        description: {
            ru: 'Мастер завершил работу по заказу',
            uz: 'Usta buyurtma bo\'yicha ishni tugatdi',
            en: 'Master completed work on order'
        },
        category: 'order',
        recipients: [
            { role: USER_ROLES.CLIENT, mandatory: true },
            { role: USER_ROLES.MASTER, optional: true },
            { role: USER_ROLES.STO_OWNER, optional: true }
        ],
        data: ['orderId', 'amount', 'duration', 'servicesProvided'],
        triggers: ['master:complete_work', 'system:auto_complete'],
        actions: ['request_rating', 'generate_receipt']
    },

    [NOTIFICATION_EVENTS.ORDER_CANCELLED_BY_CLIENT]: {
        name: { ru: 'Заказ отменен клиентом', uz: 'Buyurtma mijoz tomonidan bekor qilindi', en: 'Order cancelled by client' },
        description: {
            ru: 'Клиент отменил заказ',
            uz: 'Mijoz buyurtmani bekor qildi',
            en: 'Client cancelled the order'
        },
        category: 'order',
        recipients: [
            { role: USER_ROLES.MASTER, mandatory: true },
            { role: USER_ROLES.STO_OWNER, optional: true },
            { role: USER_ROLES.ADMIN, optional: true }
        ],
        data: ['orderId', 'cancellationReason', 'penalty'],
        triggers: ['client:cancel_order'],
        actions: ['calculate_penalty', 'reassign_master']
    },

    
    [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: {
        name: { ru: 'Платеж завершен', uz: 'To\'lov yakunlandi', en: 'Payment completed' },
        description: {
            ru: 'Платеж успешно обработан',
            uz: 'To\'lov muvaffaqiyatli qayta ishlandi',
            en: 'Payment successfully processed'
        },
        category: 'payment',
        recipients: [
            { role: USER_ROLES.CLIENT, mandatory: true },
            { role: USER_ROLES.MASTER, mandatory: true }
        ],
        data: ['paymentId', 'amount', 'method', 'orderId'],
        triggers: ['payment:success', 'payment:callback'],
        actions: ['generate_receipt', 'update_wallet']
    },

    [NOTIFICATION_EVENTS.WITHDRAWAL_REQUESTED]: {
        name: { ru: 'Запрос на вывод средств', uz: 'Pul yechish so\'rovi', en: 'Withdrawal requested' },
        description: {
            ru: 'Мастер запросил вывод средств',
            uz: 'Usta pul yechishni so\'radi',
            en: 'Master requested withdrawal'
        },
        category: 'payment',
        recipients: [
            { role: USER_ROLES.MASTER, mandatory: true },
            { role: USER_ROLES.ADMIN, mandatory: true }
        ],
        data: ['withdrawalId', 'amount', 'method', 'card'],
        triggers: ['master:request_withdrawal'],
        actions: ['validate_balance', 'approve_withdrawal']
    },

    
    [NOTIFICATION_EVENTS.USER_OTP_REQUESTED]: {
        name: { ru: 'Запрос OTP кода', uz: 'OTP kod so\'rovi', en: 'OTP code requested' },
        description: {
            ru: 'Запрошен одноразовый код подтверждения',
            uz: 'Bir martalik tasdiqlash kodi so\'ralgan',
            en: 'One-time password requested'
        },
        category: 'security',
        recipients: [
            { role: 'any', mandatory: true }
        ],
        data: ['code', 'validUntil', 'action'],
        triggers: ['auth:request_otp', 'user:verify_phone'],
        security: {
            sensitive: true,
            rateLimit: { perHour: 5, perDay: 10 }
        }
    },

    [NOTIFICATION_EVENTS.USER_BLOCKED]: {
        name: { ru: 'Аккаунт заблокирован', uz: 'Hisob bloklandi', en: 'Account blocked' },
        description: {
            ru: 'Аккаунт пользователя заблокирован',
            uz: 'Foydalanuvchi hisobi bloklandi',
            en: 'User account has been blocked'
        },
        category: 'security',
        recipients: [
            { role: 'any', mandatory: true }
        ],
        data: ['reason', 'duration', 'appealUrl'],
        triggers: ['admin:block_user', 'system:auto_block'],
        priority: 'high'
    },

    
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_EXPIRING]: {
        name: { ru: 'Срок документов истекает', uz: 'Hujjatlar muddati tugamoqda', en: 'Documents expiring' },
        description: {
            ru: 'Срок действия документов скоро истечет',
            uz: 'Hujjatlar amal qilish muddati tez orada tugaydi',
            en: 'Documents will expire soon'
        },
        category: 'documents',
        recipients: [
            { role: USER_ROLES.MASTER, mandatory: true },
            { role: USER_ROLES.STO_OWNER, optional: true }
        ],
        data: ['documentType', 'expiryDate', 'daysLeft'],
        triggers: ['cron:daily_check', 'system:document_check'],
        schedule: {
            checkDays: [30, 14, 7, 3, 1],
            time: '10:00'
        }
    },

    [NOTIFICATION_EVENTS.MASTER_LOW_RATING]: {
        name: { ru: 'Низкий рейтинг', uz: 'Past reyting', en: 'Low rating' },
        description: {
            ru: 'Рейтинг мастера упал ниже допустимого',
            uz: 'Usta reytingi ruxsat etilganidan pastga tushdi',
            en: 'Master rating dropped below acceptable'
        },
        category: 'quality',
        recipients: [
            { role: USER_ROLES.MASTER, mandatory: true },
            { role: USER_ROLES.STO_OWNER, mandatory: true },
            { role: USER_ROLES.ADMIN, mandatory: true }
        ],
        data: ['currentRating', 'threshold', 'recentReviews'],
        triggers: ['system:rating_check', 'rating:updated'],
        actions: ['provide_training', 'temporary_suspension']
    },

    
    [NOTIFICATION_EVENTS.STO_DAILY_SUMMARY]: {
        name: { ru: 'Дневная сводка', uz: 'Kunlik hisobot', en: 'Daily summary' },
        description: {
            ru: 'Ежедневный отчет о работе СТО',
            uz: 'STO ishi haqida kunlik hisobot',
            en: 'Daily report on STO operations'
        },
        category: 'reports',
        recipients: [
            { role: USER_ROLES.STO_OWNER, mandatory: true },
            { role: USER_ROLES.STO_ADMIN, optional: true }
        ],
        data: ['ordersCount', 'revenue', 'topMasters', 'issues'],
        triggers: ['cron:daily_report'],
        schedule: {
            time: '21:00',
            timezone: 'Asia/Tashkent'
        },
        format: ['email', 'push']
    }
};


const EVENT_CATEGORIES = {
    ORDER: 'order',
    PAYMENT: 'payment',
    USER: 'user',
    MASTER: 'master',
    STO: 'sto',
    SECURITY: 'security',
    DOCUMENTS: 'documents',
    QUALITY: 'quality',
    REPORTS: 'reports',
    SYSTEM: 'system'
};


const EVENT_PRIORITY_GROUPS = {
    CRITICAL: [
        NOTIFICATION_EVENTS.PAYMENT_FAILED,
        NOTIFICATION_EVENTS.USER_BLOCKED,
        NOTIFICATION_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY,
        NOTIFICATION_EVENTS.SYSTEM_CRITICAL_ERROR
    ],

    HIGH: [
        NOTIFICATION_EVENTS.ORDER_CREATED,
        NOTIFICATION_EVENTS.ORDER_MASTER_ASSIGNED,
        NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
        NOTIFICATION_EVENTS.USER_OTP_REQUESTED,
        NOTIFICATION_EVENTS.MASTER_DOCUMENTS_REJECTED
    ],

    NORMAL: [
        NOTIFICATION_EVENTS.ORDER_WORK_COMPLETED,
        NOTIFICATION_EVENTS.RATING_REQUESTED,
        NOTIFICATION_EVENTS.USER_PROFILE_UPDATED,
        NOTIFICATION_EVENTS.MASTER_SHIFT_STARTED
    ],

    LOW: [
        NOTIFICATION_EVENTS.PROMO_ACTIVATED,
        NOTIFICATION_EVENTS.STO_DAILY_SUMMARY,
        NOTIFICATION_EVENTS.LOYALTY_LEVEL_UPGRADED
    ]
};


const IMMEDIATE_EVENTS = [
    NOTIFICATION_EVENTS.USER_OTP_REQUESTED,
    NOTIFICATION_EVENTS.ORDER_MASTER_ASSIGNED,
    NOTIFICATION_EVENTS.ORDER_MASTER_ARRIVED,
    NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
    NOTIFICATION_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY
];


const RETRIABLE_EVENTS = {
    [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: {
        maxRetries: 5,
        retryDelay: 60000 
    },
    [NOTIFICATION_EVENTS.ORDER_CREATED]: {
        maxRetries: 3,
        retryDelay: 30000 
    },
    [NOTIFICATION_EVENTS.USER_OTP_REQUESTED]: {
        maxRetries: 3,
        retryDelay: 10000 
    }
};




function getNotificationTypeForEvent(event) {
    return EVENT_TO_NOTIFICATION_TYPE[event] || null;
}


function getEventMetadata(event, lang = 'ru') {
    const metadata = EVENT_METADATA[event];
    if (!metadata) return null;

    return {
        ...metadata,
        name: metadata.name[lang] || metadata.name.ru,
        description: metadata.description[lang] || metadata.description.ru
    };
}


function isValidEvent(event) {
    return Object.values(NOTIFICATION_EVENTS).includes(event);
}


function getEventRecipients(event) {
    const metadata = EVENT_METADATA[event];
    if (!metadata) return [];

    return metadata.recipients || [];
}


function isImmediateEvent(event) {
    return IMMEDIATE_EVENTS.includes(event);
}


function getEventPriority(event) {
    for (const [priority, events] of Object.entries(EVENT_PRIORITY_GROUPS)) {
        if (events.includes(event)) {
            return priority.toLowerCase();
        }
    }
    return 'normal';
}


function isRetriableEvent(event) {
    return event in RETRIABLE_EVENTS;
}


function getRetrySettings(event) {
    return RETRIABLE_EVENTS[event] || null;
}


function getRequiredEventData(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.data || [];
}


function validateEventData(event, data) {
    const requiredFields = getRequiredEventData(event);
    const missingFields = requiredFields.filter(field => !(field in data));

    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}


function getEventCategory(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.category || 'system';
}


function filterEventsByCategory(category) {
    return Object.entries(EVENT_METADATA)
        .filter(([_, metadata]) => metadata.category === category)
        .map(([event]) => event);
}


function getEventActions(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.actions || [];
}


function isSecuritySensitiveEvent(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.security?.sensitive || false;
}


function getEventSchedule(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.schedule || null;
}


function getEventsForRole(role) {
    const events = [];

    Object.entries(EVENT_METADATA).forEach(([event, metadata]) => {
        const recipients = metadata.recipients || [];
        const hasRole = recipients.some(r =>
            r.role === role || r.role === 'any'
        );

        if (hasRole) {
            events.push(event);
        }
    });

    return events;
}


function groupEventsByTrigger() {
    const grouped = {};

    Object.entries(EVENT_METADATA).forEach(([event, metadata]) => {
        const triggers = metadata.triggers || [];

        triggers.forEach(trigger => {
            if (!grouped[trigger]) {
                grouped[trigger] = [];
            }
            grouped[trigger].push(event);
        });
    });

    return grouped;
}


module.exports = {
    
    NOTIFICATION_EVENTS,
    EVENT_TO_NOTIFICATION_TYPE,
    EVENT_METADATA,
    EVENT_CATEGORIES,
    EVENT_PRIORITY_GROUPS,
    IMMEDIATE_EVENTS,
    RETRIABLE_EVENTS,

    
    getNotificationTypeForEvent,
    getEventMetadata,
    isValidEvent,
    getEventRecipients,
    isImmediateEvent,
    getEventPriority,
    isRetriableEvent,
    getRetrySettings,
    getRequiredEventData,
    validateEventData,
    getEventCategory,
    filterEventsByCategory,
    getEventActions,
    isSecuritySensitiveEvent,
    getEventSchedule,
    getEventsForRole,
    groupEventsByTrigger
};