

'use strict';

const { ObjectId } = require('mongodb');
const { ORDER_STATUS } = require('../utils/constants/order-status');
const { USER_ROLES } = require('../utils/constants/user-roles');


const HISTORY_EVENT_TYPES = {
    
    ORDER_CREATED: 'order_created',                    
    ORDER_UPDATED: 'order_updated',                    
    ORDER_CANCELLED: 'order_cancelled',                
    ORDER_COMPLETED: 'order_completed',                
    ORDER_FAILED: 'order_failed',                      

    
    STATUS_CHANGED: 'status_changed',                  
    STATUS_ROLLBACK: 'status_rollback',                

    
    MASTER_ASSIGNED: 'master_assigned',                
    MASTER_UNASSIGNED: 'master_unassigned',            
    MASTER_ACCEPTED: 'master_accepted',                
    MASTER_REJECTED: 'master_rejected',                
    MASTER_ARRIVED: 'master_arrived',                  
    MASTER_STARTED_WORK: 'master_started_work',       

    
    SEARCH_STARTED: 'search_started',                  
    SEARCH_EXPANDED: 'search_expanded',                
    SEARCH_FAILED: 'search_failed',                    
    SEARCH_COMPLETED: 'search_completed',              

    
    PRICE_CALCULATED: 'price_calculated',              
    PRICE_UPDATED: 'price_updated',                    
    SURGE_APPLIED: 'surge_applied',                    
    DISCOUNT_APPLIED: 'discount_applied',              
    PAYMENT_INITIATED: 'payment_initiated',            
    PAYMENT_COMPLETED: 'payment_completed',            
    PAYMENT_FAILED: 'payment_failed',                  
    REFUND_INITIATED: 'refund_initiated',              
    REFUND_COMPLETED: 'refund_completed',              

    
    LOCATION_UPDATED: 'location_updated',              
    ROUTE_CALCULATED: 'route_calculated',              
    DESTINATION_CHANGED: 'destination_changed',        
    TRACKING_STARTED: 'tracking_started',              
    TRACKING_STOPPED: 'tracking_stopped',              

    
    MESSAGE_SENT: 'message_sent',                      
    CALL_INITIATED: 'call_initiated',                  
    NOTIFICATION_SENT: 'notification_sent',            
    SUPPORT_CONTACTED: 'support_contacted',            

    
    RATING_GIVEN: 'rating_given',                      
    REVIEW_SUBMITTED: 'review_submitted',              
    COMPLAINT_FILED: 'complaint_filed',                
    DISPUTE_OPENED: 'dispute_opened',                  
    DISPUTE_RESOLVED: 'dispute_resolved',              

    
    SYSTEM_ACTION: 'system_action',                    
    ADMIN_ACTION: 'admin_action',                      
    AUTO_ACTION: 'auto_action',                        
    ERROR_OCCURRED: 'error_occurred',                  
    TIMEOUT_REACHED: 'timeout_reached'                 
};


const EVENT_CATEGORIES = {
    LIFECYCLE: 'lifecycle',                            
    ASSIGNMENT: 'assignment',                          
    FINANCIAL: 'financial',                            
    LOCATION: 'location',                              
    COMMUNICATION: 'communication',                    
    FEEDBACK: 'feedback',                              
    SYSTEM: 'system'                                   
};


const EVENT_SEVERITY = {
    LOW: 'low',                                        
    MEDIUM: 'medium',                                  
    HIGH: 'high',                                      
    CRITICAL: 'critical'                               
};


