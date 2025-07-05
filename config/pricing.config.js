

'use strict';

const { SERVICE_TYPES } = require('../src/utils/constants/service-types');

module.exports = {
    
    general: {
        
        currency: 'UZS',
        currencySymbol: 'сум',

        
        vat: {
            enabled: true,
            rate: 0.12,                      
            included: true                   
        },

        
        rounding: {
            enabled: true,
            precision: 1000,                 
            method: 'ceil'                   
        },

        
        priceUpdateInterval: 86400000,       
        cacheTime: 3600,                     

        
        displayFormat: {
            showCurrency: true,
            thousandSeparator: ' ',
            decimalSeparator: ',',
            decimals: 0
        }
    },

    
    basePrices: {
        
        [SERVICE_TYPES.TOWING]: {
            base: 150000,                    
            minimum: 100000,                 
            maximum: 1000000,                

            
            perKm: 5000,                     
            perHour: 0,                      

            
            options: {
                partial_loading: 50000,      
                full_loading: 0,             
                special_equipment: 100000    
            }
        },

        [SERVICE_TYPES.ELECTRICIAN]: {
            base: 100000,
            minimum: 70000,
            maximum: 500000,
            perHour: 50000,                  

            
            minimumDuration: 45              
        },

        [SERVICE_TYPES.MECHANIC]: {
            base: 120000,
            minimum: 80000,
            maximum: 600000,
            perHour: 60000,
            minimumDuration: 60
        },

        [SERVICE_TYPES.TIRE_SERVICE]: {
            base: 50000,
            minimum: 30000,
            maximum: 200000,

            options: {
                spare_tire_install: 0,
                tire_repair: 30000,
                new_tire: -1,                
                balancing: 20000
            }
        },

        [SERVICE_TYPES.LOCKSMITH]: {
            base: 80000,
            minimum: 60000,
            maximum: 300000,

            
            complexity: {
                simple: 1.0,                 
                medium: 1.5,                 
                complex: 2.0                 
            }
        },

        [SERVICE_TYPES.FUEL_DELIVERY]: {
            base: 40000,                     
            minimum: 40000,
            maximum: 200000,

            
            fuel: {
                price_per_liter: 15000,      
                minimum_liters: 10,
                maximum_liters: 50
            }
        },

        [SERVICE_TYPES.BATTERY_CHARGE]: {
            base: 60000,
            minimum: 40000,
            maximum: 250000,

            options: {
                jump_start: 0,               
                new_battery: -1,             
                battery_test: 20000          
            }
        },

        [SERVICE_TYPES.EURO_PROTOCOL]: {
            base: 100000,
            minimum: 80000,
            maximum: 200000,

            
            fixedPrice: true
        },

        [SERVICE_TYPES.CONSULTATION]: {
            base: 50000,
            minimum: 30000,
            maximum: 150000,

            
            types: {
                phone: 0.5,                  
                video: 0.8,                  
                onsite: 1.5                  
            }
        },

        [SERVICE_TYPES.DIAGNOSTICS]: {
            base: 80000,
            minimum: 60000,
            maximum: 300000,
            perHour: 40000,

            
            types: {
                basic: 1.0,
                computer: 1.5,
                complex: 2.0
            }
        }
    },

    
    timeModifiers: {
        
        night: {
            enabled: true,
            periods: [
                { start: 22, end: 6 }        
            ],

            
            multipliers: {
                [SERVICE_TYPES.TOWING]: 1.5,
                [SERVICE_TYPES.ELECTRICIAN]: 1.3,
                [SERVICE_TYPES.MECHANIC]: 1.3,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.5,
                [SERVICE_TYPES.LOCKSMITH]: 1.5,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.3,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.4,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.2,
                [SERVICE_TYPES.CONSULTATION]: 1.0,    
                [SERVICE_TYPES.DIAGNOSTICS]: 1.2,

                default: 1.3                          
            }
        },

        
        weekend: {
            enabled: true,
            days: [0, 6],                    

            multipliers: {
                [SERVICE_TYPES.TOWING]: 1.2,
                [SERVICE_TYPES.ELECTRICIAN]: 1.15,
                [SERVICE_TYPES.MECHANIC]: 1.2,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.2,
                [SERVICE_TYPES.LOCKSMITH]: 1.3,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.1,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.2,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.1,
                [SERVICE_TYPES.CONSULTATION]: 1.0,
                [SERVICE_TYPES.DIAGNOSTICS]: 1.1,

                default: 1.15
            }
        },

        
        holiday: {
            enabled: true,

            multipliers: {
                [SERVICE_TYPES.TOWING]: 2.0,
                [SERVICE_TYPES.ELECTRICIAN]: 1.5,
                [SERVICE_TYPES.MECHANIC]: 1.5,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.8,
                [SERVICE_TYPES.LOCKSMITH]: 2.0,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.5,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.5,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.3,
                [SERVICE_TYPES.CONSULTATION]: 1.0,
                [SERVICE_TYPES.DIAGNOSTICS]: 1.3,

                default: 1.5
            }
        },

        
        peakHours: {
            enabled: true,
            periods: [
                { start: 7, end: 10, multiplier: 1.2 },   
                { start: 17, end: 20, multiplier: 1.3 }   
            ]
        }
    },

    
    distanceModifiers: {
        
        zones: [
            { from: 0, to: 5, multiplier: 1.0 },          
            { from: 5, to: 10, multiplier: 1.1 },         
            { from: 10, to: 20, multiplier: 1.2 },        
            { from: 20, to: 30, multiplier: 1.3 },        
            { from: 30, to: null, multiplier: 1.5 }       
        ],

        
        outsideCity: {
            enabled: true,
            multiplier: 1.5,
            additionalPerKm: 2000
        }
    },

    
    surge: {
        enabled: true,

        
        sensitivity: {
            [SERVICE_TYPES.TOWING]: 0.8,
            [SERVICE_TYPES.ELECTRICIAN]: 0.6,
            [SERVICE_TYPES.MECHANIC]: 0.5,
            [SERVICE_TYPES.TIRE_SERVICE]: 0.4,
            [SERVICE_TYPES.LOCKSMITH]: 0.7,
            [SERVICE_TYPES.FUEL_DELIVERY]: 0.5,
            [SERVICE_TYPES.BATTERY_CHARGE]: 0.6,
            [SERVICE_TYPES.EURO_PROTOCOL]: 0.3,
            [SERVICE_TYPES.CONSULTATION]: 0.1,
            [SERVICE_TYPES.DIAGNOSTICS]: 0.3,

            default: 0.5
        },

        
        maxMultipliers: {
            [SERVICE_TYPES.TOWING]: 3.0,
            [SERVICE_TYPES.ELECTRICIAN]: 2.5,
            [SERVICE_TYPES.MECHANIC]: 2.0,
            [SERVICE_TYPES.TIRE_SERVICE]: 2.0,
            [SERVICE_TYPES.LOCKSMITH]: 2.5,
            [SERVICE_TYPES.FUEL_DELIVERY]: 2.5,
            [SERVICE_TYPES.BATTERY_CHARGE]: 2.0,
            [SERVICE_TYPES.EURO_PROTOCOL]: 1.5,
            [SERVICE_TYPES.CONSULTATION]: 1.0,     
            [SERVICE_TYPES.DIAGNOSTICS]: 1.5,

            default: 2.0
        }
    },

    
    commission: {
        
        paidBy: {
            platform: 'master',              

            
            exceptions: {
                firstOrder: 'platform',      
                emergency: 'split'           
            }
        },

        
        includeInDisplayPrice: false,

        
        transparency: {
            showCommission: false,           
            showBreakdown: true             
        }
    },

    
    discounts: {
        
        maxTotalDiscount: 0.5,              

        
        priority: [
            'COMPENSATION',
            'FIRST_ORDER',
            'CORPORATE',
            'LOYALTY',
            'PROMOCODE',
            'SEASONAL',
            'VOLUME'
        ],

        
        applyTo: 'base',                    

        
        allowStacking: false
    },

    
    calculationMethods: {
        
        default: 'standard',

        
        methods: {
            standard: {
                
                formula: 'base * timeModifier * distanceModifier * surge - discount'
            },

            fixed: {
                
                formula: 'base'
            },

            hourly: {
                
                formula: '(base + (hours - 1) * perHour) * modifiers'
            },

            distance: {
                
                formula: 'base + (distance * perKm) * modifiers'
            },

            custom: {
                
                formula: 'custom'
            }
        }
    },

    
    rules: {
        
        minOrderAmount: 20000,

        
        maxOrderAmount: 10000000,

        
        maxDistance: 100,                    

        
        maxDuration: 480,                    

        
        prepayment: {
            required: false,

            
            services: {
                [SERVICE_TYPES.TOWING]: {
                    required: true,
                    percent: 0.5             
                }
            },

            
            amounts: [
                { from: 500000, percent: 0.3 },
                { from: 1000000, percent: 0.5 }
            ]
        }
    },

    
    display: {
        
        showRange: true,

        
        rangeFormat: '{min} - {max} {currency}',

        
        showFrom: true,
        fromFormat: 'от {min} {currency}',

        
        showEstimate: true,
        estimateFormat: '≈ {price} {currency}',

        
        showSurge: true,
        surgeFormat: 'x{multiplier}',

        
        surgeColors: {
            none: '#4CAF50',
            low: '#FFC107',
            medium: '#FF9800',
            high: '#FF5722',
            critical: '#F44336'
        }
    },

    
    analytics: {
        
        trackMetrics: true,

        
        metrics: [
            'average_price',
            'surge_frequency',
            'discount_usage',
            'price_elasticity',
            'conversion_by_price'
        ],

        
        collectionInterval: 300000,          

        
        historyRetention: 2592000            
    },

    
    experimental: {
        
        mlPricing: {
            enabled: false,
            model: 'price_optimizer_v1',
            features: [
                'time_of_day',
                'day_of_week',
                'weather',
                'demand_supply_ratio',
                'competitor_prices'
            ]
        },

        
        abTesting: {
            enabled: false,
            experiments: []
        }
    }
};