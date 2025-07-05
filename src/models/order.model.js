

'use strict';

const { ObjectId } = require('mongodb');
const {
    ORDER_STATUS,
    CANCELLATION_REASONS,
    FAILURE_REASONS,
    canTransition,
    getStatusTimeout,
    isStatusExpired
} = require('../utils/constants/order-status');
const { SERVICE_TYPES } = require('../utils/constants/service-types');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants/payment-status');
const { USER_ROLES } = require('../utils/constants/user-roles');
const { HISTORY_EVENT_TYPES } = require('./order-history.model');


const ORDER_TYPES = {
    IMMEDIATE: 'immediate',           
    SCHEDULED: 'scheduled',           
    RECURRING: 'recurring'            
};


const ORDER_SOURCES = {
    MOBILE_APP: 'mobile_app',
    WEB: 'web',
    CALL_CENTER: 'call_center',
    API: 'api',
    RECURRING: 'recurring'
};


const ORDER_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
    CRITICAL: 'critical'
};


const orderSchema = {
    _id: ObjectId,

    
    orderNumber: String,              

    
    type: String,                     
    source: String,                   
    priority: String,                 
    status: String,                   

    
    customer: {
        userId: ObjectId,
        name: String,
        phone: String,

        
        rating: Number,               
        ordersCount: Number,          
        isVip: Boolean,              

        
        device: {
            id: String,
            type: String,             
            model: String,
            appVersion: String
        }
    },

    
    vehicle: {
        vehicleId: ObjectId,

        
        brand: String,
        model: String,
        year: Number,
        plateNumber: String,
        color: String,

        
        displayName: String           
    },

    
    service: {
        serviceId: ObjectId,
        code: String,                 
        name: String,                 
        category: String,

        
        options: [{
            id: String,
            name: String,
            price: Number,
            quantity: Number
        }],

        
        description: String,

        
        media: [{
            type: String,             
            url: String,
            thumbnailUrl: String,
            uploadedAt: Date
        }]
    },

    
    executor: {
        type: String,                 

        
        masterId: ObjectId,
        masterName: String,
        masterPhone: String,
        masterRating: Number,

        
        stoId: ObjectId,
        stoName: String,
        stoPhone: String,
        stoRating: Number,

        
        assignedAt: Date,
        acceptedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,

        
        responseTime: Number,         

        
        history: [{
            executorId: ObjectId,
            executorType: String,
            executorName: String,
            assignedAt: Date,
            unassignedAt: Date,
            reason: String
        }]
    },

    
    location: {
        
        pickup: {
            address: {
                formatted: String,
                street: String,
                building: String,
                entrance: String,
                floor: String,
                apartment: String,
                landmark: String,
                instructions: String
            },

            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]  
            },

            
            isVerified: Boolean,
            verifiedBy: String        
        },

        
        destination: {
            address: Object,          
            coordinates: Object,      
            isVerified: Boolean
        },

        
        route: {
            distance: Number,         
            duration: Number,         

            
            polyline: String,         

            
            waypoints: [{
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                timestamp: Date
            }]
        },

        
        tracking: {
            isActive: Boolean,

            currentLocation: {
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                accuracy: Number,
                heading: Number,
                speed: Number,
                updatedAt: Date
            },

            
            eta: {
                minutes: Number,
                distance: Number,
                updatedAt: Date
            }
        }
    },

    
    timing: {
        
        scheduledFor: Date,
        scheduledDuration: Number,    

        
        createdAt: Date,
        searchStartedAt: Date,
        assignedAt: Date,
        acceptedAt: Date,
        arrivedAt: Date,
        startedAt: Date,
        completedAt: Date,
        cancelledAt: Date,

        
        durations: {
            search: Number,           
            response: Number,         
            arrival: Number,          
            work: Number,            
            total: Number            
        },

        
        sla: {
            searchTimeout: Number,    
            responseTimeout: Number,  
            arrivalTimeout: Number,   

            
            violations: [{
                type: String,         
                timestamp: Date,
                duration: Number      
            }]
        }
    },

    
    pricing: {
        
        calculation: {
            basePrice: Number,

            
            components: [{
                type: String,         
                description: String,
                amount: Number,
                quantity: Number,
                unit: String
            }],

            
            surgeMultiplier: Number,
            surgeAmount: Number,
            nightSurcharge: Number,
            weekendSurcharge: Number,
            urgencySurcharge: Number,

            
            discount: {
                type: String,         
                code: String,
                amount: Number,
                percentage: Number
            },

            
            subtotal: Number,
            tax: Number,
            taxRate: Number,
            total: Number,

            
            currency: String,         

            
            calculatedAt: Date
        },

        
        payment: {
            method: String,           
            status: String,           

            
            details: {
                cardMask: String,     
                cardType: String,     

                
                splits: [{
                    method: String,
                    amount: Number,
                    status: String
                }]
            },

            
            transactions: [{
                transactionId: ObjectId,
                type: String,
                amount: Number,
                status: String,
                timestamp: Date
            }],

            
            paidAmount: Number,
            refundedAmount: Number,
            dueAmount: Number
        },

        
        distribution: {
            
            platformCommission: {
                rate: Number,         
                amount: Number
            },

            
            executorPayout: {
                amount: Number,
                status: String,       
                paidAt: Date
            },

            
            stoShare: {
                amount: Number,
                rate: Number
            },

            masterShare: {
                amount: Number,
                rate: Number
            }
        }
    },

    
    search: {
        
        criteria: {
            serviceType: String,
            requiredSkills: [String],
            preferredExecutorIds: [ObjectId],
            excludedExecutorIds: [ObjectId],

            radius: Number,           
            maxRadius: Number,        

            
            minRating: Number,
            maxPrice: Number,
            onlyVerified: Boolean,
            onlyWithReviews: Boolean
        },

        
        attempts: [{
            attemptNumber: Number,
            timestamp: Date,
            radius: Number,

            
            candidates: [{
                executorId: ObjectId,
                executorType: String,
                distance: Number,
                eta: Number,
                rating: Number,
                price: Number,
                score: Number,        

                
                notified: Boolean,
                notifiedAt: Date,
                responded: Boolean,
                respondedAt: Date,
                response: String,     
                rejectionReason: String
            }],

            result: String           
        }],

        
        stats: {
            totalCandidates: Number,
            notifiedCount: Number,
            respondedCount: Number,
            acceptedCount: Number,
            searchDuration: Number
        }
    },

    
    feedback: {
        
        fromCustomer: {
            rating: Number,           

            
            categories: {
                quality: Number,
                speed: Number,
                price: Number,
                communication: Number,
                cleanliness: Number
            },

            comment: String,
            tags: [String],          

            
            photos: [{
                url: String,
                caption: String
            }],

            createdAt: Date,

            
            response: {
                comment: String,
                createdAt: Date
            }
        },

        
        fromExecutor: {
            rating: Number,
            comment: String,
            tags: [String],          
            createdAt: Date
        },

        
        complaints: [{
            from: String,            
            type: String,
            description: String,
            status: String,          
            createdAt: Date,
            resolvedAt: Date,
            resolution: String
        }]
    },

    
    communication: {
        
        chatEnabled: Boolean,
        chatSessionId: String,
        messagesCount: Number,
        lastMessageAt: Date,

        
        calls: [{
            from: String,            
            to: String,
            duration: Number,        
            status: String,          
            timestamp: Date
        }],

        
        autoMessages: [{
            type: String,            
            template: String,
            sentAt: Date,
            deliveryStatus: String
        }]
    },

    
    marketing: {
        
        promocode: {
            code: String,
            campaignId: ObjectId,
            discount: Number,
            discountType: String     
        },

        
        attribution: {
            source: String,          
            medium: String,          
            campaign: String,
            referrerId: ObjectId
        },

        
        experiments: [{
            name: String,
            variant: String,
            enrolledAt: Date
        }]
    },

    
    recurring: {
        isRecurring: Boolean,

        
        schedule: {
            frequency: String,       
            interval: Number,        

            
            daysOfWeek: [Number],    

            
            dayOfMonth: Number,

            
            timeOfDay: String,       

            
            startDate: Date,
            endDate: Date,

            
            nextRunAt: Date
        },

        
        executions: [{
            orderId: ObjectId,
            scheduledFor: Date,
            executedAt: Date,
            status: String,
            reason: String           
        }],

        
        settings: {
            autoConfirm: Boolean,
            preferredExecutorId: ObjectId,
            maxPrice: Number,
            skipOnHolidays: Boolean
        }
    },

    
    metadata: {
        
        version: Number,             
        apiVersion: String,

        
        flags: {
            isTest: Boolean,
            isPriority: Boolean,
            isCompensation: Boolean, 
            requiresReview: Boolean,
            wasEdited: Boolean,
            isDisputed: Boolean
        },

        
        tags: [String],

        
        customFields: Object,

        
        notes: [{
            author: ObjectId,
            authorRole: String,
            text: String,
            createdAt: Date
        }]
    },

    
    audit: {
        createdBy: ObjectId,
        createdByRole: String,

        
        lastModified: {
            by: ObjectId,
            byRole: String,
            at: Date,
            fields: [String]         
        },

        
        ip: {
            created: String,
            lastModified: String
        }
    },

    
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date                  
};


