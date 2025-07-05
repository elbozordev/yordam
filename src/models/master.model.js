

'use strict';

const { ObjectId } = require('mongodb');
const { SERVICE_TYPES } = require('../utils/constants/service-types');


const MASTER_STATUS = {
    PENDING_VERIFICATION: 'pending_verification', 
    VERIFIED: 'verified',                  
    ACTIVE: 'active',                      
    INACTIVE: 'inactive',                  
    SUSPENDED: 'suspended',                
    BLOCKED: 'blocked',                    
    REJECTED: 'rejected',                  
    DELETED: 'deleted'                     
};


const MASTER_TYPES = {
    INDEPENDENT: 'independent',            
    STO_EMPLOYEE: 'sto_employee',          
    STO_PARTNER: 'sto_partner',            
    FREELANCER: 'freelancer',              
    SPECIALIST: 'specialist'               
};


const SKILL_LEVELS = {
    BEGINNER: 'beginner',                  
    JUNIOR: 'junior',                      
    MIDDLE: 'middle',                      
    SENIOR: 'senior',                      
    EXPERT: 'expert'                       
};


const ONLINE_STATUS = {
    ONLINE: 'online',                      
    BUSY: 'busy',                          
    BREAK: 'break',                        
    OFFLINE: 'offline'                     
};


