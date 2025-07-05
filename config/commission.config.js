

'use strict';

module.exports = {
    
    rates: {
        
        master: {
            individual: 20,      
            entrepreneur: 18,    
            employee: 15         
        },

        
        sto: {
            standard: 15,        
            premium: 12,         
            exclusive: 10        
        },

        
        limits: {
            min: 5,              
            max: 30              
        }
    },

    
    fixed: {
        
        minAmount: 5000,         

        
        maxAmount: 500000,       

        
        serviceFee: 3000         
    },

    
    serviceRules: {
        
        emergency: {
            rate: 25,            
            services: ['evacuator', 'emergency_repair']
        },

        standard: {
            rate: 20,            
            services: ['tire_service', 'battery_charge', 'fuel_delivery']
        },

        consultation: {
            rate: 15,            
            services: ['consultation', 'euro_protocol', 'insurance_help']
        },

        diagnostic: {
            rate: 18,            
            services: ['computer_diagnostic', 'electrician']
        }
    },

    
    surge: {
        enabled: true,

        
        multipliers: {
            low: 1.0,            
            medium: 1.2,         
            high: 1.5,           
            extreme: 2.0         
        },

        
        peakHours: {
            morning: { start: 7, end: 10 },      
            evening: { start: 17, end: 20 },     
            night: { start: 22, end: 6 }         
        },

        
        weatherMultiplier: {
            rain: 1.3,           
            snow: 1.5,           
            storm: 2.0           
        }
    },

    
    incentives: {
        
        volumeDiscount: {
            enabled: true,
            tiers: [
                { orders: 50, discount: 2 },      
                { orders: 100, discount: 3 },     
                { orders: 200, discount: 5 }      
            ]
        },

        
        newMasterDiscount: {
            enabled: true,
            rate: 10,            
            durationDays: 30
        },

        
        penalties: {
            cancellation: {
                rate: 5,         
                threshold: 15    
            },

            lowRating: {
                rate: 3,         
                threshold: 4.0   
            }
        }
    },

    
    special: {
        
        corporate: {
            rate: 10,            
            minOrders: 20        
        },

        
        promo: {
            enabled: false,
            rate: 15,            
            startDate: null,
            endDate: null
        },

        
        firstOrder: {
            masterRate: 10,      
            clientFee: 0         
        }
    },

    
    calculation: {
        
        rounding: {
            enabled: true,
            precision: 1000      
        },

        
        vat: {
            enabled: true,
            rate: 12             
        },

        
        currency: 'UZS',

        
        settlementPeriod: 'daily' 
    },

    
    transactionLimits: {
        
        minWithdrawal: 50000,    

        
        maxTransaction: 10000000, 

        
        dailyLimit: 50000000     
    },

    
    holdPeriod: {
        standard: 24,            
        newMaster: 72,           
        disputed: 168            
    }
};