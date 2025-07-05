

'use strict';

const { ObjectId } = require('mongodb');
const { NotificationModel } = require('../../models/notification.model');
const NotificationValidator = require('../../utils/validators/notification.validator');
const {
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_CHANNELS,
    getNotificationMetadata,
    getNotificationTTL,
    isCriticalNotification
} = require('../../utils/constants/notification-types');
const {
    selectBestChannel,
    getUserActiveChannels,
    checkChannelRequirements
} = require('../../utils/constants/notification-channels');
const { USER_ROLES } = require('../../utils/constants/user-roles');
const { AppError } = require('../../utils/errors/app-error');


class NotificationService {
    constructor(fastify) {
        this.fastify = fastify;
        this.config = fastify.config.notification;
        this.mongo = fastify.mongo.db;
        this.redis = fastify.redis;
        this.rabbitmq = fastify.rabbitmq;
        this.logger = fastify.log.child({ service: 'notification' });

        
        this.notificationModel = new NotificationModel(this.mongo);

        
        this.channels = {};
        this.initializeChannels();

        
        this.stats = {
            sent: 0,
            delivered: 0,
            failed: 0,
            processing: 0
        };

        
        this.startQueueProcessors();
    }

    
    initializeChannels() {
        
        if (this.config.channels.push.enabled) {
            const PushService = require('./push.service');
            this.channels.push = new PushService(this.fastify);
        }

        
        if (this.config.channels.sms.enabled) {
            const SMSService = require('./sms.service');
            this.channels.sms = new SMSService(
                this.redis,
                this.logger,
                this.fastify.auditService
            );
        }

        
        if (this.config.channels.email.enabled) {
            const EmailService = require('./email.service');
            this.channels.email = new EmailService(this.fastify);
        }

        
        const TemplateService = require('./template.service');
        this.templateService = new TemplateService(this.redis, this.logger);
        this.templateService.setCacheService(this.fastify.cache);
    }

    
    async sendVerificationStatus(userId, verificationData) {
        const { status, documentType, reason, nextSteps } = verificationData;

        try {
            
            let notificationType;
            switch (status) {
                case 'pending':
                    notificationType = NOTIFICATION_TYPES.DOCUMENTS_VERIFICATION_PENDING;
                    break;
                case 'verified':
                    notificationType = NOTIFICATION_TYPES.DOCUMENTS_VERIFIED;
                    break;
                case 'rejected':
                    notificationType = NOTIFICATION_TYPES.DOCUMENTS_REJECTED;
                    break;
                default:
                    throw new AppError('Invalid verification status', 'INVALID_STATUS', 400);
            }

            
            const user = await this.getUserData(userId);
            if (!user) {
                throw new AppError('User not found', 'USER_NOT_FOUND', 404);
            }

            
            const templateData = {
                userName: user.name.first,
                documentType: this.getDocumentTypeName(documentType, user.language),
                reason: reason || '',
                nextSteps: nextSteps || '',
                supportPhone: this.config.templates.defaultVars.supportPhone
            };

            
            const notification = await this.create({
                type: notificationType,
                recipientId: userId,
                recipientRole: user.role,
                recipientName: `${user.name.first} ${user.name.last}`,
                recipientPhone: user.phone,
                recipientEmail: user.email,
                language: user.language,
                templateData,
                priority: status === 'rejected' ? 'high' : 'normal',
                metadata: {
                    documentType,
                    verificationStatus: status,
                    verificationId: verificationData.verificationId
                }
            });

            return notification;

        } catch (error) {
            this.logger.error({
                userId,
                verificationData,
                error: error.message
            }, 'Failed to send verification status notification');
            throw error;
        }
    }

    
    async create(notificationData) {
        try {
            
            const validation = NotificationValidator.validate(notificationData);
            if (!validation.isValid) {
                throw new AppError(
                    'Invalid notification data',
                    'VALIDATION_ERROR',
                    400,
                    validation.errors
                );
            }

            const normalizedData = validation.normalized || notificationData;

            
            if (!normalizedData.preferences) {
                const user = await this.getUserData(normalizedData.recipientId);
                normalizedData.preferences = user?.notifications;
            }

            
            if (normalizedData.deduplicationKey) {
                const isDuplicate = await this.checkDuplication(normalizedData.deduplicationKey);
                if (isDuplicate) {
                    return { deduplicated: true };
                }
            }

            
            const notification = await this.notificationModel.create(normalizedData);

            
            const priority = this.calculatePriority(notification);

            
            if (priority === 'critical' && !notification.scheduling.scheduledFor) {
                
                await this.processNotification(notification);
            } else {
                
                await this.queueNotification(notification, priority);
            }

            return notification;

        } catch (error) {
            this.logger.error({
                notificationData,
                error: error.message
            }, 'Failed to create notification');
            throw error;
        }
    }

    
    async processNotification(notification) {
        const startTime = Date.now();
        this.stats.processing++;

        try {
            
            await this.notificationModel.updateStatus(
                notification._id,
                'processing'
            );

            
            if (await this.shouldRespectQuietHours(notification)) {
                await this.scheduleAfterQuietHours(notification);
                return;
            }

            
            const channels = await this.selectChannels(notification);
            if (channels.length === 0) {
                throw new AppError('No available channels', 'NO_CHANNELS', 400);
            }

            
            const renderedContent = await this.renderContent(notification, channels);

            
            const results = await this.sendThroughChannels(
                notification,
                channels,
                renderedContent
            );

            
            await this.processDeliveryResults(notification, results);

            
            const processingTime = Date.now() - startTime;
            await this.updateStats(notification._id, { processingTime });

            this.stats.processing--;

            return results;

        } catch (error) {
            this.stats.processing--;

            
            await this.handleProcessingError(notification, error);
            throw error;
        }
    }

    
    async selectChannels(notification) {
        
        const user = await this.getUserData(notification.recipient.userId);
        const activeChannels = getUserActiveChannels(user);

        
        const metadata = getNotificationMetadata(notification.type);
        const allowedChannels = notification.channels || metadata?.channels || [];

        const availableChannels = activeChannels.filter(channel =>
            allowedChannels.includes(channel) &&
            this.channels[channel] 
        );

        
        if (notification.sendToAllChannels) {
            return availableChannels;
        }

        const bestChannel = selectBestChannel(
            notification.type,
            user.notifications,
            availableChannels
        );

        return bestChannel ? [bestChannel] : [];
    }

    
    async renderContent(notification, channels) {
        const rendered = {};

        for (const channel of channels) {
            try {
                
                if (notification.content) {
                    rendered[channel] = this.prepareCustomContent(
                        notification.content,
                        channel,
                        notification.recipient.language
                    );
                } else {
                    
                    rendered[channel] = await this.templateService.renderTemplate(
                        notification.type,
                        channel,
                        {
                            language: notification.recipient.language,
                            variables: notification.references,
                            recipientRole: notification.recipient.role
                        }
                    );
                }
            } catch (error) {
                this.logger.error({
                    notificationId: notification._id,
                    channel,
                    error: error.message
                }, 'Failed to render content');
            }
        }

        return rendered;
    }

    
    async sendThroughChannels(notification, channels, renderedContent) {
        const results = {};

        
        const promises = channels.map(async (channel) => {
            try {
                const content = renderedContent[channel];
                if (!content) {
                    throw new Error('No rendered content');
                }

                const channelService = this.channels[channel];
                if (!channelService) {
                    throw new Error('Channel service not available');
                }

                
                const channelData = this.prepareChannelData(
                    notification,
                    channel,
                    content
                );

                
                const result = await channelService.send(channelData);

                
                await this.notificationModel.updateChannelStatus(
                    notification._id,
                    channel,
                    'sent',
                    {
                        messageId: result.messageId,
                        provider: result.provider,
                        sentAt: new Date()
                    }
                );

                results[channel] = {
                    success: true,
                    result
                };

            } catch (error) {
                results[channel] = {
                    success: false,
                    error: error.message
                };

                await this.notificationModel.updateChannelStatus(
                    notification._id,
                    channel,
                    'failed',
                    {
                        error: {
                            code: error.code || 'UNKNOWN',
                            message: error.message
                        }
                    }
                );
            }
        });

        await Promise.all(promises);

        return results;
    }

    
    prepareChannelData(notification, channel, content) {
        const baseData = {
            userId: notification.recipient.userId,
            type: notification.type,
            priority: notification.priority,
            metadata: {
                notificationId: notification._id,
                ...notification.metadata
            }
        };

        switch (channel) {
            case 'push':
                return {
                    ...baseData,
                    title: content.title,
                    body: content.body,
                    data: content.data || {},
                    badge: content.media?.badge,
                    sound: content.media?.sound,
                    image: content.media?.image,
                    actions: content.actions,
                    ttl: notification.lifecycle.ttl
                };

            case 'sms':
                return {
                    phone: notification.recipient.phone,
                    message: content.body,
                    type: this.mapNotificationTypeToSMS(notification.type),
                    priority: notification.priority,
                    metadata: baseData.metadata
                };

            case 'email':
                return {
                    ...baseData,
                    to: notification.recipient.email,
                    subject: content.subject || content.title,
                    html: content.html,
                    text: content.text || content.body,
                    attachments: content.attachments
                };

            case 'in_app':
                
                return {
                    ...baseData,
                    content
                };

            default:
                return { ...baseData, ...content };
        }
    }

    
    async processDeliveryResults(notification, results) {
        const successChannels = Object.entries(results)
            .filter(([_, result]) => result.success)
            .map(([channel]) => channel);

        const failedChannels = Object.entries(results)
            .filter(([_, result]) => !result.success)
            .map(([channel]) => channel);

        
        let status;
        if (successChannels.length === 0) {
            status = 'failed';
            this.stats.failed++;
        } else if (failedChannels.length === 0) {
            status = 'sent';
            this.stats.sent++;
        } else {
            status = 'partial';
            this.stats.sent++;
        }

        
        await this.notificationModel.updateStatus(notification._id, status, {
            successChannels,
            failedChannels
        });

        
        if (status === 'failed' && notification.priority !== 'low') {
            await this.tryFallbackChannels(notification, failedChannels);
        }

        
        if (notification.metadata.webhookUrl) {
            await this.sendDeliveryWebhook(notification, results);
        }
    }

    
    async tryFallbackChannels(notification, failedChannels) {
        const metadata = getNotificationMetadata(notification.type);
        const fallbackChannels = metadata?.fallbackChannels || [];

        const availableFallbacks = fallbackChannels.filter(channel =>
            !failedChannels.includes(channel) &&
            this.channels[channel]
        );

        if (availableFallbacks.length > 0) {
            this.logger.info({
                notificationId: notification._id,
                fallbackChannels: availableFallbacks
            }, 'Trying fallback channels');

            
            const fallbackNotification = {
                ...notification,
                channels: [availableFallbacks[0]],
                metadata: {
                    ...notification.metadata,
                    isFallback: true,
                    originalChannels: failedChannels
                }
            };

            await this.processNotification(fallbackNotification);
        }
    }

    
    async checkDuplication(key) {
        const lockKey = this.redis.keys.notificationDedup(key);
        const exists = await this.redis.get(lockKey);

        if (exists) {
            return true;
        }

        
        await this.redis.setex(lockKey, 86400, '1');
        return false;
    }

    
    async shouldRespectQuietHours(notification) {
        
        if (notification.priority === 'critical') {
            return false;
        }

        const quietHours = notification.recipient.preferences?.quietHours;
        if (!quietHours?.enabled) {
            return false;
        }

        return NotificationValidator.checkQuietHours(
            quietHours,
            notification.scheduling.scheduledFor || new Date()
        );
    }

    
    async scheduleAfterQuietHours(notification) {
        const quietHours = notification.recipient.preferences.quietHours;
        const now = new Date();

        
        const [endHour, endMinute] = quietHours.end.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0, 0);

        
        if (endTime <= now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        
        await this.notificationModel.collection.updateOne(
            { _id: notification._id },
            {
                $set: {
                    'scheduling.scheduledFor': endTime,
                    'metadata.rescheduledDueToQuietHours': true
                }
            }
        );

        
        await this.queueNotification(
            { ...notification, scheduling: { scheduledFor: endTime } },
            notification.priority
        );
    }

    
    async queueNotification(notification, priority = 'normal') {
        const queueName = `notification_${priority}`;

        await this.rabbitmq.sendToQueue(queueName, {
            notificationId: notification._id.toString(),
            type: notification.type,
            scheduledFor: notification.scheduling.scheduledFor
        }, {
            priority: this.mapPriorityToNumber(priority),
            persistent: true
        });

        
        await this.notificationModel.updateStatus(notification._id, 'queued');
    }

    
    async sendBatch(batchData) {
        const validation = NotificationValidator.validateBatch(batchData);
        if (!validation.isValid) {
            throw new AppError(
                'Invalid batch data',
                'VALIDATION_ERROR',
                400,
                validation.errors
            );
        }

        
        const notifications = batchData.recipients.map(recipient => ({
            ...batchData,
            recipientId: recipient.userId,
            recipientRole: recipient.role,
            recipientName: recipient.name,
            recipientPhone: recipient.phone,
            recipientEmail: recipient.email,
            language: recipient.language || 'ru',
            scheduling: {
                ...batchData.scheduling,
                batch: {
                    enabled: true,
                    batchId: new ObjectId().toString(),
                    totalInBatch: batchData.recipients.length
                }
            }
        }));

        
        const result = await this.notificationModel.createBatch(notifications);

        
        for (const notificationId of Object.values(result.insertedIds)) {
            await this.queueNotification(
                { _id: notificationId, ...batchData },
                batchData.priority || 'normal'
            );
        }

        return result;
    }

    
    async getUserData(userId) {
        const cacheKey = this.redis.keys.userNotificationData(userId);

        
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        
        const user = await this.mongo.collection('users').findOne(
            { _id: new ObjectId(userId) },
            {
                projection: {
                    phone: 1,
                    email: 1,
                    name: 1,
                    language: 1,
                    role: 1,
                    notifications: 1,
                    devices: 1,
                    isPhoneVerified: 1,
                    isEmailVerified: 1
                }
            }
        );

        if (user) {
            
            await this.redis.setex(cacheKey, 300, JSON.stringify(user));
        }

        return user;
    }

    
    async startQueueProcessors() {
        const priorities = ['critical', 'high', 'normal', 'low'];

        for (const priority of priorities) {
            const queueName = `notification_${priority}`;
            const concurrency = this.config.processing.workers[priority] || 1;

            await this.rabbitmq.consume(queueName, async (message) => {
                try {
                    const { notificationId } = message.content;

                    
                    const notification = await this.notificationModel.collection.findOne({
                        _id: new ObjectId(notificationId)
                    });

                    if (!notification) {
                        throw new Error('Notification not found');
                    }

                    
                    if (new Date() > notification.lifecycle.expiresAt) {
                        await this.notificationModel.updateStatus(
                            notification._id,
                            'expired'
                        );
                        message.ack();
                        return;
                    }

                    
                    await this.processNotification(notification);

                    message.ack();

                } catch (error) {
                    this.logger.error({
                        message: message.content,
                        error: error.message
                    }, 'Failed to process queued notification');

                    
                    const retryCount = message.properties.headers?.['x-retry-count'] || 0;
                    if (retryCount < 3) {
                        message.nack(true); 
                    } else {
                        message.nack(false); 
                    }
                }
            }, {
                concurrency
            });
        }
    }

    
    async handleProcessingError(notification, error) {
        this.logger.error({
            notificationId: notification._id,
            type: notification.type,
            error: error.message
        }, 'Notification processing failed');

        await this.notificationModel.updateStatus(
            notification._id,
            'failed',
            {
                error: {
                    code: error.code || 'PROCESSING_ERROR',
                    message: error.message,
                    timestamp: new Date()
                }
            }
        );

        
        if (notification.priority === 'critical') {
            await this.sendCriticalFailureAlert(notification, error);
        }
    }

    