const masterSchema = {
    _id: ObjectId,

    
    userId: ObjectId,                      

    
    type: String,                          
    status: String,                        
    onlineStatus: String,                  

    
    personal: {
        firstName: String,
        lastName: String,
        middleName: String,
        phone: String,
        email: String,

        birthDate: Date,
        gender: String,

        
        avatar: {
            url: String,
            thumbnailUrl: String,
            verifiedAt: Date
        },

        
        languages: [{
            code: String,                  
            level: String                  
        }]
    },

    
    professional: {
        
        experienceYears: Number,           
        experienceStartDate: Date,         

        
        skillLevel: String,                

        
        specializations: [{
            serviceType: String,           
            level: String,                 
            experienceYears: Number,

            
            verified: Boolean,
            verifiedBy: ObjectId,
            verifiedAt: Date,

            
            certificates: [{
                name: String,
                issuer: String,
                issueDate: Date,
                expiryDate: Date,
                fileUrl: String
            }]
        }],

        
        additionalSkills: [String],        

        
        education: [{
            type: String,                  
            institution: String,
            speciality: String,
            degree: String,
            startYear: Number,
            endYear: Number,
            diploma: {
                number: String,
                fileUrl: String,
                verified: Boolean
            }
        }],

        
        workHistory: [{
            company: String,
            position: String,
            startDate: Date,
            endDate: Date,
            description: String,

            
            reference: {
                name: String,
                position: String,
                phone: String,
                verified: Boolean
            }
        }]
    },

    
    documents: {
        
        identity: {
            type: String,                  
            series: String,
            number: String,
            issuedBy: String,
            issuedDate: Date,
            expiryDate: Date,

            files: {
                front: String,             
                back: String,
                selfie: String            
            },

            verified: Boolean,
            verifiedAt: Date,
            verifiedBy: ObjectId
        },

        
        tin: {
            number: String,
            fileUrl: String,
            verified: Boolean
        },

        
        driverLicense: {
            number: String,
            categories: [String],          
            issuedDate: Date,
            expiryDate: Date,
            fileUrl: String,
            verified: Boolean
        },

        
        medicalBook: {
            number: String,
            issuedDate: Date,
            expiryDate: Date,
            fileUrl: String,
            verified: Boolean
        },

        
        criminalRecord: {
            checkedAt: Date,
            clearance: Boolean,
            fileUrl: String,
            expiryDate: Date
        },

        
        insurance: {
            type: String,                  
            policyNumber: String,
            company: String,
            coverage: Number,
            expiryDate: Date,
            fileUrl: String
        }
    },

    
    equipment: {
        
        vehicle: {
            hasVehicle: Boolean,
            type: String,                  
            brand: String,
            model: String,
            year: Number,
            plateNumber: String,
            color: String,

            photos: [{
                url: String,
                type: String               
            }],

            
            inspection: {
                passedAt: Date,
                expiryDate: Date,
                fileUrl: String
            },

            
            insurance: {
                type: String,              
                expiryDate: Date,
                fileUrl: String
            }
        },

        
        tools: [{
            category: String,              
            name: String,
            brand: String,
            model: String,

            condition: String,             
            purchaseDate: Date,

            
            certification: {
                required: Boolean,
                certified: Boolean,
                certNumber: String,
                expiryDate: Date
            },

            photos: [String]
        }],

        
        specialEquipment: [{
            type: String,                  
            description: String,
            available: Boolean,

            specifications: Object,        

            rental: {
                isRental: Boolean,
                provider: String,
                dailyCost: Number
            }
        }]
    },

    
    work: {
        
        schedule: {
            type: String,                  

            
            regular: [{
                dayOfWeek: Number,         
                periods: [{
                    startTime: String,     
                    endTime: String,       
                    type: String           
                }],
                enabled: Boolean
            }],

            
            emergency: {
                available: Boolean,
                nightWork: Boolean,        
                holidayWork: Boolean,      

                responseTime: Number       
            },

            
            vacations: [{
                startDate: Date,
                endDate: Date,
                reason: String,
                approved: Boolean
            }]
        },

        
        serviceAreas: [{
            name: String,

            
            primary: {
                type: { type: String },    
                coordinates: [],           
                radius: Number             
            },

            
            extended: {
                type: { type: String },
                coordinates: [],
                radius: Number,
                surcharge: Number          
            },

            
            excluded: [{
                type: { type: String },
                coordinates: [],
                reason: String
            }],

            isActive: Boolean,
            priority: Number
        }],

        
        baseLocation: {
            address: String,
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },

            
            mobility: {
                maxDistance: Number,       
                preferredDistance: Number, 

                
                travelCost: {
                    included: Number,      
                    perKm: Number         
                }
            }
        },

        
        orderPreferences: {
            
            preferredServices: [String],
            excludedServices: [String],

            
            minOrderAmount: Number,
            preferredOrderAmount: Number,

            
            preferredBrands: [String],
            excludedBrands: [String],

            
            corporateOnly: Boolean,
            regularCustomersOnly: Boolean,

            
            autoAccept: {
                enabled: Boolean,
                services: [String],
                radius: Number,
                minAmount: Number
            }
        },

        
        capacity: {
            maxOrdersPerDay: Number,
            maxActiveOrders: Number,       

            currentLoad: {
                activeOrders: Number,
                todayOrders: Number,

                
                busySlots: [{
                    startTime: Date,
                    endTime: Date,
                    orderId: ObjectId
                }]
            }
        }
    },

    
    finance: {
        
        rates: {
            platformCommission: Number,    

            
            specialRates: [{
                serviceType: String,
                commission: Number,
                validUntil: Date
            }],

            
            bonuses: {
                completionBonus: Number,   
                ratingBonus: Number,       
                rushHourBonus: Number,     
                weekendBonus: Number       
            }
        },

        
        servicePrices: [{
            serviceType: String,

            basePrice: Number,
            minPrice: Number,

            
            surcharges: {
                night: Number,             
                weekend: Number,
                holiday: Number,
                urgency: Number
            },

            
            loyaltyDiscount: Number
        }],

        
        paymentDetails: {
            
            withdrawal: {
                method: String,            

                card: {
                    number: String,
                    holder: String,
                    bank: String
                },

                bankAccount: {
                    account: String,
                    bank: String,
                    mfo: String,
                    inn: String
                },

                wallet: {
                    provider: String,      
                    account: String
                }
            },

            
            tax: {
                payer: Boolean,
                rate: Number,
                number: String
            }
        },

        
        stats: {
            totalEarned: Number,
            currentBalance: Number,
            pendingPayments: Number,

            thisMonth: {
                earned: Number,
                orders: Number,
                commission: Number,
                bonuses: Number,
                penalties: Number
            },

            lastMonth: {
                earned: Number,
                orders: Number,
                commission: Number
            },

            
            withdrawalHistory: [{
                amount: Number,
                method: String,
                requestedAt: Date,
                processedAt: Date,
                status: String,
                reference: String
            }]
        }
    },

    
    rating: {
        
        overall: {
            score: Number,                 
            count: Number,

            distribution: {
                5: Number,
                4: Number,
                3: Number,
                2: Number,
                1: Number
            }
        },

        
        categories: {
            quality: Number,               
            speed: Number,                 
            communication: Number,         
            price: Number,                 
            cleanliness: Number            
        },

        
        byService: [{
            serviceType: String,
            avgRating: Number,
            count: Number
        }],

        
        recentReviews: [{
            orderId: ObjectId,
            rating: Number,
            comment: String,
            categories: Object,
            customerId: ObjectId,
            customerName: String,
            createdAt: Date,

            
            response: {
                comment: String,
                createdAt: Date
            }
        }],

        
        achievements: [{
            type: String,                  
            title: String,
            description: String,
            earnedAt: Date,
            expiresAt: Date,

            badge: {
                icon: String,
                color: String
            }
        }],

        
        reliability: {
            score: Number,                 

            factors: {
                completionRate: Number,    
                onTimeRate: Number,        
                responseRate: Number,      
                cancellationRate: Number,  

                
                weights: {
                    completion: 0.4,
                    onTime: 0.3,
                    response: 0.2,
                    cancellation: 0.1
                }
            },

            
            penalties: [{
                reason: String,
                points: Number,
                date: Date,
                expiresAt: Date
            }]
        }
    },

    
    statistics: {
        
        lifetime: {
            totalOrders: Number,
            completedOrders: Number,
            cancelledOrders: Number,

            totalEarnings: Number,
            totalDistance: Number,         
            totalHours: Number,

            joinedAt: Date,
            firstOrderAt: Date,
            lastOrderAt: Date
        },

        
        current: {
            
            today: {
                orders: Number,
                earnings: Number,
                distance: Number,
                onlineHours: Number
            },

            
            thisWeek: {
                orders: Number,
                earnings: Number,
                onlineHours: Number,
                avgResponseTime: Number
            },

            
            thisMonth: {
                orders: Number,
                earnings: Number,
                completionRate: Number,
                avgRating: Number
            }
        },

        
        performance: {
            avgOrdersPerDay: Number,
            avgEarningsPerOrder: Number,
            avgCompletionTime: Number,     
            avgResponseTime: Number,       

            
            bestDay: {
                date: Date,
                orders: Number,
                earnings: Number
            },

            bestMonth: {
                month: String,
                orders: Number,
                earnings: Number
            }
        },

        
        byService: [{
            serviceType: String,
            count: Number,
            totalEarnings: Number,
            avgTime: Number,
            avgRating: Number
        }],

        
        customers: {
            total: Number,
            regular: Number,               

            favorites: [{                  
                customerId: ObjectId,
                name: String,
                ordersCount: Number,
                totalSpent: Number
            }]
        },

        
        trends: {
            monthlyOrders: [{
                month: String,             
                orders: Number,
                earnings: Number,
                avgRating: Number
            }],

            weeklyPattern: [Number],       
            hourlyPattern: [Number]        
        }
    },

    
    relationships: {
        
        sto: {
            current: {
                stoId: ObjectId,
                type: String,              
                position: String,
                joinedAt: Date,

                terms: {
                    commission: Number,
                    fixedSalary: Number,
                    benefits: [String]
                }
            },

            history: [{
                stoId: ObjectId,
                name: String,
                startDate: Date,
                endDate: Date,
                reason: String             
            }]
        },

        
        team: {
            isLeader: Boolean,

            members: [{
                masterId: ObjectId,
                name: String,
                role: String,              
                specialization: String
            }],

            
            revenueSharing: {
                type: String,              
                rules: Object
            }
        },

        
        mentorship: {
            
            mentees: [{
                masterId: ObjectId,
                name: String,
                startDate: Date,
                status: String
            }],

            
            mentor: {
                masterId: ObjectId,
                name: String,
                startDate: Date
            }
        }
    },

    
    preferences: {
        
        notifications: {
            push: {
                newOrders: Boolean,
                orderUpdates: Boolean,
                payments: Boolean,
                news: Boolean,
                marketing: Boolean
            },

            sms: {
                newOrders: Boolean,
                urgentOnly: Boolean
            },

            email: {
                reports: Boolean,
                news: Boolean
            },

            
            sound: {
                enabled: Boolean,
                volume: Number,
                customSound: String
            }
        },

        
        interface: {
            language: String,              
            theme: String,                 
            mapStyle: String,              

            
            dashboard: {
                widgets: [String],         
                layout: String            
            }
        },

        
        privacy: {
            showFullName: Boolean,
            showPhone: Boolean,
            showPhoto: Boolean,

            
            shareLocation: String,         
            allowDirectContact: Boolean
        },

        
        automation: {
            
            autoResponses: [{
                trigger: String,           
                message: String,
                enabled: Boolean
            }],

            
            autoStatus: {
                goOfflineAfter: Number,    
                breakAfterOrders: Number,  
                breakDuration: Number      
            }
        }
    },

    
    development: {
        
        courses: [{
            name: String,
            provider: String,
            completedAt: Date,
            certificate: {
                number: String,
                fileUrl: String
            },

            
            score: Number,
            passed: Boolean
        }],

        
        skillsToImprove: [{
            skill: String,
            currentLevel: String,
            targetLevel: String,
            progress: Number               
        }],

        
        developmentPlan: {
            goals: [{
                title: String,
                description: String,
                deadline: Date,
                completed: Boolean
            }],

            nextReview: Date
        }
    },

    
    security: {
        
        backgroundCheck: {
            completed: Boolean,
            date: Date,
            result: String,                
            expiresAt: Date
        },

        
        incidents: [{
            type: String,                  
            date: Date,
            description: String,
            severity: String,              
            resolved: Boolean,

            outcome: {
                action: String,            
                description: String
            }
        }],

        
        suspensions: [{
            reason: String,
            startDate: Date,
            endDate: Date,
            permanent: Boolean,

            conditions: String             
        }],

        
        trustScore: Number,                

        
        emergencyContacts: [{
            name: String,
            relation: String,
            phone: String,
            verified: Boolean
        }]
    },

    
    quality: {
        
        metrics: {
            
            diagnosticAccuracy: Number,    

            
            repairQuality: {
                firstTimeFixRate: Number,  
                comebackRate: Number,      
                warrantyClaimRate: Number  
            },

            
            professionalism: {
                appearanceScore: Number,
                communicationScore: Number,
                timelinessScore: Number
            }
        },

        
        qualityChecks: [{
            date: Date,
            type: String,                  
            inspector: ObjectId,

            results: {
                score: Number,
                issues: [String],
                recommendations: [String]
            },

            followUp: {
                required: Boolean,
                completedAt: Date
            }
        }],

        
        stoFeedback: [{
            stoId: ObjectId,
            date: Date,
            rating: Number,
            comment: String,
            areas: {
                technical: Number,
                communication: Number,
                reliability: Number
            }
        }]
    },

    
    currentState: {
        
        location: {
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },

            accuracy: Number,
            heading: Number,               
            speed: Number,                 

            updatedAt: Date,
            source: String                 
        },

        
        activeOrder: {
            orderId: ObjectId,
            status: String,
            startedAt: Date,

            customer: {
                name: String,
                phone: String,
                location: Object
            }
        },

        
        orderQueue: [{
            orderId: ObjectId,
            scheduledTime: Date,
            estimatedDuration: Number
        }],

        
        shift: {
            startedAt: Date,
            scheduledEndAt: Date,

            breaks: [{
                startedAt: Date,
                endedAt: Date,
                type: String               
            }],

            summary: {
                ordersCompleted: Number,
                earnings: Number,
                distance: Number,
                onlineHours: Number
            }
        }
    },

    
    gamification: {
        
        level: {
            current: Number,
            experience: Number,
            nextLevelExp: Number,
            title: String                  
        },

        
        achievements: [{
            id: String,
            name: String,
            description: String,
            icon: String,

            progress: {
                current: Number,
                target: Number,
                completed: Boolean
            },

            reward: {
                type: String,              
                value: Number
            },

            unlockedAt: Date
        }],

        
        quests: [{
            id: String,
            type: String,                  
            title: String,
            description: String,

            requirements: [{
                type: String,              
                target: Number,
                current: Number
            }],

            reward: {
                exp: Number,
                bonus: Number
            },

            expiresAt: Date
        }],

        
        leaderboard: {
            overall: {
                rank: Number,
                totalMasters: Number,
                percentile: Number         
            },

            byCategory: [{
                category: String,          
                rank: Number,
                value: Number
            }],

            
            stoRank: {
                rank: Number,
                totalInSto: Number
            }
        },

        
        rewards: {
            points: Number,                

            available: [{
                id: String,
                name: String,
                cost: Number,
                type: String               
            }],

            redeemed: [{
                rewardId: String,
                name: String,
                redeemedAt: Date,
                usedAt: Date
            }]
        }
    },

    
    integrations: {
        
        messengers: {
            telegram: {
                chatId: String,
                username: String,
                verified: Boolean,
                notifications: Boolean
            },

            whatsapp: {
                number: String,
                verified: Boolean
            }
        },

        
        external: {
            
            tracking: {
                provider: String,          
                enabled: Boolean,
                shareLink: String
            },

            
            calendar: {
                provider: String,          
                syncEnabled: Boolean,
                calendarId: String
            }
        }
    },

    
    audit: {
        
        recentActions: [{
            action: String,
            details: Object,
            ip: String,
            userAgent: String,
            timestamp: Date
        }],

        
        changelog: [{
            field: String,
            oldValue: Object,
            newValue: Object,
            changedBy: ObjectId,
            changedAt: Date,
            reason: String
        }]
    },

    
    metadata: {
        source: String,                    
        referrer: {
            type: String,                  
            id: ObjectId,
            campaign: String
        },

        tags: [String],                    
        flags: [String],                   

        customFields: Object,              
        notes: String                      
    },

    
    createdAt: Date,
    updatedAt: Date,

    verifiedAt: Date,
    lastActiveAt: Date,
    deletedAt: Date                        
};


