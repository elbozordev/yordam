// src/utils/constants/notification-events.js

'use strict';

const { NOTIFICATION_TYPES } = require('./notification-types');
const { USER_ROLES } = require('./user-roles');

// Основные события системы, которые инициируют уведомления
const NOTIFICATION_EVENTS = {
    // === События заказов ===
    ORDER_CREATED: 'order.created',                           // Заказ создан
    ORDER_PAYMENT_PENDING: 'order.payment_pending',           // Ожидает оплату
    ORDER_SEARCHING_STARTED: 'order.searching_started',       // Начат поиск мастера
    ORDER_MASTER_FOUND: 'order.master_found',                 // Найден мастер
    ORDER_MASTER_ASSIGNED: 'order.master_assigned',           // Мастер назначен
    ORDER_MASTER_ACCEPTED: 'order.master_accepted',           // Мастер принял заказ
    ORDER_MASTER_REJECTED: 'order.master_rejected',           // Мастер отклонил заказ
    ORDER_MASTER_EN_ROUTE: 'order.master_en_route',           // Мастер выехал
    ORDER_MASTER_ARRIVED: 'order.master_arrived',             // Мастер прибыл
    ORDER_WORK_STARTED: 'order.work_started',                 // Работа начата
    ORDER_WORK_COMPLETED: 'order.work_completed',             // Работа завершена
    ORDER_CANCELLED_BY_CLIENT: 'order.cancelled_by_client',   // Отменен клиентом
    ORDER_CANCELLED_BY_MASTER: 'order.cancelled_by_master',   // Отменен мастером
    ORDER_CANCELLED_BY_SYSTEM: 'order.cancelled_by_system',   // Отменен системой
    ORDER_EXPIRED: 'order.expired',                           // Истек срок
    ORDER_PRICE_CHANGED: 'order.price_changed',               // Изменена цена
    ORDER_SEARCH_RADIUS_EXPANDED: 'order.search_radius_expanded', // Расширен радиус поиска
    ORDER_NO_MASTERS_AVAILABLE: 'order.no_masters_available', // Нет доступных мастеров
    ORDER_REASSIGNED: 'order.reassigned',                     // Переназначен другому мастеру

    // === События платежей ===
    PAYMENT_INITIATED: 'payment.initiated',                    // Платеж инициирован
    PAYMENT_PROCESSING: 'payment.processing',                  // Платеж обрабатывается
    PAYMENT_COMPLETED: 'payment.completed',                    // Платеж завершен
    PAYMENT_FAILED: 'payment.failed',                          // Платеж не прошел
    PAYMENT_CANCELLED: 'payment.cancelled',                    // Платеж отменен
    PAYMENT_REFUND_REQUESTED: 'payment.refund_requested',     // Запрошен возврат
    PAYMENT_REFUNDED: 'payment.refunded',                      // Возврат выполнен
    PAYMENT_CHARGEBACK: 'payment.chargeback',                  // Чарджбэк
    WITHDRAWAL_REQUESTED: 'withdrawal.requested',              // Запрос на вывод
    WITHDRAWAL_APPROVED: 'withdrawal.approved',                // Вывод одобрен
    WITHDRAWAL_COMPLETED: 'withdrawal.completed',              // Вывод выполнен
    WITHDRAWAL_FAILED: 'withdrawal.failed',                    // Ошибка вывода
    WITHDRAWAL_REJECTED: 'withdrawal.rejected',                // Вывод отклонен

    // === События пользователя/аккаунта ===
    USER_REGISTERED: 'user.registered',                        // Регистрация
    USER_OTP_REQUESTED: 'user.otp_requested',                  // Запрос OTP
    USER_PHONE_VERIFIED: 'user.phone_verified',               // Телефон подтвержден
    USER_EMAIL_VERIFIED: 'user.email_verified',               // Email подтвержден
    USER_PROFILE_UPDATED: 'user.profile_updated',             // Профиль обновлен
    USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested', // Запрос сброса пароля
    USER_PASSWORD_CHANGED: 'user.password_changed',           // Пароль изменен
    USER_BLOCKED: 'user.blocked',                              // Пользователь заблокирован
    USER_UNBLOCKED: 'user.unblocked',                          // Пользователь разблокирован
    USER_DELETED: 'user.deleted',                              // Аккаунт удален
    USER_DEVICE_LOGIN: 'user.device_login',                    // Вход с нового устройства
    USER_SUSPICIOUS_ACTIVITY: 'user.suspicious_activity',      // Подозрительная активность

    // === События мастера ===
    MASTER_APPLICATION_SUBMITTED: 'master.application_submitted', // Заявка подана
    MASTER_DOCUMENTS_UPLOADED: 'master.documents_uploaded',     // Документы загружены
    MASTER_DOCUMENTS_VERIFIED: 'master.documents_verified',     // Документы проверены
    MASTER_DOCUMENTS_REJECTED: 'master.documents_rejected',     // Документы отклонены
    MASTER_APPROVED: 'master.approved',                         // Мастер одобрен
    MASTER_REJECTED: 'master.rejected',                         // Мастер отклонен
    MASTER_ONLINE: 'master.online',                             // Мастер вышел на линию
    MASTER_OFFLINE: 'master.offline',                           // Мастер ушел с линии
    MASTER_SHIFT_STARTED: 'master.shift_started',               // Смена начата
    MASTER_SHIFT_ENDED: 'master.shift_ended',                   // Смена завершена
    MASTER_LOCATION_UPDATED: 'master.location_updated',         // Локация обновлена
    MASTER_DOCUMENTS_EXPIRING: 'master.documents_expiring',     // Документы истекают
    MASTER_DOCUMENTS_EXPIRED: 'master.documents_expired',       // Документы истекли
    MASTER_LOW_RATING: 'master.low_rating',                     // Низкий рейтинг
    MASTER_HIGH_CANCELLATION_RATE: 'master.high_cancellation_rate', // Много отмен

    // === События СТО ===
    STO_REGISTERED: 'sto.registered',                          // СТО зарегистрировано
    STO_VERIFIED: 'sto.verified',                              // СТО верифицировано
    STO_MASTER_ADDED: 'sto.master_added',                      // Добавлен мастер
    STO_MASTER_REMOVED: 'sto.master_removed',                  // Удален мастер
    STO_SERVICE_ADDED: 'sto.service_added',                    // Добавлена услуга
    STO_SERVICE_UPDATED: 'sto.service_updated',                // Обновлена услуга
    STO_SCHEDULE_CHANGED: 'sto.schedule_changed',              // Изменено расписание
    STO_LOW_BALANCE: 'sto.low_balance',                        // Низкий баланс
    STO_SUBSCRIPTION_EXPIRING: 'sto.subscription_expiring',    // Подписка истекает
    STO_HIGH_DEMAND: 'sto.high_demand',                        // Высокий спрос
    STO_DAILY_SUMMARY: 'sto.daily_summary',                    // Дневная сводка
    STO_WEEKLY_REPORT: 'sto.weekly_report',                    // Недельный отчет
    STO_MONTHLY_REPORT: 'sto.monthly_report',                  // Месячный отчет

    // === События рейтингов и отзывов ===
    RATING_REQUESTED: 'rating.requested',                       // Запрос оценки
    RATING_RECEIVED: 'rating.received',                         // Получена оценка
    RATING_LOW_RECEIVED: 'rating.low_received',                // Получена низкая оценка
    REVIEW_RECEIVED: 'review.received',                         // Получен отзыв
    REVIEW_REPLIED: 'review.replied',                           // Ответ на отзыв
    COMPLAINT_RECEIVED: 'complaint.received',                   // Получена жалоба
    COMPLAINT_RESOLVED: 'complaint.resolved',                   // Жалоба решена

    // === События промо и лояльности ===
    PROMO_ACTIVATED: 'promo.activated',                         // Промо активировано
    PROMO_EXPIRING: 'promo.expiring',                          // Промо истекает
    PROMO_EXPIRED: 'promo.expired',                            // Промо истекло
    BONUS_CREDITED: 'bonus.credited',                          // Бонус начислен
    BONUS_EXPIRING: 'bonus.expiring',                          // Бонус истекает
    REFERRAL_REGISTERED: 'referral.registered',                // Реферал зарегистрирован
    REFERRAL_COMPLETED_ORDER: 'referral.completed_order',      // Реферал выполнил заказ
    LOYALTY_LEVEL_UPGRADED: 'loyalty.level_upgraded',          // Повышен уровень лояльности
    ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',              // Достижение разблокировано

    // === Системные события ===
    SYSTEM_MAINTENANCE_SCHEDULED: 'system.maintenance_scheduled', // Запланированы техработы
    SYSTEM_MAINTENANCE_STARTED: 'system.maintenance_started',   // Техработы начаты
    SYSTEM_MAINTENANCE_COMPLETED: 'system.maintenance_completed', // Техработы завершены
    SYSTEM_UPDATE_AVAILABLE: 'system.update_available',         // Доступно обновление
    SYSTEM_CRITICAL_ERROR: 'system.critical_error',             // Критическая ошибка
    SYSTEM_PERFORMANCE_DEGRADED: 'system.performance_degraded', // Снижение производительности

    // === События безопасности ===
    SECURITY_LOGIN_ATTEMPT_FAILED: 'security.login_attempt_failed', // Неудачная попытка входа
    SECURITY_LOGIN_FROM_NEW_LOCATION: 'security.login_from_new_location', // Вход с новой локации
    SECURITY_PASSWORD_RESET: 'security.password_reset',         // Сброс пароля
    SECURITY_2FA_ENABLED: 'security.2fa_enabled',               // 2FA включена
    SECURITY_2FA_DISABLED: 'security.2fa_disabled',             // 2FA выключена
    SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity', // Подозрительная активность

    // === События коммуникаций ===
    CHAT_MESSAGE_RECEIVED: 'chat.message_received',             // Получено сообщение
    CHAT_MESSAGE_READ: 'chat.message_read',                     // Сообщение прочитано
    SUPPORT_TICKET_CREATED: 'support.ticket_created',           // Создан тикет
    SUPPORT_TICKET_UPDATED: 'support.ticket_updated',           // Обновлен тикет
    SUPPORT_TICKET_RESOLVED: 'support.ticket_resolved',         // Тикет решен
    ANNOUNCEMENT_PUBLISHED: 'announcement.published'            // Опубликовано объявление
};