    getDocumentTypeName(type, language = 'ru') {
        const types = {
            passport: { ru: 'Паспорт', uz: 'Pasport', en: 'Passport' },
            license: { ru: 'Водительские права', uz: 'Haydovchilik guvohnomasi', en: 'Driver License' },
            certificate: { ru: 'Сертификат', uz: 'Sertifikat', en: 'Certificate' }
        };

        return types[type]?.[language] || type;
    }

    mapNotificationTypeToSMS(type) {
        const mapping = {
            [NOTIFICATION_TYPES.OTP_CODE]: 'otp',
            [NOTIFICATION_TYPES.ORDER_CREATED]: 'transactional',
            [NOTIFICATION_TYPES.PAYMENT_COMPLETED]: 'transactional',
            [NOTIFICATION_TYPES.PROMO_AVAILABLE]: 'marketing'
        };

        return mapping[type] || 'notification';
    }

    mapPriorityToNumber(priority) {
        const mapping = {
            critical: 3,
            high: 2,
            normal: 1,
            low: 0
        };

        return mapping[priority] || 1;
    }

    calculatePriority(notification) {
        
        if (notification.priority) {
            return notification.priority;
        }

        
        const metadata = getNotificationMetadata(notification.type);
        return metadata?.priority || 'normal';
    }