class MasterModel {
    constructor(db) {
        this.collection = db.collection('masters');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex(
                { userId: 1 },
                {
                    unique: true,
                    partialFilterExpression: {
                        status: { $ne: MASTER_STATUS.DELETED }
                    }
                }
            );

            
            await this.collection.createIndex({
                status: 1,
                onlineStatus: 1,
                'currentState.location.coordinates': '2dsphere'
            });

            await this.collection.createIndex({
                'professional.specializations.serviceType': 1,
                status: 1,
                onlineStatus: 1
            });

            
            await this.collection.createIndex({ 'currentState.location.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'work.baseLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'work.serviceAreas.primary': '2dsphere' });
            await this.collection.createIndex({ 'work.serviceAreas.extended': '2dsphere' });

            
            await this.collection.createIndex({ 'rating.overall.score': -1 });
            await this.collection.createIndex({ 'rating.reliability.score': -1 });
            await this.collection.createIndex({ 'statistics.lifetime.totalOrders': -1 });
            await this.collection.createIndex({ 'statistics.current.thisMonth.earnings': -1 });

            
            await this.collection.createIndex({ 'relationships.sto.current.stoId': 1 });
            await this.collection.createIndex({ 'relationships.team.members.masterId': 1 });

            
            await this.collection.createIndex({
                'personal.firstName': 'text',
                'personal.lastName': 'text',
                'professional.specializations.serviceType': 'text',
                'professional.additionalSkills': 'text'
            });

            
            await this.collection.createIndex({ 'finance.stats.currentBalance': -1 });

            
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 2592000 } 
            );

        } catch (error) {
            console.error('Error creating master indexes:', error);
        }
    }

    
    async create(masterData) {
        const now = new Date();

        const master = {
            _id: new ObjectId(),
            ...masterData,

            
            status: masterData.status || MASTER_STATUS.PENDING_VERIFICATION,
            onlineStatus: ONLINE_STATUS.OFFLINE,

            rating: {
                overall: {
                    score: 0,
                    count: 0,
                    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                },
                categories: {
                    quality: 0,
                    speed: 0,
                    communication: 0,
                    price: 0,
                    cleanliness: 0
                },
                byService: [],
                recentReviews: [],
                achievements: [],
                reliability: {
                    score: 100,
                    factors: {
                        completionRate: 100,
                        onTimeRate: 100,
                        responseRate: 100,
                        cancellationRate: 0
                    },
                    penalties: []
                },
                ...masterData.rating
            },

            statistics: {
                lifetime: {
                    totalOrders: 0,
                    completedOrders: 0,
                    cancelledOrders: 0,
                    totalEarnings: 0,
                    totalDistance: 0,
                    totalHours: 0,
                    joinedAt: now
                },
                current: {
                    today: {
                        orders: 0,
                        earnings: 0,
                        distance: 0,
                        onlineHours: 0
                    },
                    thisWeek: {
                        orders: 0,
                        earnings: 0,
                        onlineHours: 0,
                        avgResponseTime: 0
                    },
                    thisMonth: {
                        orders: 0,
                        earnings: 0,
                        completionRate: 100,
                        avgRating: 0
                    }
                },
                performance: {
                    avgOrdersPerDay: 0,
                    avgEarningsPerOrder: 0,
                    avgCompletionTime: 0,
                    avgResponseTime: 0
                },
                byService: [],
                customers: {
                    total: 0,
                    regular: 0,
                    favorites: []
                },
                trends: {
                    monthlyOrders: [],
                    weeklyPattern: new Array(7).fill(0),
                    hourlyPattern: new Array(24).fill(0)
                },
                ...masterData.statistics
            },

            finance: {
                stats: {
                    totalEarned: 0,
                    currentBalance: 0,
                    pendingPayments: 0,
                    thisMonth: {
                        earned: 0,
                        orders: 0,
                        commission: 0,
                        bonuses: 0,
                        penalties: 0
                    },
                    lastMonth: {
                        earned: 0,
                        orders: 0,
                        commission: 0
                    },
                    withdrawalHistory: []
                },
                ...masterData.finance
            },

            work: {
                capacity: {
                    currentLoad: {
                        activeOrders: 0,
                        todayOrders: 0,
                        busySlots: []
                    }
                },
                ...masterData.work
            },

            gamification: {
                level: {
                    current: 1,
                    experience: 0,
                    nextLevelExp: 100,
                    title: 'Новичок'
                },
                achievements: [],
                quests: [],
                leaderboard: {
                    overall: {
                        rank: 0,
                        totalMasters: 0,
                        percentile: 0
                    },
                    byCategory: []
                },
                rewards: {
                    points: 0,
                    available: [],
                    redeemed: []
                },
                ...masterData.gamification
            },

            currentState: {
                shift: {
                    breaks: [],
                    summary: {
                        ordersCompleted: 0,
                        earnings: 0,
                        distance: 0,
                        onlineHours: 0
                    }
                },
                orderQueue: [],
                ...masterData.currentState
            },

            quality: {
                metrics: {
                    diagnosticAccuracy: 100,
                    repairQuality: {
                        firstTimeFixRate: 100,
                        comebackRate: 0,
                        warrantyClaimRate: 0
                    },
                    professionalism: {
                        appearanceScore: 100,
                        communicationScore: 100,
                        timelinessScore: 100
                    }
                },
                qualityChecks: [],
                stoFeedback: [],
                ...masterData.quality
            },

            security: {
                trustScore: 100,
                incidents: [],
                suspensions: [],
                ...masterData.security
            },

            audit: {
                recentActions: [],
                changelog: []
            },

            createdAt: now,
            updatedAt: now
        };

        const result = await this.collection.insertOne(master);
        return { ...master, _id: result.insertedId };
    }

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: MASTER_STATUS.DELETED }
        });
    }

    
    async findByUserId(userId) {
        return await this.collection.findOne({
            userId: new ObjectId(userId),
            status: { $ne: MASTER_STATUS.DELETED }
        });
    }

    
    async findActive(filters = {}) {
        const query = {
            status: MASTER_STATUS.ACTIVE,
            onlineStatus: { $in: [ONLINE_STATUS.ONLINE, ONLINE_STATUS.BUSY] },
            ...filters
        };

        return await this.collection.find(query).toArray();
    }

    
    async findNearby(location, radius = 5000, filters = {}) {
        const query = {
            status: MASTER_STATUS.ACTIVE,
            onlineStatus: ONLINE_STATUS.ONLINE,
            'currentState.location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: radius
                }
            },
            ...filters
        };

        return await this.collection.find(query).toArray();
    }

    
    async findByService(serviceType, location = null, options = {}) {
        const {
            radius = 10000,
            minRating = 0,
            maxPrice = null,
            onlineOnly = true
        } = options;

        const query = {
            status: MASTER_STATUS.ACTIVE,
            'professional.specializations.serviceType': serviceType
        };

        if (onlineOnly) {
            query.onlineStatus = ONLINE_STATUS.ONLINE;
        }

        if (minRating > 0) {
            query['rating.overall.score'] = { $gte: minRating };
        }

        if (maxPrice) {
            query['finance.servicePrices'] = {
                $elemMatch: {
                    serviceType: serviceType,
                    basePrice: { $lte: maxPrice }
                }
            };
        }

        if (location) {
            
            return await this.collection.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [location.lng, location.lat]
                        },
                        distanceField: 'distance',
                        query: query,
                        spherical: true,
                        maxDistance: radius
                    }
                },
                {
                    $addFields: {
                        
                        matchScore: {
                            $add: [
                                { $multiply: ['$rating.overall.score', 1000] },
                                { $multiply: ['$rating.reliability.score', 10] },
                                { $divide: [1, { $add: ['$distance', 1] }] }
                            ]
                        }
                    }
                },
                { $sort: { matchScore: -1 } },
                { $limit: 20 }
            ]).toArray();
        }

        return await this.collection
            .find(query)
            .sort({ 'rating.overall.score': -1 })
            .limit(20)
            .toArray();
    }

    
    async update(id, updateData) {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    
    async updateOnlineStatus(masterId, status) {
        const updateData = {
            onlineStatus: status,
            lastActiveAt: new Date()
        };

        
        if (status === ONLINE_STATUS.ONLINE) {
            updateData['currentState.shift.startedAt'] = new Date();
        }

        
        if (status === ONLINE_STATUS.OFFLINE) {
            const master = await this.findById(masterId);
            if (master?.currentState?.shift?.startedAt) {
                const shiftDuration = Date.now() - master.currentState.shift.startedAt.getTime();
                updateData['$inc'] = {
                    'statistics.current.today.onlineHours': shiftDuration / 3600000
                };
            }
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: updateData,
                ...updateData.$inc && { $inc: updateData.$inc }
            },
            { returnDocument: 'after' }
        );
    }

    
    async updateLocation(masterId, locationData) {
        const location = {
            coordinates: {
                type: 'Point',
                coordinates: [locationData.lng, locationData.lat]
            },
            accuracy: locationData.accuracy,
            heading: locationData.heading,
            speed: locationData.speed,
            updatedAt: new Date(),
            source: locationData.source || 'gps'
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.location': location,
                    lastActiveAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async updateOrderStatistics(masterId, orderData) {
        const {
            status,
            totalAmount,
            commission,
            distance,
            duration,
            serviceType,
            rating,
            customerId
        } = orderData;

        const updateQuery = {
            $inc: {
                'statistics.lifetime.totalOrders': 1,
                'statistics.current.today.orders': 1,
                'statistics.current.thisWeek.orders': 1,
                'statistics.current.thisMonth.orders': 1
            }
        };

        if (status === 'completed') {
            const earnings = totalAmount - commission;

            updateQuery.$inc['statistics.lifetime.completedOrders'] = 1;
            updateQuery.$inc['statistics.lifetime.totalEarnings'] = earnings;
            updateQuery.$inc['statistics.current.today.earnings'] = earnings;
            updateQuery.$inc['statistics.current.thisWeek.earnings'] = earnings;
            updateQuery.$inc['statistics.current.thisMonth.earnings'] = earnings;
            updateQuery.$inc['finance.stats.totalEarned'] = earnings;
            updateQuery.$inc['finance.stats.thisMonth.earned'] = earnings;
            updateQuery.$inc['finance.stats.thisMonth.orders'] = 1;
            updateQuery.$inc['finance.stats.thisMonth.commission'] = commission;

            if (distance) {
                updateQuery.$inc['statistics.lifetime.totalDistance'] = distance;
                updateQuery.$inc['statistics.current.today.distance'] = distance;
            }

            if (duration) {
                updateQuery.$inc['statistics.lifetime.totalHours'] = duration / 3600;
            }

            
            updateQuery.$push = {
                'statistics.byService': {
                    $each: [{
                        serviceType,
                        count: 1,
                        totalEarnings: earnings,
                        avgTime: duration,
                        avgRating: rating || 0
                    }],
                    $slice: -50
                }
            };

        } else if (status === 'cancelled') {
            updateQuery.$inc['statistics.lifetime.cancelledOrders'] = 1;
        }

        
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();

        updateQuery.$inc[`statistics.trends.hourlyPattern.${hour}`] = 1;
        updateQuery.$inc[`statistics.trends.weeklyPattern.${dayOfWeek}`] = 1;

        updateQuery.$set = {
            'statistics.lifetime.lastOrderAt': new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );

        
        if (result && status === 'completed') {
            await this.recalculateAverages(masterId);
        }

        return result;
    }

    
    async recalculateAverages(masterId) {
        const master = await this.findById(masterId);
        if (!master) return;

        const stats = master.statistics.lifetime;
        const updateQuery = { $set: {} };

        if (stats.totalOrders > 0) {
            updateQuery.$set['statistics.performance.avgEarningsPerOrder'] =
                stats.totalEarnings / stats.completedOrders;

            updateQuery.$set['statistics.current.thisMonth.completionRate'] =
                (stats.completedOrders / stats.totalOrders) * 100;
        }

        
        const daysSinceJoined = Math.max(1,
            (Date.now() - stats.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        updateQuery.$set['statistics.performance.avgOrdersPerDay'] =
            stats.totalOrders / daysSinceJoined;

        
        const reliability = this.calculateReliabilityScore(master);
        updateQuery.$set['rating.reliability.score'] = reliability.score;
        updateQuery.$set['rating.reliability.factors'] = reliability.factors;

        await this.collection.updateOne(
            { _id: new ObjectId(masterId) },
            updateQuery
        );
    }

    
    calculateReliabilityScore(master) {
        const stats = master.statistics.lifetime;
        const factors = master.rating.reliability.factors;
        const weights = factors.weights;

        
        const completionRate = stats.totalOrders > 0
            ? (stats.completedOrders / stats.totalOrders) * 100
            : 100;

        const cancellationRate = stats.totalOrders > 0
            ? (stats.cancelledOrders / stats.totalOrders) * 100
            : 0;

        
        const onTimeRate = factors.onTimeRate || 100;
        const responseRate = factors.responseRate || 100;

        
        const score =
            (completionRate * weights.completion) +
            (onTimeRate * weights.onTime) +
            (responseRate * weights.response) +
            ((100 - cancellationRate) * weights.cancellation);

        
        const activePenalties = master.rating.reliability.penalties
            .filter(p => !p.expiresAt || p.expiresAt > new Date())
            .reduce((sum, p) => sum + p.points, 0);

        return {
            score: Math.max(0, Math.min(100, score - activePenalties)),
            factors: {
                completionRate,
                onTimeRate,
                responseRate,
                cancellationRate,
                weights
            }
        };
    }

    
    async updateRating(masterId, ratingData) {
        const {
            orderId,
            rating,
            comment,
            categories,
            customerId,
            customerName,
            serviceType
        } = ratingData;

        const master = await this.findById(masterId);
        if (!master) return null;

        const updateQuery = {
            $inc: {
                [`rating.overall.distribution.${rating}`]: 1,
                'rating.overall.count': 1
            },
            $push: {
                'rating.recentReviews': {
                    $each: [{
                        orderId,
                        rating,
                        comment,
                        categories,
                        customerId,
                        customerName,
                        createdAt: new Date()
                    }],
                    $slice: -20 
                }
            }
        };

        
        const distribution = master.rating.overall.distribution;
        distribution[rating] = (distribution[rating] || 0) + 1;

        let totalScore = 0;
        let totalCount = 0;

        Object.entries(distribution).forEach(([score, count]) => {
            totalScore += parseInt(score) * count;
            totalCount += count;
        });

        updateQuery.$set = {
            'rating.overall.score': totalCount > 0 ? totalScore / totalCount : 0,
            'statistics.current.thisMonth.avgRating': totalCount > 0 ? totalScore / totalCount : 0
        };

        
        if (categories) {
            Object.entries(categories).forEach(([category, score]) => {
                if (master.rating.categories[category] !== undefined) {
                    const current = master.rating.categories[category];
                    const count = master.rating.overall.count;
                    const newAvg = (current * count + score) / (count + 1);
                    updateQuery.$set[`rating.categories.${category}`] = newAvg;
                }
            });
        }

        
        const serviceRatingIndex = master.rating.byService
            .findIndex(s => s.serviceType === serviceType);

        if (serviceRatingIndex >= 0) {
            const serviceRating = master.rating.byService[serviceRatingIndex];
            const newAvg = (serviceRating.avgRating * serviceRating.count + rating) /
                (serviceRating.count + 1);

            updateQuery.$set[`rating.byService.${serviceRatingIndex}.avgRating`] = newAvg;
            updateQuery.$inc[`rating.byService.${serviceRatingIndex}.count`] = 1;
        } else {
            updateQuery.$push['rating.byService'] = {
                serviceType,
                avgRating: rating,
                count: 1
            };
        }

        updateQuery.$set.updatedAt = new Date();

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    
    async addAchievement(masterId, achievement) {
        const newAchievement = {
            ...achievement,
            earnedAt: new Date()
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $push: { 'rating.achievements': newAchievement },
                $inc: { 'gamification.level.experience': achievement.expReward || 0 },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    }

    
    async updateFinance(masterId, transaction) {
        const updateQuery = {
            $inc: {},
            $set: { updatedAt: new Date() }
        };

        switch (transaction.type) {
            case 'earning':
                updateQuery.$inc['finance.stats.currentBalance'] = transaction.amount;
                updateQuery.$inc['finance.stats.pendingPayments'] = -transaction.amount;
                break;

            case 'withdrawal':
                updateQuery.$inc['finance.stats.currentBalance'] = -transaction.amount;
                updateQuery.$push = {
                    'finance.stats.withdrawalHistory': {
                        $each: [{
                            ...transaction,
                            requestedAt: new Date(),
                            status: 'pending'
                        }],
                        $slice: -50
                    }
                };
                break;

            case 'bonus':
                updateQuery.$inc['finance.stats.currentBalance'] = transaction.amount;
                updateQuery.$inc['finance.stats.thisMonth.bonuses'] = transaction.amount;
                break;

            case 'penalty':
                updateQuery.$inc['finance.stats.currentBalance'] = -transaction.amount;
                updateQuery.$inc['finance.stats.thisMonth.penalties'] = transaction.amount;
                break;
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    
    async verify(masterId, verificationData) {
        const verification = {
            status: MASTER_STATUS.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: verificationData.verifiedBy,

            documents: verificationData.documents,

            'security.backgroundCheck': {
                completed: true,
                date: new Date(),
                result: 'passed',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
            }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    ...verification,
                    status: MASTER_STATUS.ACTIVE,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async addIncident(masterId, incident) {
        const newIncident = {
            ...incident,
            date: new Date(),
            resolved: false
        };

        
        const penaltyPoints = {
            low: 5,
            medium: 10,
            high: 20,
            critical: 50
        };

        const updateQuery = {
            $push: { 'security.incidents': newIncident },
            $inc: {
                'security.trustScore': -(penaltyPoints[incident.severity] || 10)
            },
            $set: { updatedAt: new Date() }
        };

        
        if (incident.severity !== 'low') {
            updateQuery.$push['rating.reliability.penalties'] = {
                reason: incident.type,
                points: penaltyPoints[incident.severity],
                date: new Date(),
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
            };
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    
    async updateQuestProgress(masterId, questId, progress) {
        const master = await this.findById(masterId);
        if (!master) return null;

        const questIndex = master.gamification.quests
            .findIndex(q => q.id === questId);

        if (questIndex < 0) return null;

        const quest = master.gamification.quests[questIndex];
        const updateQuery = { $set: {} };

        
        progress.forEach(p => {
            const reqIndex = quest.requirements
                .findIndex(r => r.type === p.type);

            if (reqIndex >= 0) {
                updateQuery.$set[`gamification.quests.${questIndex}.requirements.${reqIndex}.current`] = p.current;
            }
        });

        
        const allCompleted = quest.requirements
            .every(r => r.current >= r.target);

        if (allCompleted) {
            updateQuery.$inc = {
                'gamification.level.experience': quest.reward.exp || 0,
                'gamification.rewards.points': quest.reward.bonus || 0
            };

            updateQuery.$pull = { 'gamification.quests': { id: questId } };
        }

        updateQuery.$set.updatedAt = new Date();

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    
    async getTopMasters(limit = 10, criteria = 'rating', filters = {}) {
        const sortOptions = {
            rating: { 'rating.overall.score': -1 },
            orders: { 'statistics.lifetime.completedOrders': -1 },
            earnings: { 'statistics.lifetime.totalEarnings': -1 },
            reliability: { 'rating.reliability.score': -1 }
        };

        const query = {
            status: MASTER_STATUS.ACTIVE,
            ...filters
        };

        return await this.collection
            .find(query)
            .sort(sortOptions[criteria] || sortOptions.rating)
            .limit(limit)
            .toArray();
    }

    
    async findForOrder(orderData) {
        const {
            serviceType,
            location,
            vehicleBrand,
            urgency,
            preferredMasterId,
            excludedMasterIds = []
        } = orderData;

        
        if (preferredMasterId) {
            const preferredMaster = await this.findById(preferredMasterId);
            if (preferredMaster &&
                preferredMaster.status === MASTER_STATUS.ACTIVE &&
                preferredMaster.onlineStatus === ONLINE_STATUS.ONLINE) {
                return [preferredMaster];
            }
        }

        
        const filters = {
            _id: { $nin: excludedMasterIds.map(id => new ObjectId(id)) },
            'professional.specializations.serviceType': serviceType,
            'work.capacity.currentLoad.activeOrders': {
                $lt: { $ifNull: ['$work.capacity.maxActiveOrders', 3] }
            }
        };

        
        if (vehicleBrand) {
            filters.$or = [
                { 'work.orderPreferences.preferredBrands': vehicleBrand },
                {
                    'work.orderPreferences.preferredBrands': { $size: 0 },
                    'work.orderPreferences.excludedBrands': { $ne: vehicleBrand }
                }
            ];
        }

        
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    distanceField: 'distance',
                    query: {
                        status: MASTER_STATUS.ACTIVE,
                        onlineStatus: ONLINE_STATUS.ONLINE,
                        ...filters
                    },
                    spherical: true,
                    maxDistance: 30000 
                }
            },
            {
                $match: {
                    $or: [
                        
                        {
                            'work.serviceAreas.primary': {
                                $geoIntersects: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [location.lng, location.lat]
                                    }
                                }
                            }
                        },
                        
                        {
                            'work.serviceAreas.extended': {
                                $geoIntersects: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [location.lng, location.lat]
                                    }
                                }
                            }
                        },
                        
                        {
                            distance: { $lte: { $ifNull: ['$work.baseLocation.mobility.maxDistance', 10000] } }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    
                    matchScore: {
                        $add: [
                            
                            { $multiply: ['$rating.overall.score', 1000] },

                            
                            { $multiply: ['$rating.reliability.score', 10] },

                            
                            { $multiply: [
                                    { $divide: [
                                            { $subtract: [30000, '$distance'] },
                                            300
                                        ]},
                                    1
                                ]},

                            
                            {
                                $multiply: [
                                    {
                                        $ifNull: [
                                            {
                                                $arrayElemAt: [
                                                    '$statistics.byService.count',
                                                    {
                                                        $indexOfArray: [
                                                            '$statistics.byService.serviceType',
                                                            serviceType
                                                        ]
                                                    }
                                                ]
                                            },
                                            0
                                        ]
                                    },
                                    5
                                ]
                            },

                            
                            {
                                $cond: [
                                    { $in: [vehicleBrand, '$work.orderPreferences.preferredBrands'] },
                                    200,
                                    0
                                ]
                            },

                            
                            {
                                $multiply: [
                                    '$work.capacity.currentLoad.activeOrders',
                                    -100
                                ]
                            }
                        ]
                    },

                    
                    willAutoAccept: {
                        $and: [
                            '$work.orderPreferences.autoAccept.enabled',
                            { $in: [serviceType, '$work.orderPreferences.autoAccept.services'] },
                            { $lte: ['$distance', '$work.orderPreferences.autoAccept.radius'] }
                        ]
                    }
                }
            },
            { $sort: { willAutoAccept: -1, matchScore: -1 } },
            { $limit: urgency === 'high' ? 5 : 10 }
        ];

        return await this.collection.aggregate(pipeline).toArray();
    }

    
    async checkAvailability(masterId, dateTime = new Date()) {
        const master = await this.findById(masterId);
        if (!master) {
            return { available: false, reason: 'master_not_found' };
        }

        if (master.status !== MASTER_STATUS.ACTIVE) {
            return { available: false, reason: 'master_not_active' };
        }

        if (master.onlineStatus === ONLINE_STATUS.OFFLINE) {
            return { available: false, reason: 'master_offline' };
        }

        if (master.onlineStatus === ONLINE_STATUS.BREAK) {
            return { available: false, reason: 'master_on_break' };
        }

        
        const currentLoad = master.work.capacity.currentLoad;
        if (currentLoad.activeOrders >= (master.work.capacity.maxActiveOrders || 3)) {
            return { available: false, reason: 'master_busy' };
        }

        
        const dayOfWeek = dateTime.getDay();
        const timeStr = dateTime.toTimeString().slice(0, 5);

        const schedule = master.work.schedule.regular.find(s =>
            s.dayOfWeek === dayOfWeek && s.enabled
        );

        if (!schedule) {
            return { available: false, reason: 'not_working_today' };
        }

        const isInWorkingTime = schedule.periods.some(period => {
            return period.type === 'working' &&
                timeStr >= period.startTime &&
                timeStr <= period.endTime;
        });

        if (!isInWorkingTime) {
            return { available: false, reason: 'outside_working_hours' };
        }

        
        const isOnVacation = master.work.schedule.vacations.some(vacation => {
            return vacation.approved &&
                dateTime >= vacation.startDate &&
                dateTime <= vacation.endDate;
        });

        if (isOnVacation) {
            return { available: false, reason: 'on_vacation' };
        }

        
        const busySlot = currentLoad.busySlots.find(slot => {
            return dateTime >= slot.startTime && dateTime <= slot.endTime;
        });

        if (busySlot) {
            return {
                available: false,
                reason: 'time_slot_busy',
                busyUntil: busySlot.endTime
            };
        }

        return { available: true };
    }

    
    async assignOrder(masterId, orderData) {
        const {
            orderId,
            estimatedDuration,
            scheduledTime
        } = orderData;

        const busySlot = {
            startTime: scheduledTime || new Date(),
            endTime: new Date((scheduledTime || new Date()).getTime() + estimatedDuration * 60000),
            orderId
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.activeOrder': {
                        orderId,
                        status: 'assigned',
                        startedAt: new Date(),
                        customer: orderData.customer
                    },
                    onlineStatus: ONLINE_STATUS.BUSY,
                    updatedAt: new Date()
                },
                $inc: {
                    'work.capacity.currentLoad.activeOrders': 1,
                    'work.capacity.currentLoad.todayOrders': 1
                },
                $push: {
                    'work.capacity.currentLoad.busySlots': busySlot
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async completeOrder(masterId, orderId) {
        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.activeOrder': null,
                    onlineStatus: ONLINE_STATUS.ONLINE,
                    updatedAt: new Date()
                },
                $inc: {
                    'work.capacity.currentLoad.activeOrders': -1,
                    'currentState.shift.summary.ordersCompleted': 1
                },
                $pull: {
                    'work.capacity.currentLoad.busySlots': { orderId }
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async softDelete(masterId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    status: MASTER_STATUS.DELETED,
                    onlineStatus: ONLINE_STATUS.OFFLINE,
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}


module.exports = {
    MasterModel,
    MASTER_STATUS,
    MASTER_TYPES,
    SKILL_LEVELS,
    ONLINE_STATUS,
    masterSchema
};