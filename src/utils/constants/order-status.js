

'use strict';


const ORDER_STATUS = {
    
    NEW: 'new',                         
    SEARCHING: 'searching',             

    
    ASSIGNED: 'assigned',               
    ACCEPTED: 'accepted',               
    REJECTED: 'rejected',               

    
    EN_ROUTE: 'en_route',              
    ARRIVED: 'arrived',                 
    IN_PROGRESS: 'in_progress',         

    
    COMPLETED: 'completed',             
    CANCELLED: 'cancelled',             
    FAILED: 'failed',                   

    
    DISPUTED: 'disputed',               
    ON_HOLD: 'on_hold',                
    EXPIRED: 'expired'                  
};


const STATUS_GROUPS = {
    
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

    
    FINAL: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.FAILED,
        ORDER_STATUS.EXPIRED
    ],

    
    WITH_MASTER: [
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.ARRIVED,
        ORDER_STATUS.IN_PROGRESS
    ],

    
    CANCELLABLE: [
        ORDER_STATUS.NEW,
        ORDER_STATUS.SEARCHING,
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.EN_ROUTE
    ],

    
    PAYABLE: [
        ORDER_STATUS.COMPLETED
    ],

    
    COUNTABLE_FOR_MASTER: [
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.FAILED
    ]
};


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
        ORDER_STATUS.SEARCHING,  
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.ACCEPTED]: [
        ORDER_STATUS.EN_ROUTE,
        ORDER_STATUS.CANCELLED
    ],

    [ORDER_STATUS.REJECTED]: [
        ORDER_STATUS.SEARCHING   
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

    
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.FAILED]: [],
    [ORDER_STATUS.EXPIRED]: []
};


const STATUS_TIMEOUTS = {
    [ORDER_STATUS.NEW]: 60000,              
    [ORDER_STATUS.SEARCHING]: 300000,       
    [ORDER_STATUS.ASSIGNED]: 30000,         
    [ORDER_STATUS.ACCEPTED]: 300000,        
    [ORDER_STATUS.EN_ROUTE]: 3600000,       
    [ORDER_STATUS.ARRIVED]: 600000,         
    [ORDER_STATUS.IN_PROGRESS]: 10800000,   
    [ORDER_STATUS.ON_HOLD]: 1800000         
};


const CANCELLATION_REASONS = {
    CLIENT: {
        CHANGED_MIND: 'changed_mind',              
        FOUND_ANOTHER: 'found_another',            
        WRONG_ADDRESS: 'wrong_address',            
        PRICE_TOO_HIGH: 'price_too_high',         
        LONG_WAIT: 'long_wait',                    
        OTHER: 'other'                             
    },

    MASTER: {
        TOO_FAR: 'too_far',                        
        BUSY: 'busy',                              
        NO_PARTS: 'no_parts',                      
        INAPPROPRIATE_ORDER: 'inappropriate_order', 
        TECHNICAL_ISSUE: 'technical_issue',        
        OTHER: 'other'
    },

    SYSTEM: {
        NO_MASTERS: 'no_masters',                  
        TIMEOUT: 'timeout',                        
        PAYMENT_FAILED: 'payment_failed',          
        FRAUD_DETECTED: 'fraud_detected',          
        TECHNICAL_ERROR: 'technical_error'         
    }
};


const FAILURE_REASONS = {
    CLIENT_ABSENT: 'client_absent',               
    WRONG_PROBLEM: 'wrong_problem',               
    CANNOT_FIX: 'cannot_fix',                     
    NO_PAYMENT: 'no_payment',                     
    WEATHER: 'weather',                           
    OTHER: 'other'
};


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




function isFinalStatus(status) {
    return STATUS_GROUPS.FINAL.includes(status);
}


function isActiveStatus(status) {
    return STATUS_GROUPS.ACTIVE.includes(status);
}


function isCancellable(status) {
    return STATUS_GROUPS.CANCELLABLE.includes(status);
}


function hasMaster(status) {
    return STATUS_GROUPS.WITH_MASTER.includes(status);
}


function canTransition(fromStatus, toStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
}


function getNextStatuses(currentStatus) {
    return STATUS_TRANSITIONS[currentStatus] || [];
}


function getStatusTimeout(status) {
    return STATUS_TIMEOUTS[status] || null;
}


function getStatusMetadata(status, lang = 'ru') {
    const metadata = STATUS_METADATA[status];
    if (!metadata) return null;

    return {
        ...metadata,
        label: metadata.label[lang] || metadata.label.ru
    };
}


function isStatusExpired(status, statusChangedAt) {
    const timeout = getStatusTimeout(status);
    if (!timeout) return false;

    const elapsed = Date.now() - new Date(statusChangedAt).getTime();
    return elapsed > timeout;
}


function isValidStatus(status) {
    return Object.values(ORDER_STATUS).includes(status);
}


function getCancellationReason(role, code) {
    const reasons = CANCELLATION_REASONS[role.toUpperCase()];
    return reasons && reasons[code] ? code : null;
}


function requiresPayment(status) {
    return STATUS_GROUPS.PAYABLE.includes(status);
}


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


module.exports = {
    ORDER_STATUS,
    STATUS_GROUPS,
    STATUS_TRANSITIONS,
    STATUS_TIMEOUTS,
    CANCELLATION_REASONS,
    FAILURE_REASONS,
    STATUS_METADATA,

    
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