    prepareCustomContent(content, channel, language) {
        const result = {};

        
        ['title', 'body', 'subtitle'].forEach(field => {
            if (content[field]?.[language]) {
                result[field] = content[field][language];
            }
        });

        
        ['media', 'actions', 'data'].forEach(field => {
            if (content[field]) {
                result[field] = content[field];
            }
        });

        return result;
    }

    async updateStats(notificationId, stats) {
        await this.notificationModel.collection.updateOne(
            { _id: notificationId },
            {
                $set: {
                    'stats.processingTime.total': stats.processingTime,
                    updatedAt: new Date()
                }
            }
        );
    }

    async sendDeliveryWebhook(notification, results) {
        
        
    }

    async sendCriticalFailureAlert(notification, error) {
        
        this.logger.fatal({
            notificationId: notification._id,
            type: notification.type,
            recipient: notification.recipient.userId,
            error: error.message
        }, 'Critical notification failed');

        
    }

    

    async getNotification(notificationId) {
        return await this.notificationModel.collection.findOne({
            _id: new ObjectId(notificationId)
        });
    }

    async getUserNotifications(userId, filters = {}) {
        return await this.notificationModel.findByUserId(userId, filters);
    }

    async markAsRead(notificationId, userId) {
        return await this.notificationModel.markAsRead(notificationId, userId);
    }

    async getStats() {
        return {
            current: this.stats,
            channels: Object.entries(this.channels).reduce((acc, [name, service]) => {
                if (service.getStats) {
                    acc[name] = service.getStats();
                }
                return acc;
            }, {})
        };
    }

    async healthCheck() {
        const checks = {
            service: 'healthy',
            channels: {}
        };

        
        for (const [name, service] of Object.entries(this.channels)) {
            if (service.healthCheck) {
                checks.channels[name] = await service.healthCheck();
            }
        }

        
        checks.queues = await this.rabbitmq.healthCheck();

        return checks;
    }
}

module.exports = NotificationService;