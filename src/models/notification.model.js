

'use strict';

const { ObjectId } = require('mongodb');
const {
    NOTIFICATION_TYPES,
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_CHANNELS,
    NOTIFICATION_TTL,
    getNotificationMetadata,
    getNotificationTemplate,
    getNotificationActions,
    getNotificationTTL,
    requiresAcknowledgment
} = require('../utils/constants/notification-types');
const { USER_ROLES } = require('../utils/constants/user-roles');
const { AppError } = require('../utils/errors/app-error');


const NOTIFICATION_STATUS = {
    CREATED: 'created',              
    QUEUED: 'queued',               
    PROCESSING: 'processing',        
    SENT: 'sent',                   
    DELIVERED: 'delivered',         
    READ: 'read',                   
    FAILED: 'failed',               
    CANCELLED: 'cancelled',         
    EXPIRED: 'expired'              
};


const DELIVERY_STATUS = {
    PENDING: 'pending',
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    BOUNCED: 'bounced',
    CLICKED: 'clicked',
    UNSUBSCRIBED: 'unsubscribed'
};


const FAILURE_REASONS = {
    INVALID_TOKEN: 'invalid_token',
    UNREGISTERED: 'unregistered',
    PROVIDER_ERROR: 'provider_error',
    RATE_LIMITED: 'rate_limited',
    INVALID_PHONE: 'invalid_phone',
    BLOCKED: 'blocked',
    TIMEOUT: 'timeout',
    UNKNOWN: 'unknown'
};