// Маппинг событий к типам уведомлений
const EVENT_TO_NOTIFICATION_TYPE = {
    // Заказы
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

    // Платежи
    [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
    [NOTIFICATION_EVENTS.PAYMENT_FAILED]: NOTIFICATION_TYPES.PAYMENT_FAILED,
    [NOTIFICATION_EVENTS.PAYMENT_REFUNDED]: NOTIFICATION_TYPES.PAYMENT_REFUNDED,
    [NOTIFICATION_EVENTS.WITHDRAWAL_COMPLETED]: NOTIFICATION_TYPES.WITHDRAWAL_COMPLETED,
    [NOTIFICATION_EVENTS.WITHDRAWAL_FAILED]: NOTIFICATION_TYPES.WITHDRAWAL_FAILED,

    // Пользователь
    [NOTIFICATION_EVENTS.USER_REGISTERED]: NOTIFICATION_TYPES.ACCOUNT_CREATED,
    [NOTIFICATION_EVENTS.USER_OTP_REQUESTED]: NOTIFICATION_TYPES.OTP_CODE,
    [NOTIFICATION_EVENTS.USER_PHONE_VERIFIED]: NOTIFICATION_TYPES.ACCOUNT_VERIFIED,
    [NOTIFICATION_EVENTS.USER_BLOCKED]: NOTIFICATION_TYPES.ACCOUNT_BLOCKED,
    [NOTIFICATION_EVENTS.USER_UNBLOCKED]: NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED,
    [NOTIFICATION_EVENTS.USER_PASSWORD_RESET_REQUESTED]: NOTIFICATION_TYPES.PASSWORD_RESET,

    // Документы
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_VERIFIED]: NOTIFICATION_TYPES.DOCUMENTS_VERIFIED,
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_REJECTED]: NOTIFICATION_TYPES.DOCUMENTS_REJECTED,
    [NOTIFICATION_EVENTS.MASTER_DOCUMENTS_EXPIRING]: NOTIFICATION_TYPES.DOCUMENTS_EXPIRING,

    // Рейтинги
    [NOTIFICATION_EVENTS.RATING_REQUESTED]: NOTIFICATION_TYPES.RATING_REQUEST,
    [NOTIFICATION_EVENTS.RATING_RECEIVED]: NOTIFICATION_TYPES.RATING_RECEIVED,
    [NOTIFICATION_EVENTS.REVIEW_RECEIVED]: NOTIFICATION_TYPES.REVIEW_RECEIVED,

    // Промо
    [NOTIFICATION_EVENTS.PROMO_ACTIVATED]: NOTIFICATION_TYPES.PROMO_AVAILABLE,
    [NOTIFICATION_EVENTS.BONUS_CREDITED]: NOTIFICATION_TYPES.BONUS_RECEIVED,
    [NOTIFICATION_EVENTS.REFERRAL_COMPLETED_ORDER]: NOTIFICATION_TYPES.REFERRAL_BONUS,
    [NOTIFICATION_EVENTS.LOYALTY_LEVEL_UPGRADED]: NOTIFICATION_TYPES.LOYALTY_REWARD,

    // СТО
    [NOTIFICATION_EVENTS.STO_MASTER_OFFLINE]: NOTIFICATION_TYPES.STO_MASTER_OFFLINE,
    [NOTIFICATION_EVENTS.STO_DAILY_SUMMARY]: NOTIFICATION_TYPES.STO_DAILY_REPORT,
    [NOTIFICATION_EVENTS.STO_WEEKLY_REPORT]: NOTIFICATION_TYPES.STO_WEEKLY_REPORT,

    // Системные
    [NOTIFICATION_EVENTS.SYSTEM_MAINTENANCE_SCHEDULED]: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
    [NOTIFICATION_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY]: NOTIFICATION_TYPES.FRAUD_DETECTED,

    // Коммуникации
    [NOTIFICATION_EVENTS.CHAT_MESSAGE_RECEIVED]: NOTIFICATION_TYPES.CHAT_MESSAGE,
    [NOTIFICATION_EVENTS.SUPPORT_TICKET_UPDATED]: NOTIFICATION_TYPES.SUPPORT_RESPONSE,
    [NOTIFICATION_EVENTS.ANNOUNCEMENT_PUBLISHED]: NOTIFICATION_TYPES.ANNOUNCEMENT
};

