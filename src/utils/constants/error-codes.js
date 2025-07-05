// src/utils/constants/error-codes.js

'use strict';

/**
 * Централизованный файл с кодами ошибок для всей системы Yordam24
 * Структурирован по категориям и включает HTTP статусы
 */

// ============= КАТЕГОРИИ ОШИБОК =============

// Общие системные ошибки (5xx)
const SYSTEM_ERRORS = {
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        httpStatus: 500,
        category: 'system'
    },
    DATABASE_ERROR: {
        code: 'DATABASE_ERROR',
        httpStatus: 500,
        category: 'system'
    },
    CACHE_ERROR: {
        code: 'CACHE_ERROR',
        httpStatus: 500,
        category: 'system'
    },
    QUEUE_ERROR: {
        code: 'QUEUE_ERROR',
        httpStatus: 500,
        category: 'system'
    },
    EXTERNAL_SERVICE_ERROR: {
        code: 'EXTERNAL_SERVICE_ERROR',
        httpStatus: 502,
        category: 'system'
    },
    SERVICE_UNAVAILABLE: {
        code: 'SERVICE_UNAVAILABLE',
        httpStatus: 503,
        category: 'system'
    },
    GATEWAY_TIMEOUT: {
        code: 'GATEWAY_TIMEOUT',
        httpStatus: 504,
        category: 'system'
    }
};