const orderHistorySchema = {
    _id: ObjectId,

    
    orderId: ObjectId,                                 

    
    eventType: String,                                 
    eventCategory: String,                             
    severity: String,                                  

    
    actor: {
        type: String,                                  
        id: ObjectId,                                  
        role: String,                                  
        name: String,                                  

        
        ip: String,                                    
        userAgent: String,                             
        deviceId: String,                              
        appVersion: String                             
    },

    
    timestamp: Date,

    
    stateChange: {
        
        status: {
            from: String,                              
            to: String                                 
        },

        
        master: {
            fromId: ObjectId,
            toId: ObjectId,
            fromName: String,
            toName: String
        },

        
        price: {
            from: {
                base: Number,
                surge: Number,
                discount: Number,
                total: Number
            },
            to: {
                base: Number,
                surge: Number,
                discount: Number,
                total: Number
            },
            reason: String                             
        },

        
        location: {
            from: {
                address: String,
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                }
            },
            to: {
                address: String,
                coordinates: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                }
            }
        },

        
        otherFields: {
            
            
        }
    },

    
    details: {
        
        search: {
            radius: Number,                            
            mastersFound: Number,                      
            mastersNotified: Number,                   
            searchDuration: Number,                    
            expansions: Number                         
        },

        
        assignment: {
            method: String,                            
            priority: Number,                          
            distance: Number,                          
            eta: Number,                               
            rejectionReason: String,                   
            responseTime: Number                       
        },

        
        financial: {
            amount: Number,                            
            currency: String,                          
            paymentMethod: String,                     
            transactionId: String,                     
            commission: Number,                        
            vatAmount: Number                          
        },

        
        location: {
            accuracy: Number,                          
            speed: Number,                             
            heading: Number,                           
            distance: Number,                          
            duration: Number                           
        },

        
        communication: {
            messageType: String,                       
            messageContent: String,                    
            callDuration: Number,                      
            notificationType: String,                  
            deliveryStatus: String                     
        },

        
        feedback: {
            rating: Number,                            
            comment: String,                           
            tags: [String],                           
            complaintType: String,                     
            resolution: String                         
        },

        
        system: {
            action: String,                            
            reason: String,                            
            automated: Boolean,                        
            trigger: String,                           
            errorCode: String,                         
            errorMessage: String,                      
            stackTrace: String                         
        }
    },

    
    location: {
        
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: [Number]                      
        },
        accuracy: Number,
        address: String,

        
        source: String                                 
    },

    
    context: {
        
        orderState: {
            status: String,
            masterId: ObjectId,
            price: Number,
            paymentStatus: String
        },

        
        participants: {
            customer: {
                id: ObjectId,
                location: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                online: Boolean
            },
            master: {
                id: ObjectId,
                location: {
                    type: { type: String, default: 'Point' },
                    coordinates: [Number]
                },
                online: Boolean,
                status: String
            }
        },

        
        external: {
            weather: String,                           
            trafficLevel: String,                      
            surgeActive: Boolean,                      
            surgeMultiplier: Number                    
        }
    },

    
    metadata: {
        
        schemaVersion: Number,                         
        appVersion: String,                            
        apiVersion: String,                            

        
        requestId: String,                             
        sessionId: String,                             
        correlationId: String,                         

        
        tags: [String],                               
        flags: [String],                              
        customData: Object                            
    },

    
    relatedEvents: [{
        eventId: ObjectId,                            
        eventType: String,                            
        relation: String                              
    }],

    
    flags: {
        isDisputed: Boolean,                          
        isDeleted: Boolean,                           
        isArchived: Boolean,                          
        requiresReview: Boolean,                      
        wasEdited: Boolean                            
    },

    
    audit: {
        createdAt: Date,
        createdBy: ObjectId,

        
        edits: [{
            editedAt: Date,
            editedBy: ObjectId,
            reason: String,
            changes: Object                           
        }]
    }
};