class OrderModel {
    constructor(db) {
        this.collection = db.collection('orders');
        this.historyModel = null; 
        this.setupIndexes();
    }

    
    setHistoryModel(historyModel) {
        this.historyModel = historyModel;
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex({ orderNumber: 1 }, { unique: true });

            
            await this.collection.createIndex({ status: 1, createdAt: -1 });
            await this.collection.createIndex({ 'customer.userId': 1, createdAt: -1 });
            await this.collection.createIndex({ 'executor.masterId': 1, status: 1 });
            await this.collection.createIndex({ 'executor.stoId': 1, status: 1 });

            
            await this.collection.createIndex({ 'location.pickup.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'location.destination.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'location.tracking.currentLocation.coordinates': '2dsphere' });

            
            await this.collection.createIndex({
                status: 1,
                'service.code': 1,
                createdAt: -1
            });

            await this.collection.createIndex({
                'payment.status': 1,
                'payment.method': 1,
                createdAt: -1
            });

            
            await this.collection.createIndex({
                type: 1,
                'timing.scheduledFor': 1,
                status: 1
            });

            
            await this.collection.createIndex({
                'recurring.isRecurring': 1,
                'recurring.schedule.nextRunAt': 1
            });

            
            await this.collection.createIndex({ createdAt: -1 });
            await this.collection.createIndex({ 'timing.completedAt': -1 });
            await this.collection.createIndex({ 'pricing.calculation.total': -1 });

            
            await this.collection.createIndex({
                orderNumber: 'text',
                'customer.name': 'text',
                'customer.phone': 'text',
                'vehicle.plateNumber': 'text',
                'location.pickup.address.formatted': 'text'
            });

            
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 30 * 24 * 60 * 60 } 
            );

        } catch (error) {
            console.error('Error creating order indexes:', error);
        }
    }

    
    async create(orderData) {
        const now = new Date();

        
        const orderNumber = await this.generateOrderNumber();

        const order = {
            _id: new ObjectId(),
            orderNumber,
            ...orderData,

            
            type: orderData.type || ORDER_TYPES.IMMEDIATE,
            source: orderData.source || ORDER_SOURCES.MOBILE_APP,
            priority: orderData.priority || ORDER_PRIORITY.NORMAL,
            status: ORDER_STATUS.NEW,

            pricing: {
                calculation: {
                    currency: 'UZS',
                    ...orderData.pricing?.calculation
                },
                payment: {
                    status: PAYMENT_STATUS.PENDING,
                    paidAmount: 0,
                    refundedAmount: 0,
                    ...orderData.pricing?.payment
                },
                ...orderData.pricing
            },

            timing: {
                createdAt: now,
                durations: {},
                sla: {
                    searchTimeout: getStatusTimeout(ORDER_STATUS.SEARCHING),
                    responseTimeout: getStatusTimeout(ORDER_STATUS.ASSIGNED),
                    arrivalTimeout: getStatusTimeout(ORDER_STATUS.EN_ROUTE),
                    violations: []
                },
                ...orderData.timing
            },

            search: {
                attempts: [],
                stats: {
                    totalCandidates: 0,
                    notifiedCount: 0,
                    respondedCount: 0,
                    acceptedCount: 0
                },
                ...orderData.search
            },

            communication: {
                chatEnabled: true,
                messagesCount: 0,
                calls: [],
                autoMessages: [],
                ...orderData.communication
            },

            metadata: {
                version: 1,
                flags: {
                    isTest: false,
                    isPriority: orderData.priority === ORDER_PRIORITY.URGENT ||
                        orderData.priority === ORDER_PRIORITY.CRITICAL,
                    ...orderData.metadata?.flags
                },
                ...orderData.metadata
            },

            audit: {
                createdBy: orderData.customer.userId,
                createdByRole: USER_ROLES.CLIENT,
                ...orderData.audit
            },

            createdAt: now,
            updatedAt: now
        };

        const result = await this.collection.insertOne(order);
        order._id = result.insertedId;

        
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: order._id,
                eventType: HISTORY_EVENT_TYPES.ORDER_CREATED,
                actor: {
                    type: 'user',
                    id: order.customer.userId,
                    role: USER_ROLES.CLIENT
                },
                details: {
                    system: {
                        action: 'order_created',
                        automated: false
                    }
                }
            });
        }

        return order;
    }

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            deletedAt: { $exists: false }
        });
    }

    
    async findByNumber(orderNumber) {
        return await this.collection.findOne({
            orderNumber,
            deletedAt: { $exists: false }
        });
    }

    
    async findByCustomerId(customerId, options = {}) {
        const {
            statuses = null,
            limit = 20,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = -1
        } = options;

        const query = {
            'customer.userId': new ObjectId(customerId),
            deletedAt: { $exists: false }
        };

        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        return await this.collection
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    
    async findByExecutorId(executorId, executorType = 'master', options = {}) {
        const {
            statuses = null,
            dateFrom = null,
            dateTo = null,
            limit = 50,
            offset = 0
        } = options;

        const query = {
            deletedAt: { $exists: false }
        };

        
        if (executorType === 'master') {
            query['executor.masterId'] = new ObjectId(executorId);
        } else {
            query['executor.stoId'] = new ObjectId(executorId);
        }

        
        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        return await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    
    async findActive(filters = {}) {
        const query = {
            status: {
                $in: [
                    ORDER_STATUS.NEW,
                    ORDER_STATUS.SEARCHING,
                    ORDER_STATUS.ASSIGNED,
                    ORDER_STATUS.ACCEPTED,
                    ORDER_STATUS.EN_ROUTE,
                    ORDER_STATUS.ARRIVED,
                    ORDER_STATUS.IN_PROGRESS
                ]
            },
            deletedAt: { $exists: false },
            ...filters
        };

        return await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
    }

    
    async findOrdersForAssignment(criteria = {}) {
        const {
            serviceTypes = [],
            maxDistance = 10000,
            location = null,
            minRating = 0
        } = criteria;

        const query = {
            status: ORDER_STATUS.SEARCHING,
            deletedAt: { $exists: false }
        };

        if (serviceTypes.length > 0) {
            query['service.code'] = { $in: serviceTypes };
        }

        if (location) {
            query['location.pickup.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: maxDistance
                }
            };
        }

        return await this.collection
            .find(query)
            .sort({ priority: -1, createdAt: 1 })
            .toArray();
    }

    
    async updateStatus(orderId, newStatus, details = {}) {
        const order = await this.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        
        if (!canTransition(order.status, newStatus)) {
            throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
        }

        const now = new Date();
        const updateData = {
            status: newStatus,
            updatedAt: now
        };

        
        const timestampMap = {
            [ORDER_STATUS.SEARCHING]: 'searchStartedAt',
            [ORDER_STATUS.ASSIGNED]: 'assignedAt',
            [ORDER_STATUS.ACCEPTED]: 'acceptedAt',
            [ORDER_STATUS.ARRIVED]: 'arrivedAt',
            [ORDER_STATUS.IN_PROGRESS]: 'startedAt',
            [ORDER_STATUS.COMPLETED]: 'completedAt',
            [ORDER_STATUS.CANCELLED]: 'cancelledAt'
        };

        if (timestampMap[newStatus]) {
            updateData[`timing.${timestampMap[newStatus]}`] = now;
        }

        
        if (order.status === ORDER_STATUS.SEARCHING && newStatus === ORDER_STATUS.ASSIGNED) {
            updateData['timing.durations.search'] =
                (now - order.timing.searchStartedAt) / 1000;
        }

        if (order.status === ORDER_STATUS.ASSIGNED && newStatus === ORDER_STATUS.ACCEPTED) {
            updateData['timing.durations.response'] =
                (now - order.timing.assignedAt) / 1000;
        }

        
        if (newStatus === ORDER_STATUS.CANCELLED && details.reason) {
            updateData['cancellation'] = {
                reason: details.reason,
                cancelledBy: details.cancelledBy,
                cancelledByRole: details.cancelledByRole,
                description: details.description
            };
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.STATUS_CHANGED,
                actor: {
                    type: details.actorType || 'system',
                    id: details.actorId,
                    role: details.actorRole
                },
                stateChange: {
                    status: {
                        from: order.status,
                        to: newStatus
                    }
                }
            });
        }

        return result;
    }

    
    async assignExecutor(orderId, executorData) {
        const now = new Date();

        const updateData = {
            'executor.type': executorData.type,
            'executor.assignedAt': now,
            'timing.assignedAt': now,
            status: ORDER_STATUS.ASSIGNED,
            updatedAt: now
        };

        if (executorData.type === 'master') {
            updateData['executor.masterId'] = new ObjectId(executorData.masterId);
            updateData['executor.masterName'] = executorData.masterName;
            updateData['executor.masterPhone'] = executorData.masterPhone;
            updateData['executor.masterRating'] = executorData.masterRating;
        } else {
            updateData['executor.stoId'] = new ObjectId(executorData.stoId);
            updateData['executor.stoName'] = executorData.stoName;
            updateData['executor.stoPhone'] = executorData.stoPhone;
            updateData['executor.stoRating'] = executorData.stoRating;
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: updateData,
                $push: {
                    'executor.history': {
                        executorId: executorData.masterId || executorData.stoId,
                        executorType: executorData.type,
                        executorName: executorData.masterName || executorData.stoName,
                        assignedAt: now
                    }
                }
            },
            { returnDocument: 'after' }
        );

        
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.MASTER_ASSIGNED,
                actor: {
                    type: 'system',
                    id: executorData.assignedBy
                },
                stateChange: {
                    master: {
                        toId: executorData.masterId || executorData.stoId,
                        toName: executorData.masterName || executorData.stoName
                    }
                },
                details: {
                    assignment: {
                        method: executorData.method || 'auto',
                        distance: executorData.distance,
                        eta: executorData.eta
                    }
                }
            });
        }

        return result;
    }

    
    async updatePricing(orderId, pricingData) {
        const updateData = {
            'pricing.calculation': {
                ...pricingData,
                calculatedAt: new Date()
            },
            updatedAt: new Date()
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.PRICE_UPDATED,
                actor: {
                    type: 'system'
                },
                stateChange: {
                    price: {
                        to: pricingData
                    }
                }
            });
        }

        return result;
    }

    
    async updateTracking(orderId, trackingData) {
        const updateData = {
            'location.tracking': {
                isActive: true,
                currentLocation: {
                    coordinates: {
                        type: 'Point',
                        coordinates: [trackingData.lng, trackingData.lat]
                    },
                    accuracy: trackingData.accuracy,
                    heading: trackingData.heading,
                    speed: trackingData.speed,
                    updatedAt: new Date()
                },
                eta: trackingData.eta
            },
            updatedAt: new Date()
        };

        
        const waypoint = {
            coordinates: {
                type: 'Point',
                coordinates: [trackingData.lng, trackingData.lat]
            },
            timestamp: new Date()
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: updateData,
                $push: {
                    'location.route.waypoints': {
                        $each: [waypoint],
                        $slice: -100 
                    }
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async addSearchAttempt(orderId, attemptData) {
        const attempt = {
            attemptNumber: attemptData.attemptNumber,
            timestamp: new Date(),
            radius: attemptData.radius,
            candidates: attemptData.candidates || [],
            result: attemptData.result
        };

        const updateData = {
            $push: { 'search.attempts': attempt },
            $inc: {
                'search.stats.totalCandidates': attemptData.candidates?.length || 0,
                'search.stats.notifiedCount': attemptData.notifiedCount || 0
            },
            $set: { updatedAt: new Date() }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            updateData,
            { returnDocument: 'after' }
        );
    }

    
    async addFeedback(orderId, feedbackData) {
        const { from, rating, comment, categories, tags } = feedbackData;

        const feedback = {
            rating,
            comment,
            categories,
            tags,
            createdAt: new Date()
        };

        const updateField = from === 'customer' ?
            'feedback.fromCustomer' : 'feedback.fromExecutor';

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: {
                    [updateField]: feedback,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        
        if (this.historyModel) {
            await this.historyModel.create({
                orderId: result._id,
                eventType: HISTORY_EVENT_TYPES.RATING_GIVEN,
                actor: {
                    type: from === 'customer' ? 'user' : 'master',
                    id: from === 'customer' ?
                        result.customer.userId : result.executor.masterId
                },
                details: {
                    feedback: {
                        rating,
                        comment,
                        tags
                    }
                }
            });
        }

        return result;
    }

    
    async calculateStats(filters = {}) {
        const pipeline = [];

        
        const match = {
            deletedAt: { $exists: false }
        };

        if (filters.startDate || filters.endDate) {
            match.createdAt = {};
            if (filters.startDate) match.createdAt.$gte = filters.startDate;
            if (filters.endDate) match.createdAt.$lte = filters.endDate;
        }

        if (filters.status) match.status = filters.status;
        if (filters.serviceType) match['service.code'] = filters.serviceType;

        pipeline.push({ $match: match });

        
        pipeline.push({
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0] }
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] }
                },
                totalRevenue: {
                    $sum: { $cond: [
                            { $eq: ['$status', ORDER_STATUS.COMPLETED] },
                            '$pricing.calculation.total',
                            0
                        ]}
                },
                avgOrderValue: {
                    $avg: { $cond: [
                            { $eq: ['$status', ORDER_STATUS.COMPLETED] },
                            '$pricing.calculation.total',
                            null
                        ]}
                },
                avgSearchTime: { $avg: '$timing.durations.search' },
                avgWorkTime: { $avg: '$timing.durations.work' },
                avgRating: { $avg: '$feedback.fromCustomer.rating' }
            }
        });

        const results = await this.collection.aggregate(pipeline).toArray();
        return results[0] || {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            avgSearchTime: 0,
            avgWorkTime: 0,
            avgRating: 0
        };
    }

    
    async findExpiredOrders() {
        const now = new Date();
        const expiredOrders = [];

        
        const searchingOrders = await this.collection.find({
            status: ORDER_STATUS.SEARCHING,
            deletedAt: { $exists: false }
        }).toArray();

        for (const order of searchingOrders) {
            if (isStatusExpired(ORDER_STATUS.SEARCHING, order.timing.searchStartedAt)) {
                expiredOrders.push({
                    order,
                    reason: 'search_timeout',
                    newStatus: ORDER_STATUS.EXPIRED
                });
            }
        }

        
        const assignedOrders = await this.collection.find({
            status: ORDER_STATUS.ASSIGNED,
            deletedAt: { $exists: false }
        }).toArray();

        for (const order of assignedOrders) {
            if (isStatusExpired(ORDER_STATUS.ASSIGNED, order.timing.assignedAt)) {
                expiredOrders.push({
                    order,
                    reason: 'response_timeout',
                    newStatus: ORDER_STATUS.SEARCHING
                });
            }
        }

        return expiredOrders;
    }

    
    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        
        const lastOrder = await this.collection.findOne(
            {
                orderNumber: {
                    $regex: `^Y24-${year}${month}${day}-\\d{4}$`
                }
            },
            { sort: { orderNumber: -1 } }
        );

        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        return `Y24-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
    }

    
    async softDelete(orderId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(orderId) },
            {
                $set: {
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}


module.exports = {
    OrderModel,
    ORDER_TYPES,
    ORDER_SOURCES,
    ORDER_PRIORITY,
    orderSchema
};