// Метаданные событий
const EVENT_METADATA = {
    // === События заказов ===
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

    // === События платежей ===
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

    // === События пользователя ===
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

    // === События мастера ===
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

    // === События СТО ===
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

// Категории событий
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

// Группы событий по приоритету обработки
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

// События требующие немедленной обработки
const IMMEDIATE_EVENTS = [
    NOTIFICATION_EVENTS.USER_OTP_REQUESTED,
    NOTIFICATION_EVENTS.ORDER_MASTER_ASSIGNED,
    NOTIFICATION_EVENTS.ORDER_MASTER_ARRIVED,
    NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
    NOTIFICATION_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY
];

// События с автоматическим retry
const RETRIABLE_EVENTS = {
    [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: {
        maxRetries: 5,
        retryDelay: 60000 // 1 минута
    },
    [NOTIFICATION_EVENTS.ORDER_CREATED]: {
        maxRetries: 3,
        retryDelay: 30000 // 30 секунд
    },
    [NOTIFICATION_EVENTS.USER_OTP_REQUESTED]: {
        maxRetries: 3,
        retryDelay: 10000 // 10 секунд
    }
};

// Вспомогательные функции

/**
 * Получить тип уведомления для события
 */
function getNotificationTypeForEvent(event) {
    return EVENT_TO_NOTIFICATION_TYPE[event] || null;
}

/**
 * Получить метаданные события
 */
function getEventMetadata(event, lang = 'ru') {
    const metadata = EVENT_METADATA[event];
    if (!metadata) return null;

    return {
        ...metadata,
        name: metadata.name[lang] || metadata.name.ru,
        description: metadata.description[lang] || metadata.description.ru
    };
}

/**
 * Проверить валидность события
 */
function isValidEvent(event) {
    return Object.values(NOTIFICATION_EVENTS).includes(event);
}

/**
 * Получить получателей для события
 */
function getEventRecipients(event) {
    const metadata = EVENT_METADATA[event];
    if (!metadata) return [];

    return metadata.recipients || [];
}

/**
 * Проверить, требует ли событие немедленной обработки
 */
function isImmediateEvent(event) {
    return IMMEDIATE_EVENTS.includes(event);
}

/**
 * Получить приоритет события
 */
function getEventPriority(event) {
    for (const [priority, events] of Object.entries(EVENT_PRIORITY_GROUPS)) {
        if (events.includes(event)) {
            return priority.toLowerCase();
        }
    }
    return 'normal';
}

/**
 * Проверить, поддерживает ли событие retry
 */
function isRetriableEvent(event) {
    return event in RETRIABLE_EVENTS;
}

/**
 * Получить настройки retry для события
 */
function getRetrySettings(event) {
    return RETRIABLE_EVENTS[event] || null;
}

/**
 * Получить требуемые данные для события
 */
function getRequiredEventData(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.data || [];
}

/**
 * Валидировать данные события
 */
function validateEventData(event, data) {
    const requiredFields = getRequiredEventData(event);
    const missingFields = requiredFields.filter(field => !(field in data));

    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}

/**
 * Получить категорию события
 */
function getEventCategory(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.category || 'system';
}

/**
 * Фильтровать события по категории
 */
function filterEventsByCategory(category) {
    return Object.entries(EVENT_METADATA)
        .filter(([_, metadata]) => metadata.category === category)
        .map(([event]) => event);
}

/**
 * Получить действия для события
 */
function getEventActions(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.actions || [];
}

/**
 * Проверить, является ли событие чувствительным к безопасности
 */
function isSecuritySensitiveEvent(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.security?.sensitive || false;
}

/**
 * Получить расписание для события
 */
function getEventSchedule(event) {
    const metadata = EVENT_METADATA[event];
    return metadata?.schedule || null;
}

/**
 * Получить события для роли пользователя
 */
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

/**
 * Группировать события по триггерам
 */
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

// Экспортируем
module.exports = {
    // Константы
    NOTIFICATION_EVENTS,
    EVENT_TO_NOTIFICATION_TYPE,
    EVENT_METADATA,
    EVENT_CATEGORIES,
    EVENT_PRIORITY_GROUPS,
    IMMEDIATE_EVENTS,
    RETRIABLE_EVENTS,

    // Функции
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