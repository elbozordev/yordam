// src/utils/constants/order-status.js

'use strict';

// Основные статусы заказов
const ORDER_STATUS = {
    // Начальные статусы
    NEW: 'new',                         // Новый заказ, только создан
    SEARCHING: 'searching',             // Идет поиск мастера

    // Статусы назначения
    ASSIGNED: 'assigned',               // Мастер назначен
    ACCEPTED: 'accepted',               // Мастер принял заказ
    REJECTED: 'rejected',               // Мастер отклонил заказ

    // Статусы выполнения
    EN_ROUTE: 'en_route',              // Мастер в пути к клиенту
    ARRIVED: 'arrived',                 // Мастер прибыл
    IN_PROGRESS: 'in_progress',         // Работа началась

    // Финальные статусы
    COMPLETED: 'completed',             // Заказ успешно завершен
    CANCELLED: 'cancelled',             // Заказ отменен
    FAILED: 'failed',                   // Заказ не выполнен

    // Специальные статусы
    DISPUTED: 'disputed',               // Спорный заказ
    ON_HOLD: 'on_hold',                // Заказ приостановлен
    EXPIRED: 'expired'                  // Истек срок поиска мастера
};

// Группы статусов
const STATUS_GROUPS = {
    // Активные статусы (заказ в работе)
    ACTIVE: [
        ORDER_STATUS.NEW,
        ORDER_STATUS.SEARCHING,
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.ARRIVED,
        ORDER_STATUS.IN_PROGRESS,
        ORDER_STATUS.ON_HOLD
    ],

    // Финальные статусы (заказ завершен)
    FINAL: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.FAILED,
        ORDER_STATUS.EXPIRED
    ],

    // Статусы, когда мастер назначен
    WITH_MASTER: [
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.ARRIVED,
        ORDER_STATUS.IN_PROGRESS
    ],

    // Статусы, когда можно отменить
    CANCELLABLE: [
        ORDER_STATUS.NEW,
        ORDER_STATUS.SEARCHING,
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.EN_ROUTE
    ],

    // Статусы, требующие оплаты
    PAYABLE: [
        ORDER_STATUS.COMPLETED
    ],

    // Статусы для расчета статистики мастера
    COUNTABLE_FOR_MASTER: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.FAILED
    ]
};

// Разрешенные переходы между статусами
const STATUS_TRANSITIONS = {
    [ORDER_STATUS.NEW]: [
        ORDER_STATUS.SEARCHING,
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.SEARCHING]: [
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.EXPIRED,
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.ASSIGNED]: [
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.REJECTED,
        ORDER_STATUS.SEARCHING,  // Если мастер не ответил
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.ACCEPTED]: [
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.REJECTED]: [
        ORDER_STATUS.SEARCHING   // Возврат к поиску
    ],

    [ORDER_STATUS.EN_ROUTE]: [
        ORDER_STATUS.ARRIVED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.ON_HOLD
    ],

    [ORDER_STATUS.ARRIVED]: [
        ORDER_STATUS.IN_PROGRESS,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.ON_HOLD
    ],

    [ORDER_STATUS.IN_PROGRESS]: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.FAILED,
        ORDER_STATUS.ON_HOLD,
        ORDER_STATUS.DISPUTED
    ],

    [ORDER_STATUS.ON_HOLD]: [
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.ARRIVED,
        ORDER_STATUS.IN_PROGRESS,
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.DISPUTED]: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.FAILED,
        ORDER_STATUS.CANCELLED
    ],

    // Финальные статусы не могут переходить никуда
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.FAILED]: [],
    [ORDER_STATUS.EXPIRED]: []
};

// Временные ограничения для статусов (в миллисекундах)
const STATUS_TIMEOUTS = {
    [ORDER_STATUS.NEW]: 60000,              // 1 минута на начало поиска
    [ORDER_STATUS.SEARCHING]: 300000,       // 5 минут на поиск мастера
    [ORDER_STATUS.ASSIGNED]: 30000,         // 30 секунд на принятие мастером
    [ORDER_STATUS.ACCEPTED]: 300000,        // 5 минут на начало движения
    [ORDER_STATUS.EN_ROUTE]: 3600000,       // 1 час на прибытие
    [ORDER_STATUS.ARRIVED]: 600000,         // 10 минут на начало работы
    [ORDER_STATUS.IN_PROGRESS]: 10800000,   // 3 часа на выполнение работы
    [ORDER_STATUS.ON_HOLD]: 1800000         // 30 минут максимум на паузе
};

