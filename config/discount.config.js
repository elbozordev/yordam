

'use strict';

module.exports = {
    
    general: {
        
        allowMultipleDiscounts: false,

        
        maxTotalDiscountPercent: 50,

        
        minOrderAmount: 10000, 

        
        cacheTime: 300, 

        
        enableUsageLogging: true
    },

    
    types: {
        
        percentage: {
            min: 1,        
            max: 50,       
            allowDecimal: true
        },

        
        fixedAmount: {
            min: 1000,     
            max: 100000,   
            
            maxPercentOfOrder: 30
        },

        
        firstOrder: {
            defaultPercent: 10,
            maxPercent: 20,
            
            validityDays: 30
        },

        
        promocode: {
            minLength: 4,
            maxLength: 20,
            
            allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            
            autoGenerate: {
                prefix: 'ROAD',
                length: 8
            }
        },

        
        loyalty: {
            
            levels: {
                bronze: { ordersCount: 5, discount: 3 },
                silver: { ordersCount: 15, discount: 5 },
                gold: { ordersCount: 30, discount: 7 },
                platinum: { ordersCount: 50, discount: 10 }
            }
        },

        
        referral: {
            
            referrerDiscount: 5,
            
            refereeDiscount: 10,
            
            maxReferralsPerUser: 10
        },

        
        volume: {
            
            thresholds: [
                { minAmount: 50000, discount: 3 },
                { minAmount: 100000, discount: 5 },
                { minAmount: 200000, discount: 7 },
                { minAmount: 500000, discount: 10 }
            ]
        }
    },

    
    usage: {
        
        maxUsagesPerUser: 1,

        
        defaultMaxUsages: 1000,

        
        minUsageInterval: 0,

        
        blockOnSuspiciousActivity: true,

        
        suspiciousThreshold: 10
    },

    
    validity: {
        
        maxValidityDays: 365,

        
        defaultValidityDays: 30,

        
        allowPermanent: false,

        
        timezone: 'Asia/Tashkent'
    },

    
    combination: {
        
        priority: [
            'COMPENSATION',
            'FIRST_ORDER',
            'CORPORATE',
            'LOYALTY',
            'PROMOCODE',
            'SEASONAL',
            'STO_DISCOUNT',
            'VOLUME',
            'REFERRAL',
            'SERVICE_SPECIFIC'
        ],

        
        blacklist: [
            ['FIRST_ORDER', 'LOYALTY'],
            ['COMPENSATION', 'PROMOCODE']
        ]
    },

    
    notifications: {
        
        notifyOnNew: true,

        
        notifyBeforeExpiry: [7, 3, 1],

        
        notifyOnUsage: true
    },

    
    sto: {
        
        allowCustomDiscounts: true,

        
        maxDiscountPercent: 30,

        
        stoPaysFull: false,

        
        paymentSplit: {
            platform: 30,  
            sto: 70        
        }
    },

    
    validation: {
        
        checkWalletBalance: true,

        
        checkOrderHistory: true,

        
        strictMode: true
    }
};