const notificationSchema = {
    _id: ObjectId,

    
    type: String,                    
    category: String,                
    priority: String,                
    status: String,                  

    
    recipient: {
        userId: ObjectId,
        role: String,                

        
        name: String,
        phone: String,
        email: String,
        language: String,            

        
        preferences: {
            channels: {
                push: Boolean,
                sms: Boolean,
                email: Boolean,
                inApp: Boolean
            },
            quietHours: {
                enabled: Boolean,
                start: String,       
                end: String,         
                timezone: String
            },
            categories: {
                [NOTIFICATION_CATEGORIES.ORDER]: Boolean,
                [NOTIFICATION_CATEGORIES.PAYMENT]: Boolean,
                [NOTIFICATION_CATEGORIES.PROMO]: Boolean,
                [NOTIFICATION_CATEGORIES.SYSTEM]: Boolean
            }
        }
    },

    
    references: {
        orderId: ObjectId,
        paymentId: ObjectId,
        masterId: ObjectId,
        stoId: ObjectId,
        ticketId: ObjectId,

        
        groupId: String,             
        campaignId: ObjectId,        
        templateId: ObjectId         
    },

    
    content: {
        
        title: {
            ru: String,
            uz: String,
            en: String
        },
        body: {
            ru: String,
            uz: String,
            en: String
        },

        
        subtitle: {
            ru: String,
            uz: String,
            en: String
        },

        
        media: {
            icon: String,            
            image: String,           
            sound: String,           
            badge: Number            
        },

        
        actions: [{
            id: String,
            label: {
                ru: String,
                uz: String,
                en: String
            },
            type: String,            
            action: String,          
            style: String            
        }],

        
        data: {
            type: String,
            entityId: String,
            metadata: Object         
        }
    },

    
    channels: [{
        type: String,                
        enabled: Boolean,
        status: String,              

        
        delivery: {
            
            push: {
                provider: String,    
                token: String,       
                deviceId: String,
                platform: String,    

                
                messageId: String,
                sentAt: Date,
                deliveredAt: Date,
                readAt: Date,
                clickedAt: Date,

                
                ttl: Number,
                collapseKey: String,

                
                error: {
                    code: String,
                    message: String,
                    timestamp: Date
                }
            },

            
            sms: {
                provider: String,    
                phone: String,
                messageId: String,
                parts: Number,       

                sentAt: Date,
                deliveredAt: Date,
                cost: Number,        

                error: {
                    code: String,
                    message: String
                }
            },

            
            email: {
                provider: String,    
                to: String,
                messageId: String,

                sentAt: Date,
                deliveredAt: Date,
                openedAt: Date,
                clickedAt: Date,
                unsubscribedAt: Date,

                
                opens: Number,
                clicks: [{
                    url: String,
                    clickedAt: Date
                }],

                error: {
                    code: String,
                    message: String,
                    bounce: {
                        type: String, 
                        reason: String
                    }
                }
            },

            
            inApp: {
                shownAt: Date,
                readAt: Date,
                dismissedAt: Date,
                actionTaken: String
            }
        },

        
        attempts: [{
            attemptNumber: Number,
            timestamp: Date,
            status: String,
            error: {
                code: String,
                message: String
            }
        }],

        
        settings: {
            retryEnabled: Boolean,
            maxRetries: Number,
            retryDelay: Number,
            priority: String
        }
    }],

    
    scheduling: {
        scheduledFor: Date,          
        sendAfter: Date,            
        sendBefore: Date,           

        
        batch: {
            enabled: Boolean,
            batchId: String,
            position: Number,        
            totalInBatch: Number
        },

        
        throttle: {
            enabled: Boolean,
            rate: Number,           
            bucket: String          
        }
    },

    
    stats: {
        
        totalChannels: Number,
        sentChannels: Number,
        deliveredChannels: Number,
        failedChannels: Number,

        
        processingTime: {
            total: Number,          
            perChannel: {
                push: Number,
                sms: Number,
                email: Number
            }
        },

        
        engagement: {
            opened: Boolean,
            clicked: Boolean,
            converted: Boolean,
            conversionValue: Number
        }
    },

    
    lifecycle: {
        ttl: Number,                
        expiresAt: Date,
        expiredAt: Date,

        
        acknowledgment: {
            required: Boolean,
            acknowledgedAt: Date,
            acknowledgedBy: ObjectId,
            method: String          
        },

        
        cancellation: {
            cancelledAt: Date,
            cancelledBy: ObjectId,
            reason: String
        },

        
        autoActions: {
            autoDismiss: Boolean,
            autoDismissAfter: Number, 
            autoCancel: Boolean,
            autoCancelAfter: Number
        }
    },

    
    grouping: {
        
        groupKey: String,
        groupCount: Number,
        isGroupSummary: Boolean,

        
        deduplicationKey: String,
        replacesNotificationId: ObjectId,
        replacedByNotificationId: ObjectId
    },

    
    experiment: {
        enabled: Boolean,
        experimentId: String,
        variant: String,            

        
        metrics: {
            sent: Boolean,
            delivered: Boolean,
            opened: Boolean,
            clicked: Boolean,
            converted: Boolean
        }
    },

    
    metadata: {
        
        source: String,             
        sourceId: String,

        
        version: Number,
        templateVersion: String,

        
        context: {
            ip: String,
            userAgent: String,
            platform: String,
            appVersion: String
        },

        
        tags: [String],

        
        custom: Object
    },

    
    audit: {
        createdBy: ObjectId,
        createdByType: String,      

        
        history: [{
            timestamp: Date,
            action: String,         
            performedBy: ObjectId,
            changes: Object
        }]
    },

    
    search: {
        
        searchText: String,

        
        dateKey: Number,           
        hourKey: Number,          
    },

    
    createdAt: Date,
    queuedAt: Date,
    processingStartedAt: Date,
    processedAt: Date,
    firstSentAt: Date,
    lastSentAt: Date,
    updatedAt: Date
};