// Причины отмены для разных ролей
const CANCELLATION_REASONS = {
    CLIENT: {
        CHANGED_MIND: 'changed_mind',              // Передумал
        FOUND_ANOTHER: 'found_another',            // Нашел другого мастера
        WRONG_ADDRESS: 'wrong_address',            // Неправильный адрес
        PRICE_TOO_HIGH: 'price_too_high',         // Высокая цена
        LONG_WAIT: 'long_wait',                    // Долгое ожидание
        OTHER: 'other'                             // Другая причина
    },

    MASTER: {
        TOO_FAR: 'too_far',                        // Слишком далеко
        BUSY: 'busy',                              // Занят другим заказом
        NO_PARTS: 'no_parts',                      // Нет запчастей
        INAPPROPRIATE_ORDER: 'inappropriate_order', // Неподходящий заказ
        TECHNICAL_ISSUE: 'technical_issue',        // Технические проблемы
        OTHER: 'other'
    },

    SYSTEM: {
        NO_MASTERS: 'no_masters',                  // Нет доступных мастеров
        TIMEOUT: 'timeout',                        // Истекло время
        PAYMENT_FAILED: 'payment_failed',          // Ошибка оплаты
        FRAUD_DETECTED: 'fraud_detected',          // Обнаружено мошенничество
        TECHNICAL_ERROR: 'technical_error'         // Техническая ошибка
    }
};

// Причины неудачного выполнения
const FAILURE_REASONS = {
    CLIENT_ABSENT: 'client_absent',               // Клиент отсутствует
    WRONG_PROBLEM: 'wrong_problem',               // Неверно описана проблема
    CANNOT_FIX: 'cannot_fix',                     // Невозможно починить на месте
    NO_PAYMENT: 'no_payment',                     // Клиент отказался платить
    WEATHER: 'weather',                           // Погодные условия
    OTHER: 'other'
};

// Метаданные статусов (для UI и логики)
const STATUS_METADATA = {
    [ORDER_STATUS.NEW]: {
        label: {
            ru: 'Новый заказ',
            uz: 'Yangi buyurtma',
            en: 'New order'
        },
        icon: 'plus-circle',
        color: '#4CAF50',
        allowsEdit: true,
        visibleToClient: true,
        visibleToMaster: false
    },

    [ORDER_STATUS.SEARCHING]: {
        label: {
            ru: 'Поиск мастера',
            uz: 'Usta qidirilmoqda',
            en: 'Searching for master'
        },
        icon: 'search',
        color: '#2196F3',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.ASSIGNED]: {
        label: {
            ru: 'Мастер назначен',
            uz: 'Usta tayinlandi',
            en: 'Master assigned'
        },
        icon: 'user-check',
        color: '#FF9800',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.ACCEPTED]: {
        label: {
            ru: 'Мастер принял заказ',
            uz: 'Usta buyurtmani qabul qildi',
            en: 'Master accepted'
        },
        icon: 'check-circle',
        color: '#4CAF50',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.EN_ROUTE]: {
        label: {
            ru: 'Мастер в пути',
            uz: 'Usta yo\'lda',
            en: 'Master en route'
        },
        icon: 'navigation',
        color: '#00BCD4',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.ARRIVED]: {
        label: {
            ru: 'Мастер прибыл',
            uz: 'Usta yetib keldi',
            en: 'Master arrived'
        },
        icon: 'map-pin',
        color: '#4CAF50',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.IN_PROGRESS]: {
        label: {
            ru: 'Работа выполняется',
            uz: 'Ish bajarilmoqda',
            en: 'Work in progress'
        },
        icon: 'tool',
        color: '#FF5722',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.COMPLETED]: {
        label: {
            ru: 'Завершен',
            uz: 'Tugallandi',
            en: 'Completed'
        },
        icon: 'check-circle',
        color: '#4CAF50',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.CANCELLED]: {
        label: {
            ru: 'Отменен',
            uz: 'Bekor qilindi',
            en: 'Cancelled'
        },
        icon: 'x-circle',
        color: '#F44336',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    },

    [ORDER_STATUS.FAILED]: {
        label: {
            ru: 'Не выполнен',
            uz: 'Bajarilmadi',
            en: 'Failed'
        },
        icon: 'alert-circle',
        color: '#F44336',
        allowsEdit: false,
        visibleToClient: true,
        visibleToMaster: true
    }
};