class OrderHistoryModel {
    constructor(db) {
        this.collection = db.collection('order_history');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex({ orderId: 1, timestamp: -1 });
            await this.collection.createIndex({ eventType: 1, timestamp: -1 });
            await this.collection.createIndex({ 'actor.type': 1, 'actor.id': 1 });
            await this.collection.createIndex({ eventCategory: 1, severity: 1 });

            
            await this.collection.createIndex({ timestamp: -1 });
            await this.collection.createIndex({ 'context.orderState.status': 1 });
            await this.collection.createIndex({ 'metadata.requestId': 1 });
            await this.collection.createIndex({ 'metadata.sessionId': 1 });

            
            await this.collection.createIndex({ 'location.coordinates': '2dsphere' });

            
            await this.collection.createIndex({
                orderId: 1,
                eventType: 1,
                timestamp: 1
            });

            
            await this.collection.createIndex({ 'relatedEvents.eventId': 1 });

            
            
            
            
            

        } catch (error) {
            console.error('Error creating order history indexes:', error);
        }
    }

    
    async create(historyData) {
        const now = new Date();

        const history = {
            _id: new ObjectId(),
            ...historyData,

            
            severity: historyData.severity || this.determineSeverity(historyData.eventType),
            eventCategory: historyData.eventCategory || this.determineCategory(historyData.eventType),
            timestamp: historyData.timestamp || now,

            metadata: {
                schemaVersion: 1,
                ...historyData.metadata
            },

            flags: {
                isDisputed: false,
                isDeleted: false,
                isArchived: false,
                requiresReview: false,
                wasEdited: false,
                ...historyData.flags
            },

            audit: {
                createdAt: now,
                createdBy: historyData.actor?.id,
                edits: []
            }
        };

        const result = await this.collection.insertOne(history);
        return { ...history, _id: result.insertedId };
    }

    
    async createMany(historyRecords) {
        if (!historyRecords || historyRecords.length === 0) {
            return [];
        }

        const now = new Date();
        const records = historyRecords.map(record => ({
            _id: new ObjectId(),
            severity: this.determineSeverity(record.eventType),
            eventCategory: this.determineCategory(record.eventType),
            timestamp: now,
            metadata: { schemaVersion: 1 },
            flags: {
                isDisputed: false,
                isDeleted: false,
                isArchived: false,
                requiresReview: false,
                wasEdited: false
            },
            audit: {
                createdAt: now,
                createdBy: record.actor?.id,
                edits: []
            },
            ...record
        }));

        const result = await this.collection.insertMany(records);
        return records;
    }

    
    async getOrderHistory(orderId, options = {}) {
        const {
            eventTypes = null,
            categories = null,
            startDate = null,
            endDate = null,
            limit = 100,
            offset = 0,
            includeDeleted = false
        } = options;

        const query = {
            orderId: new ObjectId(orderId)
        };

        
        if (!includeDeleted) {
            query['flags.isDeleted'] = { $ne: true };
        }

        if (eventTypes && eventTypes.length > 0) {
            query.eventType = { $in: eventTypes };
        }

        if (categories && categories.length > 0) {
            query.eventCategory = { $in: categories };
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = startDate;
            if (endDate) query.timestamp.$lte = endDate;
        }

        return await this.collection
            .find(query)
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    
    async getLastEvent(orderId, eventType) {
        return await this.collection.findOne(
            {
                orderId: new ObjectId(orderId),
                eventType,
                'flags.isDeleted': { $ne: true }
            },
            { sort: { timestamp: -1 } }
        );
    }

    
    async getStatusHistory(orderId) {
        return await this.collection.find({
            orderId: new ObjectId(orderId),
            eventType: HISTORY_EVENT_TYPES.STATUS_CHANGED,
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: 1 })
            .toArray();
    }

    
    async getActorHistory(actorId, actorType, options = {}) {
        const { limit = 100, offset = 0 } = options;

        return await this.collection.find({
            'actor.id': new ObjectId(actorId),
            'actor.type': actorType,
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    
    async findSuspiciousEvents(orderId) {
        return await this.collection.find({
            orderId: new ObjectId(orderId),
            $or: [
                { 'metadata.flags': 'suspicious' },
                { 'flags.requiresReview': true },
                { severity: EVENT_SEVERITY.CRITICAL },
                { eventType: HISTORY_EVENT_TYPES.ERROR_OCCURRED }
            ]
        }).toArray();
    }

    
    async aggregateEvents(orderId, groupBy = 'eventType') {
        return await this.collection.aggregate([
            {
                $match: {
                    orderId: new ObjectId(orderId),
                    'flags.isDeleted': { $ne: true }
                }
            },
            {
                $group: {
                    _id: `$${groupBy}`,
                    count: { $sum: 1 },
                    firstEvent: { $min: '$timestamp' },
                    lastEvent: { $max: '$timestamp' },
                    actors: { $addToSet: '$actor.id' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();
    }

    
    async reconstructOrderState(orderId, targetTime) {
        const events = await this.collection.find({
            orderId: new ObjectId(orderId),
            timestamp: { $lte: targetTime },
            'flags.isDeleted': { $ne: true }
        })
            .sort({ timestamp: 1 })
            .toArray();

        
        let state = {
            status: ORDER_STATUS.NEW,
            masterId: null,
            price: null,
            location: null
        };

        
        for (const event of events) {
            if (event.stateChange) {
                if (event.stateChange.status?.to) {
                    state.status = event.stateChange.status.to;
                }
                if (event.stateChange.master?.toId) {
                    state.masterId = event.stateChange.master.toId;
                }
                if (event.stateChange.price?.to) {
                    state.price = event.stateChange.price.to;
                }
                if (event.stateChange.location?.to) {
                    state.location = event.stateChange.location.to;
                }
            }
        }

        return {
            orderId,
            reconstructedAt: targetTime,
            state,
            eventsProcessed: events.length
        };
    }

    
    async createTimeline(orderId) {
        const events = await this.getOrderHistory(orderId, { limit: 1000 });

        const timeline = events.map(event => ({
            timestamp: event.timestamp,
            type: event.eventType,
            category: event.eventCategory,
            severity: event.severity,
            actor: `${event.actor.type}:${event.actor.name || event.actor.id}`,
            summary: this.generateEventSummary(event)
        }));

        return timeline;
    }

    

    
    determineSeverity(eventType) {
        const criticalEvents = [
            HISTORY_EVENT_TYPES.ORDER_FAILED,
            HISTORY_EVENT_TYPES.PAYMENT_FAILED,
            HISTORY_EVENT_TYPES.ERROR_OCCURRED
        ];

        const highEvents = [
            HISTORY_EVENT_TYPES.ORDER_CANCELLED,
            HISTORY_EVENT_TYPES.DISPUTE_OPENED,
            HISTORY_EVENT_TYPES.COMPLAINT_FILED
        ];

        const lowEvents = [
            HISTORY_EVENT_TYPES.LOCATION_UPDATED,
            HISTORY_EVENT_TYPES.MESSAGE_SENT,
            HISTORY_EVENT_TYPES.NOTIFICATION_SENT
        ];

        if (criticalEvents.includes(eventType)) return EVENT_SEVERITY.CRITICAL;
        if (highEvents.includes(eventType)) return EVENT_SEVERITY.HIGH;
        if (lowEvents.includes(eventType)) return EVENT_SEVERITY.LOW;

        return EVENT_SEVERITY.MEDIUM;
    }

    
    determineCategory(eventType) {
        const categoryMap = {
            [HISTORY_EVENT_TYPES.ORDER_CREATED]: EVENT_CATEGORIES.LIFECYCLE,
            [HISTORY_EVENT_TYPES.STATUS_CHANGED]: EVENT_CATEGORIES.LIFECYCLE,
            [HISTORY_EVENT_TYPES.MASTER_ASSIGNED]: EVENT_CATEGORIES.ASSIGNMENT,
            [HISTORY_EVENT_TYPES.PAYMENT_COMPLETED]: EVENT_CATEGORIES.FINANCIAL,
            [HISTORY_EVENT_TYPES.LOCATION_UPDATED]: EVENT_CATEGORIES.LOCATION,
            [HISTORY_EVENT_TYPES.MESSAGE_SENT]: EVENT_CATEGORIES.COMMUNICATION,
            [HISTORY_EVENT_TYPES.RATING_GIVEN]: EVENT_CATEGORIES.FEEDBACK,
            [HISTORY_EVENT_TYPES.SYSTEM_ACTION]: EVENT_CATEGORIES.SYSTEM
        };

        
        for (const [prefix, category] of Object.entries({
            'order_': EVENT_CATEGORIES.LIFECYCLE,
            'master_': EVENT_CATEGORIES.ASSIGNMENT,
            'search_': EVENT_CATEGORIES.ASSIGNMENT,
            'payment_': EVENT_CATEGORIES.FINANCIAL,
            'price_': EVENT_CATEGORIES.FINANCIAL,
            'location_': EVENT_CATEGORIES.LOCATION,
            'message_': EVENT_CATEGORIES.COMMUNICATION,
            'rating_': EVENT_CATEGORIES.FEEDBACK,
            'system_': EVENT_CATEGORIES.SYSTEM
        })) {
            if (eventType.startsWith(prefix)) {
                return category;
            }
        }

        return categoryMap[eventType] || EVENT_CATEGORIES.SYSTEM;
    }

    
    generateEventSummary(event) {
        const summaries = {
            [HISTORY_EVENT_TYPES.ORDER_CREATED]: 'Заказ создан',
            [HISTORY_EVENT_TYPES.STATUS_CHANGED]: `Статус изменен: ${event.stateChange?.status?.from} → ${event.stateChange?.status?.to}`,
            [HISTORY_EVENT_TYPES.MASTER_ASSIGNED]: `Назначен мастер: ${event.stateChange?.master?.toName}`,
            [HISTORY_EVENT_TYPES.PAYMENT_COMPLETED]: `Оплата завершена: ${event.details?.financial?.amount} UZS`,
            [HISTORY_EVENT_TYPES.MASTER_ARRIVED]: 'Мастер прибыл на место'
        };

        return summaries[event.eventType] || event.eventType;
    }

    
    async softDelete(historyId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(historyId) },
            {
                $set: {
                    'flags.isDeleted': true,
                    'audit.edits': {
                        $push: {
                            editedAt: new Date(),
                            reason: 'soft_delete'
                        }
                    }
                }
            }
        );
    }
}


module.exports = {
    OrderHistoryModel,
    HISTORY_EVENT_TYPES,
    EVENT_CATEGORIES,
    EVENT_SEVERITY,
    orderHistorySchema
};