

'use strict';

const { AppError } = require('./app-error');
const {
    ERROR_CODES,
    getErrorMessage,
    getHttpStatus,
    getErrorInfo
} = require('../constants/error-codes');


class BusinessError extends AppError {
    constructor(code, details = null, customMessage = null) {
        
        const errorInfo = getErrorInfo(code);

        if (!errorInfo) {
            
            super('Business logic error', 'BUSINESS_ERROR', 400, details);
            return;
        }

        
        const message = customMessage || getErrorMessage(code, 'ru');
        const httpStatus = getHttpStatus(code);

        super(message, code, httpStatus, details);

        
        this.category = errorInfo.category;
        this.isBusinessError = true;
    }

    
    getLocalizedMessages() {
        return {
            ru: getErrorMessage(this.code, 'ru'),
            uz: getErrorMessage(this.code, 'uz'),
            en: getErrorMessage(this.code, 'en')
        };
    }

    
    toClient(lang = 'ru', includeDetails = true) {
        const response = super.toClient(lang);

        
        if (this.code && BUSINESS_ERROR_HINTS[this.code]) {
            response.error.hint = BUSINESS_ERROR_HINTS[this.code][lang] ||
                BUSINESS_ERROR_HINTS[this.code].ru;
        }

        
        if (!includeDetails && process.env.NODE_ENV === 'production') {
            delete response.error.details;
        }

        return response;
    }

    
    isRetryable() {
        const retryableCodes = [
            'NO_MASTERS_AVAILABLE',
            'MASTER_BUSY',
            'MASTER_OFFLINE',
            'PAYMENT_PROCESSING',
            'GEOCODING_FAILED',
            'ROUTE_NOT_AVAILABLE'
        ];

        return retryableCodes.includes(this.code);
    }

    
    getSuggestedActions() {
        return SUGGESTED_ACTIONS[this.code] || [];
    }

    

    
    static orderNotFound(orderId) {
        return new BusinessError('ORDER_NOT_FOUND', { orderId });
    }

    static orderAlreadyTaken(orderId, masterId) {
        return new BusinessError('ORDER_ALREADY_TAKEN', { orderId, masterId });
    }

    static orderCancelled(orderId, reason = null) {
        return new BusinessError('ORDER_CANCELLED', { orderId, reason });
    }

    static noMastersAvailable(location, serviceType) {
        return new BusinessError('NO_MASTERS_AVAILABLE', {
            location,
            serviceType,
            searchRadius: 5000
        });
    }

    static invalidOrderTransition(orderId, currentStatus, targetStatus) {
        return new BusinessError('INVALID_ORDER_TRANSITION', {
            orderId,
            currentStatus,
            targetStatus
        });
    }

    static serviceAreaNotCovered(location) {
        return new BusinessError('SERVICE_AREA_NOT_COVERED', {
            lat: location.lat,
            lng: location.lng,
            nearestZone: location.nearestZone
        });
    }

    
    static masterNotVerified(masterId) {
        return new BusinessError('MASTER_NOT_VERIFIED', { masterId });
    }

    static masterOffline(masterId) {
        return new BusinessError('MASTER_OFFLINE', { masterId });
    }

    static masterBusy(masterId, activeOrders) {
        return new BusinessError('MASTER_BUSY', {
            masterId,
            activeOrders
        });
    }

    static documentsExpired(masterId, expiredDocs) {
        return new BusinessError('DOCUMENTS_EXPIRED', {
            masterId,
            documents: expiredDocs
        });
    }

    static maxActiveOrdersReached(masterId, currentCount, maxAllowed) {
        return new BusinessError('MAX_ACTIVE_ORDERS_REACHED', {
            masterId,
            currentCount,
            maxAllowed
        });
    }

    
    static insufficientBalance(required, available) {
        return new BusinessError('INSUFFICIENT_BALANCE', {
            required,
            available,
            shortage: required - available
        });
    }

    static paymentFailed(paymentId, reason) {
        return new BusinessError('PAYMENT_FAILED', {
            paymentId,
            reason,
            timestamp: new Date().toISOString()
        });
    }

    static minWithdrawalNotMet(requested, minimum) {
        return new BusinessError('MIN_WITHDRAWAL_NOT_MET', {
            requested,
            minimum
        });
    }