// Вспомогательные функции

/**
 * Проверка, является ли статус финальным
 */
function isFinalStatus(status) {
    return STATUS_GROUPS.FINAL.includes(status);
}

/**
 * Проверка, является ли статус активным
 */
function isActiveStatus(status) {
    return STATUS_GROUPS.ACTIVE.includes(status);
}

/**
 * Проверка, можно ли отменить заказ в данном статусе
 */
function isCancellable(status) {
    return STATUS_GROUPS.CANCELLABLE.includes(status);
}

/**
 * Проверка, назначен ли мастер
 */
function hasMaster(status) {
    return STATUS_GROUPS.WITH_MASTER.includes(status);
}

/**
 * Проверка валидности перехода между статусами
 */
function canTransition(fromStatus, toStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
}

/**
 * Получение следующих возможных статусов
 */
function getNextStatuses(currentStatus) {
    return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Получение таймаута для статуса
 */
function getStatusTimeout(status) {
    return STATUS_TIMEOUTS[status] || null;
}

/**
 * Получение метаданных статуса
 */
function getStatusMetadata(status, lang = 'ru') {
    const metadata = STATUS_METADATA[status];
    if (!metadata) return null;

    return {
        ...metadata,
        label: metadata.label[lang] || metadata.label.ru
    };
}

/**
 * Определение, истек ли таймаут для статуса
 */
function isStatusExpired(status, statusChangedAt) {
    const timeout = getStatusTimeout(status);
    if (!timeout) return false;

    const elapsed = Date.now() - new Date(statusChangedAt).getTime();
    return elapsed > timeout;
}

/**
 * Валидация статуса
 */
function isValidStatus(status) {
    return Object.values(ORDER_STATUS).includes(status);
}

/**
 * Получение причины отмены по коду
 */
function getCancellationReason(role, code) {
    const reasons = CANCELLATION_REASONS[role.toUpperCase()];
    return reasons && reasons[code] ? code : null;
}

/**
 * Проверка, требует ли статус оплаты
 */
function requiresPayment(status) {
    return STATUS_GROUPS.PAYABLE.includes(status);
}

/**
 * Расчет прогресса заказа (0-100%)
 */
function calculateProgress(status) {
    const progressMap = {
        [ORDER_STATUS.NEW]: 10,
        [ORDER_STATUS.SEARCHING]: 20,
        [ORDER_STATUS.ASSIGNED]: 30,
        [ORDER_STATUS.ACCEPTED]: 40,
        [ORDER_STATUS.EN_ROUTE]: 50,
        [ORDER_STATUS.ARRIVED]: 60,
        [ORDER_STATUS.IN_PROGRESS]: 80,
        [ORDER_STATUS.COMPLETED]: 100,
        [ORDER_STATUS.CANCELLED]: 0,
        [ORDER_STATUS.FAILED]: 0
    };

    return progressMap[status] || 0;
}

// Экспортируем
module.exports = {
    ORDER_STATUS,
    STATUS_GROUPS,
    STATUS_TRANSITIONS,
    STATUS_TIMEOUTS,
    CANCELLATION_REASONS,
    FAILURE_REASONS,
    STATUS_METADATA,

    // Функции
    isFinalStatus,
    isActiveStatus,
    isCancellable,
    hasMaster,
    canTransition,
    getNextStatuses,
    getStatusTimeout,
    getStatusMetadata,
    isStatusExpired,
    isValidStatus,
    getCancellationReason,
    requiresPayment,
    calculateProgress
};