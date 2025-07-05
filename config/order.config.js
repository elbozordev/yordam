

'use strict';

const { ORDER_STATUS, STATUS_TIMEOUTS } = require('../src/utils/constants/order-status');
const { SERVICE_TYPES } = require('../src/utils/constants/service-types');
const { TIME_WINDOWS } = require('../src/utils/constants/time-constants');
const { LIMITS } = require('../src/utils/constants/validation-rules');

module.exports = {
    
    general: {
        
        numberPrefix: process.env.ORDER_NUMBER_PREFIX || 'Y24',

        
        types: {
            IMMEDIATE: 'immediate',
            SCHEDULED: 'scheduled',
            RECURRING: 'recurring'
        },

        
        sources: {
            MOBILE_APP: 'mobile_app',
            WEB: 'web',
            CALL_CENTER: 'call_center',
            API: 'api'
        },

        
        priorities: {
            LOW: { value: 0, label: 'low' },
            NORMAL: { value: 1, label: 'normal' },
            HIGH: { value: 2, label: 'high' },
            URGENT: { value: 3, label: 'urgent' },
            CRITICAL: { value: 4, label: 'critical' }
        }
    },

    
    timeouts: {
        
        search: {
            initial: parseInt(process.env.ORDER_SEARCH_TIMEOUT) || 300000,      
            extended: parseInt(process.env.ORDER_SEARCH_EXTENDED) || 600000,    
            max: parseInt(process.env.ORDER_SEARCH_MAX) || 900000              
        },

        
        response: {
            default: parseInt(process.env.MASTER_RESPONSE_TIMEOUT) || 30000,    
            busy: 45000,                                                        
            night: 60000                                                        
        },

        
        arrival: {
            city: 1800000,      
            suburb: 2700000,    
            rush: 3600000,      
            max: 5400000        
        },

        
        work: {
            min: 600000,        
            standard: 3600000,  
            complex: 7200000,   
            max: 10800000       
        },

        
        payment: {
            immediate: 300000,  
            deferred: 86400000  
        },

        
        cancellation: {
            free: 120000,       
            penalty: 300000     
        }
    },

    
    limits: {
        
        customer: {
            maxActiveOrders: parseInt(process.env.MAX_ACTIVE_ORDERS_PER_CUSTOMER) || 3,
            maxDailyOrders: parseInt(process.env.MAX_DAILY_ORDERS_PER_CUSTOMER) || 20,
            maxMonthlyOrders: 200,

            
            maxFreeCancellations: 3,        
            cancellationPenaltyRate: 0.1    
        },

        
        master: {
            maxActiveOrders: 3,
            maxDailyOrders: 15,

            
            maxDailyRejections: 5,
            rejectionPenaltyThreshold: 0.3  
        },

        
        scheduling: {
            minAheadTime: 300000,           
            maxAheadTime: 2592000000,       
            maxRecurringPeriod: 7776000000  
        },

        
        search: {
            initialRadius: 3000,             
            radiusStep: 2000,                
            maxRadius: 50000,                
            minCandidates: 3,                
            maxCandidates: 20,               
            maxAttempts: 5                   
        },

        
        media: {
            maxPhotos: 5,
            maxPhotoSize: 5242880,           
            maxVideoSize: 52428800,          
            maxTotalSize: 104857600,         
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
        }
    },

    
    statuses: {
        
        ...ORDER_STATUS,

        
        final: [
            ORDER_STATUS.COMPLETED,
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.FAILED,
            ORDER_STATUS.EXPIRED
        ],

        
        active: [
            ORDER_STATUS.NEW,
            ORDER_STATUS.SEARCHING,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.EN_ROUTE,
            ORDER_STATUS.ARRIVED,
            ORDER_STATUS.IN_PROGRESS
        ],

        
        cancellable: [
            ORDER_STATUS.NEW,
            ORDER_STATUS.SEARCHING,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.EN_ROUTE
        ]
    },

    
    assignment: {
        
        methods: {
            AUTO: 'auto',                    
            MANUAL: 'manual',                
            CUSTOMER_CHOICE: 'customer',     
            PREFERRED: 'preferred'           
        },

        
        algorithm: {
            
            weights: {
                distance: 0.3,               
                rating: 0.25,                
                experience: 0.15,            
                price: 0.15,                 
                availability: 0.1,           
                loyalty: 0.05                
            },

            
            thresholds: {
                minRating: 3.5,              
                maxDistance: 20000,          
                minBatteryLevel: 20,         
                maxActiveOrders: 3           
            },

            
            modifiers: {
                preferredMaster: 1.5,        
                previousMaster: 1.3,         
                lowBattery: 0.8,             
                highLoad: 0.7,               
                recentRejection: 0.5         
            }
        },

        
        notifications: {
            batchSize: 5,                    
            batchDelay: 10000,               
            maxBatches: 4,                   

            
            priority: {
                vipCustomer: true,           
                urgentOrder: true,           
                preferredMaster: true        
            }
        }
    },

    
    pricing: {
        
        commission: {
            base: 0.15,                      

            
            byExecutorType: {
                master: 0.15,                
                sto_employee: 0.10,          
                sto: 0.10,                   
                specialist: 0.12             
            },

            
            discounts: {
                newMaster: 0.5,              
                highVolume: 0.9,             
                vipPartner: 0.8              
            }
        },

        
        minimums: {
            orderAmount: 30000,              
            platformFee: 5000,               
            cancellationFee: 10000           
        },

        
        surcharges: {
            night: 0.3,                      
            weekend: 0.2,                    
            holiday: 0.5,                    
            urgent: 0.3,                     
            distance: 5000                   
        }
    },

    
    feedback: {
        
        rating: {
            scale: { min: 1, max: 5 },
            required: true,                  

            
            categories: [
                'quality',                   
                'speed',                     
                'price',                     
                'communication',             
                'cleanliness'               
            ],

            
            weights: {
                quality: 0.4,
                speed: 0.2,
                price: 0.15,
                communication: 0.15,
                cleanliness: 0.1
            }
        },

        
        timeLimit: 604800000,                
        editWindow: 86400000,                

        
        moderation: {
            enabled: true,
            autoApprove: true,               

            
            triggers: {
                lowRating: 2,                
                keywords: ['обман', 'мошенник', 'украл'],
                complaintsCount: 3           
            }
        }
    },

    
    recurring: {
        
        frequencies: {
            DAILY: { value: 'daily', interval: 86400000 },
            WEEKLY: { value: 'weekly', interval: 604800000 },
            BIWEEKLY: { value: 'biweekly', interval: 1209600000 },
            MONTHLY: { value: 'monthly', interval: 2592000000 }
        },

        
        settings: {
            maxActive: 5,                    
            advanceNotice: 86400000,         
            autoConfirm: false,              

            
            maxSkips: 3,                     
            skipOnHolidays: true,            

            
            cancellationNotice: 172800000    
        }
    },

    
    communication: {
        
        chat: {
            enabled: true,
            maxMessageLength: 1000,
            maxMediaSize: 10485760,          

            
            autoMessages: {
                onAssign: true,              
                onArrival: true,             
                onComplete: true             
            }
        },

        
        calls: {
            enabled: true,
            provider: process.env.CALL_PROVIDER || 'twilio',

            
            masking: {
                enabled: true,
                duration: 86400000           
            },

            
            limits: {
                maxDuration: 600,            
                maxPerOrder: 5               
            }
        }
    },

    
    security: {
        
        fraud: {
            triggers: {
                
                customer: {
                    tooManyOrders: 10,       
                    tooManyCancellations: 5, 
                    unusualLocations: 5,     
                    rapidOrders: 3           
                },

                
                master: {
                    tooManyRejections: 10,   
                    suspiciousRoute: true,   
                    quickCompletion: 300     
                }
            },

            
            actions: {
                flag: true,                  
                notify: true,                
                block: false,                
                requireVerification: true    
            }
        },

        
        verification: {
            
            photoProof: {
                required: ['towing', 'complex_service'],
                beforeWork: true,
                afterWork: true
            },

            
            location: {
                continuous: true,            
                accuracy: 50,                
                spoofingCheck: true          
            }
        }
    },

    
    analytics: {
        
        track: {
            searchTime: true,
            responseTime: true,
            arrivalTime: true,
            completionTime: true,
            cancellationRate: true,
            customerSatisfaction: true,
            masterUtilization: true
        },

        
        sla: {
            searchTime: 180,                 
            responseTime: 30,                
            arrivalTime: 1800,               
            completionRate: 0.95,            
            satisfactionScore: 4.5           
        },

        
        alerts: {
            slaViolation: true,
            highCancellation: true,
            lowSatisfaction: true,
            fraudDetection: true
        }
    },

    
    integrations: {
        
        maps: {
            provider: process.env.MAPS_PROVIDER || 'google',

            
            routing: {
                mode: 'driving',
                avoidTolls: false,
                avoidHighways: false,
                optimizeWaypoints: true
            },

            
            eta: {
                updateInterval: 30000,       
                significantChange: 120       
            }
        },

        
        payments: {
            providers: {
                payme: { enabled: true, priority: 1 },
                click: { enabled: true, priority: 2 },
                uzcard: { enabled: true, priority: 3 }
            },

            
            auto: {
                chargeOnComplete: false,     
                refundOnCancel: true,        
                holdAmount: true             
            }
        }
    },

    
    cache: {
        
        ttl: {
            orderDetails: 300,               
            customerOrders: 60,              
            masterOrders: 60,                
            searchResults: 30,               
            pricing: 600                     
        },

        
        keys: {
            order: 'order:',
            search: 'order:search:',
            pricing: 'order:price:',
            tracking: 'order:track:'
        }
    },

    
    queues: {
        
        names: {
            search: 'order.search',
            assignment: 'order.assignment',
            notification: 'order.notification',
            tracking: 'order.tracking',
            completion: 'order.completion',
            analytics: 'order.analytics'
        },

        
        processing: {
            search: {
                concurrency: 10,
                timeout: 30000,
                retries: 3
            },
            assignment: {
                concurrency: 20,
                timeout: 10000,
                retries: 2
            },
            tracking: {
                concurrency: 50,
                timeout: 5000,
                retries: 1
            }
        }
    }
};