// Ошибки валидации (4xx)
const VALIDATION_ERRORS = {
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_INPUT: {
        code: 'INVALID_INPUT',
        httpStatus: 400,
        category: 'validation'
    },
    MISSING_FIELD: {
        code: 'MISSING_FIELD',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_FORMAT: {
        code: 'INVALID_FORMAT',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_PHONE_NUMBER: {
        code: 'INVALID_PHONE_NUMBER',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_EMAIL: {
        code: 'INVALID_EMAIL',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_COORDINATES: {
        code: 'INVALID_COORDINATES',
        httpStatus: 400,
        category: 'validation'
    },
    INVALID_DATE_RANGE: {
        code: 'INVALID_DATE_RANGE',
        httpStatus: 400,
        category: 'validation'
    },
    FILE_TOO_LARGE: {
        code: 'FILE_TOO_LARGE',
        httpStatus: 413,
        category: 'validation'
    },
    INVALID_FILE_TYPE: {
        code: 'INVALID_FILE_TYPE',
        httpStatus: 415,
        category: 'validation'
    }
};

// Ошибки аутентификации (401)
const AUTH_ERRORS = {
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        httpStatus: 401,
        category: 'auth'
    },
    INVALID_CREDENTIALS: {
        code: 'INVALID_CREDENTIALS',
        httpStatus: 401,
        category: 'auth'
    },
    TOKEN_MISSING: {
        code: 'TOKEN_MISSING',
        httpStatus: 401,
        category: 'auth'
    },
    TOKEN_INVALID: {
        code: 'TOKEN_INVALID',
        httpStatus: 401,
        category: 'auth'
    },
    TOKEN_EXPIRED: {
        code: 'TOKEN_EXPIRED',
        httpStatus: 401,
        category: 'auth'
    },
    TOKEN_REVOKED: {
        code: 'TOKEN_REVOKED',
        httpStatus: 401,
        category: 'auth'
    },
    TOKEN_BLACKLISTED: {
        code: 'TOKEN_BLACKLISTED',
        httpStatus: 401,
        category: 'auth'
    },
    SESSION_EXPIRED: {
        code: 'SESSION_EXPIRED',
        httpStatus: 401,
        category: 'auth'
    },
    DEVICE_MISMATCH: {
        code: 'DEVICE_MISMATCH',
        httpStatus: 401,
        category: 'auth'
    },
    IP_MISMATCH: {
        code: 'IP_MISMATCH',
        httpStatus: 401,
        category: 'auth'
    }
};

// Ошибки авторизации (403)
const PERMISSION_ERRORS = {
    FORBIDDEN: {
        code: 'FORBIDDEN',
        httpStatus: 403,
        category: 'permission'
    },
    ACCESS_DENIED: {
        code: 'ACCESS_DENIED',
        httpStatus: 403,
        category: 'permission'
    },
    INSUFFICIENT_PERMISSIONS: {
        code: 'INSUFFICIENT_PERMISSIONS',
        httpStatus: 403,
        category: 'permission'
    },
    INVALID_ROLE: {
        code: 'INVALID_ROLE',
        httpStatus: 403,
        category: 'permission'
    },
    ACCOUNT_BLOCKED: {
        code: 'ACCOUNT_BLOCKED',
        httpStatus: 403,
        category: 'permission'
    },
    ACCOUNT_SUSPENDED: {
        code: 'ACCOUNT_SUSPENDED',
        httpStatus: 403,
        category: 'permission'
    },
    ACCOUNT_UNVERIFIED: {
        code: 'ACCOUNT_UNVERIFIED',
        httpStatus: 403,
        category: 'permission'
    },
    IP_BLOCKED: {
        code: 'IP_BLOCKED',
        httpStatus: 403,
        category: 'permission'
    },
    DEVICE_UNTRUSTED: {
        code: 'DEVICE_UNTRUSTED',
        httpStatus: 403,
        category: 'permission'
    },
    SUSPICIOUS_ACTIVITY: {
        code: 'SUSPICIOUS_ACTIVITY',
        httpStatus: 403,
        category: 'permission'
    },
    TWO_FACTOR_REQUIRED: {
        code: 'TWO_FACTOR_REQUIRED',
        httpStatus: 428,
        category: 'permission'
    }
};

// Ошибки ресурсов (404)
const RESOURCE_ERRORS = {
    NOT_FOUND: {
        code: 'NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    ORDER_NOT_FOUND: {
        code: 'ORDER_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    MASTER_NOT_FOUND: {
        code: 'MASTER_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    STO_NOT_FOUND: {
        code: 'STO_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    VEHICLE_NOT_FOUND: {
        code: 'VEHICLE_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    PAYMENT_NOT_FOUND: {
        code: 'PAYMENT_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    SERVICE_NOT_FOUND: {
        code: 'SERVICE_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    DOCUMENT_NOT_FOUND: {
        code: 'DOCUMENT_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    },
    ROUTE_NOT_FOUND: {
        code: 'ROUTE_NOT_FOUND',
        httpStatus: 404,
        category: 'resource'
    }
};

// Конфликты и дубликаты (409)
const CONFLICT_ERRORS = {
    ALREADY_EXISTS: {
        code: 'ALREADY_EXISTS',
        httpStatus: 409,
        category: 'conflict'
    },
    DUPLICATE_ENTRY: {
        code: 'DUPLICATE_ENTRY',
        httpStatus: 409,
        category: 'conflict'
    },
    PHONE_ALREADY_REGISTERED: {
        code: 'PHONE_ALREADY_REGISTERED',
        httpStatus: 409,
        category: 'conflict'
    },
    EMAIL_ALREADY_REGISTERED: {
        code: 'EMAIL_ALREADY_REGISTERED',
        httpStatus: 409,
        category: 'conflict'
    },
    ORDER_ALREADY_TAKEN: {
        code: 'ORDER_ALREADY_TAKEN',
        httpStatus: 409,
        category: 'conflict'
    },
    VEHICLE_ALREADY_ADDED: {
        code: 'VEHICLE_ALREADY_ADDED',
        httpStatus: 409,
        category: 'conflict'
    },
    DUPLICATE_TRANSACTION: {
        code: 'DUPLICATE_TRANSACTION',
        httpStatus: 409,
        category: 'conflict'
    }
};

// Ошибки ограничений (429)
const RATE_LIMIT_ERRORS = {
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        httpStatus: 429,
        category: 'rateLimit'
    },
    TOO_MANY_REQUESTS: {
        code: 'TOO_MANY_REQUESTS',
        httpStatus: 429,
        category: 'rateLimit'
    },
    TOO_MANY_ATTEMPTS: {
        code: 'TOO_MANY_ATTEMPTS',
        httpStatus: 429,
        category: 'rateLimit'
    },
    OTP_RATE_LIMIT: {
        code: 'OTP_RATE_LIMIT',
        httpStatus: 429,
        category: 'rateLimit'
    }
};

// OTP ошибки
const OTP_ERRORS = {
    OTP_INVALID: {
        code: 'OTP_INVALID',
        httpStatus: 401,
        category: 'otp'
    },
    OTP_EXPIRED: {
        code: 'OTP_EXPIRED',
        httpStatus: 401,
        category: 'otp'
    },
    OTP_NOT_FOUND: {
        code: 'OTP_NOT_FOUND',
        httpStatus: 404,
        category: 'otp'
    },
    OTP_ALREADY_USED: {
        code: 'OTP_ALREADY_USED',
        httpStatus: 400,
        category: 'otp'
    }
};

// Бизнес-логика: Заказы
const ORDER_ERRORS = {
    ORDER_CANCELLED: {
        code: 'ORDER_CANCELLED',
        httpStatus: 410,
        category: 'order'
    },
    ORDER_EXPIRED: {
        code: 'ORDER_EXPIRED',
        httpStatus: 410,
        category: 'order'
    },
    ORDER_ALREADY_ASSIGNED: {
        code: 'ORDER_ALREADY_ASSIGNED',
        httpStatus: 409,
        category: 'order'
    },
    ORDER_IN_PROGRESS: {
        code: 'ORDER_IN_PROGRESS',
        httpStatus: 400,
        category: 'order'
    },
    ORDER_COMPLETED: {
        code: 'ORDER_COMPLETED',
        httpStatus: 400,
        category: 'order'
    },
    INVALID_ORDER_STATUS: {
        code: 'INVALID_ORDER_STATUS',
        httpStatus: 400,
        category: 'order'
    },
    INVALID_ORDER_TRANSITION: {
        code: 'INVALID_ORDER_TRANSITION',
        httpStatus: 400,
        category: 'order'
    },
    NO_MASTERS_AVAILABLE: {
        code: 'NO_MASTERS_AVAILABLE',
        httpStatus: 410,
        category: 'order'
    },
    MASTER_TOO_FAR: {
        code: 'MASTER_TOO_FAR',
        httpStatus: 400,
        category: 'order'
    },
    SERVICE_AREA_NOT_COVERED: {
        code: 'SERVICE_AREA_NOT_COVERED',
        httpStatus: 400,
        category: 'order'
    }
};

// Бизнес-логика: Мастера
const MASTER_ERRORS = {
    MASTER_OFFLINE: {
        code: 'MASTER_OFFLINE',
        httpStatus: 410,
        category: 'master'
    },
    MASTER_BUSY: {
        code: 'MASTER_BUSY',
        httpStatus: 410,
        category: 'master'
    },
    MASTER_NOT_VERIFIED: {
        code: 'MASTER_NOT_VERIFIED',
        httpStatus: 403,
        category: 'master'
    },
    MASTER_SUSPENDED: {
        code: 'MASTER_SUSPENDED',
        httpStatus: 403,
        category: 'master'
    },
    MAX_ACTIVE_ORDERS_REACHED: {
        code: 'MAX_ACTIVE_ORDERS_REACHED',
        httpStatus: 400,
        category: 'master'
    },
    DOCUMENTS_NOT_VERIFIED: {
        code: 'DOCUMENTS_NOT_VERIFIED',
        httpStatus: 403,
        category: 'master'
    },
    DOCUMENTS_EXPIRED: {
        code: 'DOCUMENTS_EXPIRED',
        httpStatus: 403,
        category: 'master'
    }
};

// Бизнес-логика: Платежи
const PAYMENT_ERRORS = {
    PAYMENT_REQUIRED: {
        code: 'PAYMENT_REQUIRED',
        httpStatus: 402,
        category: 'payment'
    },
    INSUFFICIENT_BALANCE: {
        code: 'INSUFFICIENT_BALANCE',
        httpStatus: 402,
        category: 'payment'
    },
    PAYMENT_FAILED: {
        code: 'PAYMENT_FAILED',
        httpStatus: 402,
        category: 'payment'
    },
    PAYMENT_CANCELLED: {
        code: 'PAYMENT_CANCELLED',
        httpStatus: 400,
        category: 'payment'
    },
    PAYMENT_EXPIRED: {
        code: 'PAYMENT_EXPIRED',
        httpStatus: 400,
        category: 'payment'
    },
    INVALID_PAYMENT_METHOD: {
        code: 'INVALID_PAYMENT_METHOD',
        httpStatus: 400,
        category: 'payment'
    },
    PAYMENT_ALREADY_PROCESSED: {
        code: 'PAYMENT_ALREADY_PROCESSED',
        httpStatus: 409,
        category: 'payment'
    },
    REFUND_PERIOD_EXPIRED: {
        code: 'REFUND_PERIOD_EXPIRED',
        httpStatus: 400,
        category: 'payment'
    },
    WITHDRAWAL_LIMIT_EXCEEDED: {
        code: 'WITHDRAWAL_LIMIT_EXCEEDED',
        httpStatus: 400,
        category: 'payment'
    },
    MIN_WITHDRAWAL_NOT_MET: {
        code: 'MIN_WITHDRAWAL_NOT_MET',
        httpStatus: 400,
        category: 'payment'
    }
};

// Бизнес-логика: СТО
const STO_ERRORS = {
    STO_NOT_VERIFIED: {
        code: 'STO_NOT_VERIFIED',
        httpStatus: 403,
        category: 'sto'
    },
    STO_SUSPENDED: {
        code: 'STO_SUSPENDED',
        httpStatus: 403,
        category: 'sto'
    },
    STO_INACTIVE: {
        code: 'STO_INACTIVE',
        httpStatus: 410,
        category: 'sto'
    },
    MAX_EMPLOYEES_REACHED: {
        code: 'MAX_EMPLOYEES_REACHED',
        httpStatus: 400,
        category: 'sto'
    },
    EMPLOYEE_NOT_FOUND: {
        code: 'EMPLOYEE_NOT_FOUND',
        httpStatus: 404,
        category: 'sto'
    }
};

// Бизнес-логика: Геолокация
const GEO_ERRORS = {
    LOCATION_REQUIRED: {
        code: 'LOCATION_REQUIRED',
        httpStatus: 400,
        category: 'geo'
    },
    INVALID_LOCATION: {
        code: 'INVALID_LOCATION',
        httpStatus: 400,
        category: 'geo'
    },
    LOCATION_TOO_FAR: {
        code: 'LOCATION_TOO_FAR',
        httpStatus: 400,
        category: 'geo'
    },
    GEOCODING_FAILED: {
        code: 'GEOCODING_FAILED',
        httpStatus: 502,
        category: 'geo'
    },
    ROUTE_NOT_AVAILABLE: {
        code: 'ROUTE_NOT_AVAILABLE',
        httpStatus: 502,
        category: 'geo'
    }
};

// ============= ОБЪЕДИНЕННЫЙ СЛОВАРЬ =============

const ERROR_CODES = {
    ...SYSTEM_ERRORS,
    ...VALIDATION_ERRORS,
    ...AUTH_ERRORS,
    ...PERMISSION_ERRORS,
    ...RESOURCE_ERRORS,
    ...CONFLICT_ERRORS,
    ...RATE_LIMIT_ERRORS,
    ...OTP_ERRORS,
    ...ORDER_ERRORS,
    ...MASTER_ERRORS,
    ...PAYMENT_ERRORS,
    ...STO_ERRORS,
    ...GEO_ERRORS
};

// ============= СООБЩЕНИЯ ОБ ОШИБКАХ =============

const ERROR_MESSAGES = {
    // Системные ошибки
    INTERNAL_ERROR: {
        ru: 'Внутренняя ошибка сервера',
        uz: 'Server ichki xatosi',
        en: 'Internal server error'
    },
    DATABASE_ERROR: {
        ru: 'Ошибка базы данных',
        uz: 'Ma\'lumotlar bazasi xatosi',
        en: 'Database error'
    },
    SERVICE_UNAVAILABLE: {
        ru: 'Сервис временно недоступен',
        uz: 'Xizmat vaqtincha mavjud emas',
        en: 'Service temporarily unavailable'
    },

    // Валидация
    VALIDATION_ERROR: {
        ru: 'Ошибка валидации данных',
        uz: 'Ma\'lumotlarni tekshirishda xatolik',
        en: 'Validation error'
    },
    MISSING_FIELD: {
        ru: 'Обязательное поле не заполнено',
        uz: 'Majburiy maydon to\'ldirilmagan',
        en: 'Required field is missing'
    },
    INVALID_PHONE_NUMBER: {
        ru: 'Неверный формат номера телефона',
        uz: 'Telefon raqami formati noto\'g\'ri',
        en: 'Invalid phone number format'
    },

    // Аутентификация
    UNAUTHORIZED: {
        ru: 'Требуется авторизация',
        uz: 'Avtorizatsiya talab qilinadi',
        en: 'Authorization required'
    },
    INVALID_CREDENTIALS: {
        ru: 'Неверный номер телефона или пароль',
        uz: 'Telefon raqami yoki parol noto\'g\'ri',
        en: 'Invalid phone number or password'
    },
    TOKEN_EXPIRED: {
        ru: 'Срок действия токена истек',
        uz: 'Token muddati tugagan',
        en: 'Token has expired'
    },

    // Авторизация
    FORBIDDEN: {
        ru: 'Доступ запрещен',
        uz: 'Kirish taqiqlangan',
        en: 'Access denied'
    },
    INSUFFICIENT_PERMISSIONS: {
        ru: 'Недостаточно прав для выполнения операции',
        uz: 'Operatsiyani bajarish uchun huquqlar yetarli emas',
        en: 'Insufficient permissions'
    },
    ACCOUNT_BLOCKED: {
        ru: 'Аккаунт заблокирован',
        uz: 'Hisob bloklangan',
        en: 'Account blocked'
    },

    // Ресурсы
    NOT_FOUND: {
        ru: 'Ресурс не найден',
        uz: 'Resurs topilmadi',
        en: 'Resource not found'
    },
    USER_NOT_FOUND: {
        ru: 'Пользователь не найден',
        uz: 'Foydalanuvchi topilmadi',
        en: 'User not found'
    },
    ORDER_NOT_FOUND: {
        ru: 'Заказ не найден',
        uz: 'Buyurtma topilmadi',
        en: 'Order not found'
    },

    // Конфликты
    ALREADY_EXISTS: {
        ru: 'Уже существует',
        uz: 'Allaqachon mavjud',
        en: 'Already exists'
    },
    PHONE_ALREADY_REGISTERED: {
        ru: 'Номер телефона уже зарегистрирован',
        uz: 'Telefon raqami allaqachon ro\'yxatdan o\'tgan',
        en: 'Phone number already registered'
    },

    // Rate limiting
    RATE_LIMIT_EXCEEDED: {
        ru: 'Слишком много запросов. Попробуйте позже',
        uz: 'Juda ko\'p so\'rovlar. Keyinroq urinib ko\'ring',
        en: 'Too many requests. Please try again later'
    },
    TOO_MANY_ATTEMPTS: {
        ru: 'Слишком много попыток',
        uz: 'Juda ko\'p urinishlar',
        en: 'Too many attempts'
    },

    // OTP
    OTP_INVALID: {
        ru: 'Неверный код подтверждения',
        uz: 'Tasdiqlash kodi noto\'g\'ri',
        en: 'Invalid verification code'
    },
    OTP_EXPIRED: {
        ru: 'Срок действия кода истек',
        uz: 'Kod muddati tugagan',
        en: 'Verification code expired'
    },

    // Заказы
    NO_MASTERS_AVAILABLE: {
        ru: 'Нет доступных мастеров',
        uz: 'Mavjud ustalar yo\'q',
        en: 'No masters available'
    },
    ORDER_CANCELLED: {
        ru: 'Заказ отменен',
        uz: 'Buyurtma bekor qilindi',
        en: 'Order cancelled'
    },
    ORDER_EXPIRED: {
        ru: 'Время поиска мастера истекло',
        uz: 'Usta qidirish vaqti tugadi',
        en: 'Master search time expired'
    },

    // Платежи
    INSUFFICIENT_BALANCE: {
        ru: 'Недостаточно средств',
        uz: 'Mablag\' yetarli emas',
        en: 'Insufficient balance'
    },
    PAYMENT_FAILED: {
        ru: 'Ошибка оплаты',
        uz: 'To\'lov xatosi',
        en: 'Payment failed'
    },

    // Геолокация
    LOCATION_REQUIRED: {
        ru: 'Необходимо указать местоположение',
        uz: 'Joylashuvni ko\'rsatish kerak',
        en: 'Location required'
    },
    SERVICE_AREA_NOT_COVERED: {
        ru: 'Данный район не обслуживается',
        uz: 'Bu hudud xizmat ko\'rsatilmaydi',
        en: 'Service area not covered'
    }
};

// ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

/**
 * Получение информации об ошибке по коду
 */
function getErrorInfo(code) {
    return ERROR_CODES[code] || null;
}

/**
 * Получение HTTP статуса по коду ошибки
 */
function getHttpStatus(code) {
    const errorInfo = getErrorInfo(code);
    return errorInfo ? errorInfo.httpStatus : 500;
}

/**
 * Получение категории ошибки
 */
function getErrorCategory(code) {
    const errorInfo = getErrorInfo(code);
    return errorInfo ? errorInfo.category : 'unknown';
}

/**
 * Получение сообщения об ошибке
 */
function getErrorMessage(code, lang = 'ru') {
    const messages = ERROR_MESSAGES[code];
    if (!messages) return code;

    return messages[lang] || messages.ru || code;
}

/**
 * Проверка, является ли код валидным
 */
function isValidErrorCode(code) {
    return !!ERROR_CODES[code];
}

/**
 * Получение всех кодов ошибок по категории
 */
function getErrorsByCategory(category) {
    return Object.entries(ERROR_CODES)
        .filter(([_, info]) => info.category === category)
        .map(([code]) => code);
}

/**
 * Проверка, является ли ошибка клиентской (4xx)
 */
function isClientError(code) {
    const status = getHttpStatus(code);
    return status >= 400 && status < 500;
}

/**
 * Проверка, является ли ошибка серверной (5xx)
 */
function isServerError(code) {
    const status = getHttpStatus(code);
    return status >= 500;
}

/**
 * Создание объекта ошибки
 */
function createError(code, details = null, lang = 'ru') {
    const errorInfo = getErrorInfo(code);
    if (!errorInfo) {
        return {
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error',
            httpStatus: 500,
            details
        };
    }

    return {
        code: errorInfo.code,
        message: getErrorMessage(code, lang),
        httpStatus: errorInfo.httpStatus,
        category: errorInfo.category,
        details
    };
}

/**
 * Форматирование ошибки для ответа клиенту
 */
function formatErrorResponse(code, details = null, lang = 'ru') {
    const error = createError(code, details, lang);

    return {
        error: {
            code: error.code,
            message: error.message,
            details: error.details
        }
    };
}

// ============= КАТЕГОРИИ ДЛЯ УДОБСТВА =============

const ERROR_CATEGORIES = {
    SYSTEM: 'system',
    VALIDATION: 'validation',
    AUTH: 'auth',
    PERMISSION: 'permission',
    RESOURCE: 'resource',
    CONFLICT: 'conflict',
    RATE_LIMIT: 'rateLimit',
    OTP: 'otp',
    ORDER: 'order',
    MASTER: 'master',
    PAYMENT: 'payment',
    STO: 'sto',
    GEO: 'geo'
};

// ============= ЭКСПОРТ =============

module.exports = {
    // Все коды ошибок
    ERROR_CODES,

    // Группы ошибок
    SYSTEM_ERRORS,
    VALIDATION_ERRORS,
    AUTH_ERRORS,
    PERMISSION_ERRORS,
    RESOURCE_ERRORS,
    CONFLICT_ERRORS,
    RATE_LIMIT_ERRORS,
    OTP_ERRORS,
    ORDER_ERRORS,
    MASTER_ERRORS,
    PAYMENT_ERRORS,
    STO_ERRORS,
    GEO_ERRORS,

    // Сообщения
    ERROR_MESSAGES,

    // Категории
    ERROR_CATEGORIES,

    // Вспомогательные функции
    getErrorInfo,
    getHttpStatus,
    getErrorCategory,
    getErrorMessage,
    isValidErrorCode,
    getErrorsByCategory,
    isClientError,
    isServerError,
    createError,
    formatErrorResponse
};