class NotificationModel {
    constructor(db) {
        this.collection = db.collection('notifications');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex({ 'recipient.userId': 1, createdAt: -1 });
            await this.collection.createIndex({ status: 1, 'scheduling.scheduledFor': 1 });
            await this.collection.createIndex({ type: 1, status: 1 });
            await this.collection.createIndex({ category: 1, priority: -1 });

            
            await this.collection.createIndex({
                status: 1,
                'scheduling.scheduledFor': 1,
                priority: -1
            });

            
            await this.collection.createIndex({
                'scheduling.batch.batchId': 1,
                'scheduling.batch.position': 1
            });

            
            await this.collection.createIndex({ 'references.orderId': 1 });
            await this.collection.createIndex({ 'references.groupId': 1 });

            
            await this.collection.createIndex(
                { 'grouping.deduplicationKey': 1 },
                {
                    unique: true,
                    sparse: true,
                    partialFilterExpression: {
                        'grouping.deduplicationKey': { $exists: true }
                    }
                }
            );

            
            await this.collection.createIndex({
                'recipient.userId': 1,
                type: 1,
                status: 1,
                createdAt: -1
            });

            
            await this.collection.createIndex({
                'search.dateKey': -1,
                'search.hourKey': -1
            });

            
            await this.collection.createIndex(
                { 'lifecycle.expiresAt': 1 },
                { expireAfterSeconds: 0 }
            );

            
            await this.collection.createIndex({
                'search.searchText': 'text'
            });

            
            await this.collection.createIndex({
                'recipient.userId': 1,
                status: 1,
                'channels.delivery.inApp.readAt': 1
            });

        } catch (error) {
            console.error('Error creating notification indexes:', error);
        }
    }

    
    async create(notificationData) {
        const now = new Date();

        
        const typeMetadata = getNotificationMetadata(notificationData.type);
        if (!typeMetadata) {
            throw new AppError(
                `Unknown notification type: ${notificationData.type}`,
                'INVALID_NOTIFICATION_TYPE',
                400
            );
        }

        
        const notification = {
            _id: new ObjectId(),
            type: notificationData.type,
            category: typeMetadata.category,
            priority: typeMetadata.priority,
            status: NOTIFICATION_STATUS.CREATED,

            recipient: {
                userId: new ObjectId(notificationData.recipientId),
                role: notificationData.recipientRole,
                name: notificationData.recipientName,
                phone: notificationData.recipientPhone,
                email: notificationData.recipientEmail,
                language: notificationData.language || 'ru',
                preferences: notificationData.preferences || {}
            },

            references: {
                orderId: notificationData.orderId ? new ObjectId(notificationData.orderId) : null,
                paymentId: notificationData.paymentId ? new ObjectId(notificationData.paymentId) : null,
                ...notificationData.references
            },

            content: this.prepareContent(notificationData, typeMetadata),

            channels: this.prepareChannels(notificationData, typeMetadata),

            scheduling: {
                scheduledFor: notificationData.scheduledFor || now,
                sendAfter: notificationData.sendAfter,
                sendBefore: notificationData.sendBefore,
                batch: notificationData.batch || { enabled: false },
                throttle: notificationData.throttle || { enabled: false }
            },

            lifecycle: {
                ttl: getNotificationTTL(notificationData.type),
                expiresAt: this.calculateExpiryDate(notificationData.type, now),
                acknowledgment: {
                    required: requiresAcknowledgment(notificationData.type)
                },
                autoActions: typeMetadata.autoCancel ? {
                    autoCancel: true,
                    autoCancelAfter: typeMetadata.autoCancel
                } : {}
            },

            grouping: {
                groupKey: notificationData.groupKey,
                deduplicationKey: notificationData.deduplicationKey
            },

            metadata: {
                source: notificationData.source || 'system',
                sourceId: notificationData.sourceId,
                version: 1,
                context: notificationData.context || {},
                tags: notificationData.tags || [],
                custom: notificationData.metadata || {}
            },

            audit: {
                createdBy: notificationData.createdBy,
                createdByType: notificationData.createdByType || 'system',
                history: []
            },

            search: {
                searchText: this.generateSearchText(notificationData),
                dateKey: parseInt(now.toISOString().slice(0, 10).replace(/-/g, '')),
                hourKey: now.getHours()
            },

            stats: {
                totalChannels: 0,
                sentChannels: 0,
                deliveredChannels: 0,
                failedChannels: 0,
                processingTime: { total: 0, perChannel: {} },
                engagement: {
                    opened: false,
                    clicked: false,
                    converted: false
                }
            },

            createdAt: now,
            updatedAt: now
        };

        
        notification.stats.totalChannels = notification.channels.filter(ch => ch.enabled).length;

        
        const result = await this.collection.insertOne(notification);
        return { ...notification, _id: result.insertedId };
    }

    
    prepareContent(notificationData, typeMetadata) {
        const { language = 'ru', templateData = {} } = notificationData;

        
        const content = {
            title: {},
            body: {},
            subtitle: {},
            media: typeMetadata.sound ? {
                sound: typeMetadata.sound,
                badge: typeMetadata.badge
            } : {},
            actions: getNotificationActions(notificationData.type),
            data: notificationData.data || {}
        };

        
        ['ru', 'uz', 'en'].forEach(lang => {
            const template = getNotificationTemplate(notificationData.type, 'push', lang);
            if (template) {
                content.title[lang] = this.interpolateTemplate(template.title, templateData);
                content.body[lang] = this.interpolateTemplate(template.body, templateData);
                if (template.subtitle) {
                    content.subtitle[lang] = this.interpolateTemplate(template.subtitle, templateData);
                }
            }
        });

        return content;
    }

    
    prepareChannels(notificationData, typeMetadata) {
        const channels = [];
        const availableChannels = typeMetadata.channels || [];

        
        availableChannels.forEach(channelType => {
            
            const isEnabled = notificationData.preferences?.channels?.[channelType] !== false;

            if (isEnabled) {
                channels.push({
                    type: channelType,
                    enabled: true,
                    status: DELIVERY_STATUS.PENDING,
                    delivery: { [channelType]: {} },
                    attempts: [],
                    settings: {
                        retryEnabled: true,
                        maxRetries: 3,
                        retryDelay: 5000,
                        priority: typeMetadata.priority
                    }
                });
            }
        });

        return channels;
    }

    
    async findByUserId(userId, options = {}) {
        const {
            types = null,
            statuses = null,
            limit = 50,
            offset = 0,
            unreadOnly = false
        } = options;

        const query = {
            'recipient.userId': new ObjectId(userId)
        };

        if (types && types.length > 0) {
            query.type = { $in: types };
        }

        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        if (unreadOnly) {
            query['channels.delivery.inApp.readAt'] = { $exists: false };
        }

        return await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    
    async findForProcessing(limit = 100) {
        const now = new Date();

        const query = {
            status: { $in: [NOTIFICATION_STATUS.CREATED, NOTIFICATION_STATUS.QUEUED] },
            'scheduling.scheduledFor': { $lte: now },
            $or: [
                { 'scheduling.sendBefore': { $exists: false } },
                { 'scheduling.sendBefore': { $gte: now } }
            ],
            'lifecycle.expiresAt': { $gt: now }
        };

        return await this.collection
            .find(query)
            .sort({ priority: -1, createdAt: 1 })
            .limit(limit)
            .toArray();
    }

    
    async updateStatus(notificationId, newStatus, details = {}) {
        const now = new Date();

        const updateData = {
            $set: {
                status: newStatus,
                updatedAt: now
            }
        };

        
        const timestampMap = {
            [NOTIFICATION_STATUS.QUEUED]: 'queuedAt',
            [NOTIFICATION_STATUS.PROCESSING]: 'processingStartedAt',
            [NOTIFICATION_STATUS.SENT]: 'firstSentAt',
            [NOTIFICATION_STATUS.DELIVERED]: 'deliveredAt',
            [NOTIFICATION_STATUS.READ]: 'readAt'
        };

        if (timestampMap[newStatus]) {
            updateData.$set[timestampMap[newStatus]] = now;
        }

        
        updateData.$push = {
            'audit.history': {
                timestamp: now,
                action: 'status_change',
                performedBy: details.performedBy,
                changes: { status: { to: newStatus } }
            }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(notificationId) },
            updateData,
            { returnDocument: 'after' }
        );
    }

    
    async updateChannelStatus(notificationId, channelType, status, details = {}) {
        const now = new Date();

        const updateData = {
            $set: {
                [`channels.$.status`]: status,
                [`channels.$.delivery.${channelType}`]: {
                    ...details,
                    [`${this.getChannelTimestampField(status)}At`]: now
                },
                updatedAt: now
            }
        };

        
        if (details.error) {
            updateData.$push = {
                'channels.$.attempts': {
                    attemptNumber: details.attemptNumber || 1,
                    timestamp: now,
                    status: status,
                    error: details.error
                }
            };
        }

        
        const statsUpdate = {};
        if (status === DELIVERY_STATUS.SENT) {
            statsUpdate['stats.sentChannels'] = 1;
        } else if (status === DELIVERY_STATUS.DELIVERED) {
            statsUpdate['stats.deliveredChannels'] = 1;
        } else if (status === DELIVERY_STATUS.FAILED) {
            statsUpdate['stats.failedChannels'] = 1;
        }

        if (Object.keys(statsUpdate).length > 0) {
            updateData.$inc = statsUpdate;
        }

        return await this.collection.findOneAndUpdate(
            {
                _id: new ObjectId(notificationId),
                'channels.type': channelType
            },
            updateData,
            { returnDocument: 'after' }
        );
    }

    
    async markAsRead(notificationId, userId) {
        const now = new Date();

        return await this.collection.findOneAndUpdate(
            {
                _id: new ObjectId(notificationId),
                'recipient.userId': new ObjectId(userId)
            },
            {
                $set: {
                    status: NOTIFICATION_STATUS.READ,
                    'channels.$[elem].delivery.inApp.readAt': now,
                    'stats.engagement.opened': true,
                    updatedAt: now
                }
            },
            {
                arrayFilters: [{ 'elem.type': NOTIFICATION_CHANNELS.IN_APP }],
                returnDocument: 'after'
            }
        );
    }

    
    async acknowledge(notificationId, userId, method = 'manual') {
        const now = new Date();

        return await this.collection.findOneAndUpdate(
            {
                _id: new ObjectId(notificationId),
                'recipient.userId': new ObjectId(userId),
                'lifecycle.acknowledgment.required': true
            },
            {
                $set: {
                    'lifecycle.acknowledgment.acknowledgedAt': now,
                    'lifecycle.acknowledgment.acknowledgedBy': new ObjectId(userId),
                    'lifecycle.acknowledgment.method': method,
                    updatedAt: now
                }
            },
            { returnDocument: 'after' }
        );
    }

    
    async createBatch(notifications) {
        const batchId = new ObjectId().toString();
        const now = new Date();

        
        const batchNotifications = notifications.map((notification, index) => ({
            ...notification,
            scheduling: {
                ...notification.scheduling,
                batch: {
                    enabled: true,
                    batchId,
                    position: index,
                    totalInBatch: notifications.length
                }
            },
            createdAt: now,
            updatedAt: now
        }));

        const result = await this.collection.insertMany(batchNotifications, {
            ordered: false
        });

        return {
            batchId,
            insertedCount: result.insertedCount,
            insertedIds: result.insertedIds
        };
    }

    

    
    interpolateTemplate(template, data) {
        if (!template) return '';

        return template.replace(/{(\w+)}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    
    calculateExpiryDate(notificationType, createdDate) {
        const ttl = getNotificationTTL(notificationType);
        if (!ttl || ttl === 0) {
            
            return new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
        return new Date(createdDate.getTime() + ttl * 1000);
    }

    
    generateSearchText(notificationData) {
        const parts = [
            notificationData.type,
            notificationData.recipientName,
            notificationData.recipientPhone,
            notificationData.templateData?.orderNumber
        ].filter(Boolean);

        return parts.join(' ');
    }

    
    getChannelTimestampField(status) {
        const map = {
            [DELIVERY_STATUS.SENT]: 'sent',
            [DELIVERY_STATUS.DELIVERED]: 'delivered',
            [DELIVERY_STATUS.FAILED]: 'failed',
            [DELIVERY_STATUS.CLICKED]: 'clicked'
        };

        return map[status] || 'updated';
    }

    
    async getStatistics(filters = {}) {
        const pipeline = [];

        
        const match = {};
        if (filters.userId) {
            match['recipient.userId'] = new ObjectId(filters.userId);
        }
        if (filters.startDate || filters.endDate) {
            match.createdAt = {};
            if (filters.startDate) match.createdAt.$gte = filters.startDate;
            if (filters.endDate) match.createdAt.$lte = filters.endDate;
        }
        if (filters.type) match.type = filters.type;
        if (filters.category) match.category = filters.category;

        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        
        pipeline.push({
            $group: {
                _id: {
                    type: '$type',
                    status: '$status'
                },
                count: { $sum: 1 },
                delivered: {
                    $sum: { $cond: [{ $eq: ['$status', NOTIFICATION_STATUS.DELIVERED] }, 1, 0] }
                },
                read: {
                    $sum: { $cond: [{ $eq: ['$status', NOTIFICATION_STATUS.READ] }, 1, 0] }
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$status', NOTIFICATION_STATUS.FAILED] }, 1, 0] }
                }
            }
        });

        return await this.collection.aggregate(pipeline).toArray();
    }

    
    async cleanupExpired() {
        const now = new Date();

        const result = await this.collection.deleteMany({
            'lifecycle.expiresAt': { $lte: now }
        });

        return {
            deletedCount: result.deletedCount
        };
    }
}


module.exports = {
    NotificationModel,
    NOTIFICATION_STATUS,
    DELIVERY_STATUS,
    FAILURE_REASONS,
    notificationSchema
};