    static withdrawalLimitExceeded(requested, limit, period) {
        return new BusinessError('WITHDRAWAL_LIMIT_EXCEEDED', {
            requested,
            limit,
            period
        });
    }

    
    static phoneAlreadyRegistered(phone) {
        return new BusinessError('PHONE_ALREADY_REGISTERED', {
            phone: phone.slice(0, -4) + '****' 
        });
    }

    static accountBlocked(userId, reason) {
        return new BusinessError('ACCOUNT_BLOCKED', {
            userId,
            reason,
            supportEmail: 'support@yordam24.uz'
        });
    }

    static vehicleAlreadyAdded(vehicleNumber) {
        return new BusinessError('VEHICLE_ALREADY_ADDED', {
            vehicleNumber
        });
    }

    
    static stoNotVerified(stoId) {
        return new BusinessError('STO_NOT_VERIFIED', { stoId });
    }

    static maxEmployeesReached(stoId, currentCount, maxAllowed) {
        return new BusinessError('MAX_EMPLOYEES_REACHED', {
            stoId,
            currentCount,
            maxAllowed
        });
    }

    
    static invalidLocation(lat, lng) {
        return new BusinessError('INVALID_LOCATION', {
            lat,
            lng,
            validRange: {
                lat: { min: -90, max: 90 },
                lng: { min: -180, max: 180 }
            }
        });
    }

    static locationRequired() {
        return new BusinessError('LOCATION_REQUIRED');
    }

    
    static otpInvalid(attempts, maxAttempts) {
        return new BusinessError('OTP_INVALID', {
            attempts,
            maxAttempts,
            remainingAttempts: maxAttempts - attempts
        });
    }

    static otpExpired() {
        return new BusinessError('OTP_EXPIRED', {
            newOtpAvailable: true
        });
    }

    static otpRateLimit(nextRetryAt) {
        return new BusinessError('OTP_RATE_LIMIT', {
            nextRetryAt,
            waitSeconds: Math.ceil((nextRetryAt - Date.now()) / 1000)
        });
    }

    

    
    isCritical() {
        const criticalCodes = [
            'PAYMENT_FAILED',
            'DATABASE_ERROR',
            'FRAUD_SUSPECTED',
            'ACCOUNT_BLOCKED'
        ];

        return criticalCodes.includes(this.code);
    }

    
    requiresSupport() {
        const supportCodes = [
            'ACCOUNT_BLOCKED',
            'ACCOUNT_SUSPENDED',
            'FRAUD_SUSPECTED',
            'DISPUTED',
            'DOCUMENTS_EXPIRED'
        ];

        return supportCodes.includes(this.code);
    }
}


const BUSINESS_ERROR_HINTS = {
    NO_MASTERS_AVAILABLE: {
        ru: 'Попробуйте изменить время или расширить радиус поиска',
        uz: 'Vaqtni o\'zgartiring yoki qidiruv radiusini kengaytiring',
        en: 'Try changing the time or expanding the search radius'
    },

    INSUFFICIENT_BALANCE: {
        ru: 'Пополните баланс для продолжения',
        uz: 'Davom etish uchun balansni to\'ldiring',
        en: 'Top up your balance to continue'
    },

    SERVICE_AREA_NOT_COVERED: {
        ru: 'Укажите другой адрес в зоне обслуживания',
        uz: 'Xizmat ko\'rsatiladigan hududda boshqa manzilni ko\'rsating',
        en: 'Please specify another address within the service area'
    },

    DOCUMENTS_EXPIRED: {
        ru: 'Обновите документы в личном кабинете',
        uz: 'Hujjatlarni shaxsiy kabinetda yangilang',
        en: 'Update your documents in your personal account'
    },

    OTP_INVALID: {
        ru: 'Проверьте код и попробуйте снова',
        uz: 'Kodni tekshiring va qayta urinib ko\'ring',
        en: 'Check the code and try again'
    }
};


const SUGGESTED_ACTIONS = {
    NO_MASTERS_AVAILABLE: [
        'retry',        
        'schedule',     
        'expand_search' 
    ],

    INSUFFICIENT_BALANCE: [
        'top_up',       
        'use_card'      
    ],

    SERVICE_AREA_NOT_COVERED: [
        'change_location', 
        'contact_support'  
    ],

    DOCUMENTS_EXPIRED: [
        'upload_documents', 
        'contact_support'   
    ],

    PAYMENT_FAILED: [
        'retry',           
        'change_method',   
        'contact_support'  
    ]
};

module.exports = BusinessError;