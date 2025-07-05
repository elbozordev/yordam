// src/services/notification/notification.service.js

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

/**
 * Основной сервис уведомлений
 * Координирует работу всех каналов и управляет жизненным циклом уведомлений
 */
class NotificationService {
    constructor(fastify) {
        this.fastify = fastify;
        this.config = fastify.config.notification;
        this.mongo = fastify.mongo.db;
        this.redis = fastify.redis;
        this.rabbitmq = fastify.rabbitmq;
        this.logger = fastify.log.child({ service: 'notification' });

        // Инициализация моделей
        this.notificationModel = new NotificationModel(this.mongo);

        // Инициализация сервисов каналов
        this.channels = {};
        this.initializeChannels();

        // Статистика
        this.stats = {
            sent: 0,
            delivered: 0,
            failed: 0,
            processing: 0
        };

        // Запуск обработчиков очередей
        this.startQueueProcessors();
    }

    /**
     * Инициализация каналов доставки
     */
    initializeChannels() {
        // Push
        if (this.config.channels.push.enabled) {
            const PushService = require('./push.service');
            this.channels.push = new PushService(this.fastify);
        }

        // SMS
        if (this.config.channels.sms.enabled) {
            const SMSService = require('./sms.service');
            this.channels.sms = new SMSService(
                this.redis,
                this.logger,
                this.fastify.auditService
            );
        }

        // Email
        if (this.config.channels.email.enabled) {
            const EmailService = require('./email.service');
            this.channels.email = new EmailService(this.fastify);
        }

        // Template service
        const TemplateService = require('./template.service');
        this.templateService = new TemplateService(this.redis, this.logger);
        this.templateService.setCacheService(this.fastify.cache);
    }

    /**
     * Отправка уведомления о статусе верификации
     */
    async sendVerificationStatus(userId, verificationData) {
        const { status, documentType, reason, nextSteps } = verificationData;

        try {
            // Определяем тип уведомления
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

            // Получаем данные пользователя
            const user = await this.getUserData(userId);
            if (!user) {
                throw new AppError('User not found', 'USER_NOT_FOUND', 404);
            }

            // Подготавливаем данные для шаблона
            const templateData = {
                userName: user.name.first,
                documentType: this.getDocumentTypeName(documentType, user.language),
                reason: reason || '',
                nextSteps: nextSteps || '',
                supportPhone: this.config.templates.defaultVars.supportPhone
            };

            // Создаем уведомление
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

    /**
     * Создание и отправка уведомления
     */
    async create(notificationData) {
        try {
            // Валидация
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

            // Получаем данные пользователя если не переданы
            if (!normalizedData.preferences) {
                const user = await this.getUserData(normalizedData.recipientId);
                normalizedData.preferences = user?.notifications;
            }

            // Проверяем дедупликацию
            if (normalizedData.deduplicationKey) {
                const isDuplicate = await this.checkDuplication(normalizedData.deduplicationKey);
                if (isDuplicate) {
                    return { deduplicated: true };
                }
            }

            // Создаем запись в БД
            const notification = await this.notificationModel.create(normalizedData);

            // Определяем приоритет обработки
            const priority = this.calculatePriority(notification);

            // Отправляем в очередь или обрабатываем сразу
            if (priority === 'critical' && !notification.scheduling.scheduledFor) {
                // Критичные уведомления обрабатываем сразу
                await this.processNotification(notification);
            } else {
                // Остальные через очередь
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

    /**
     * Обработка уведомления
     */
    async processNotification(notification) {
        const startTime = Date.now();
        this.stats.processing++;

        try {
            // Обновляем статус
            await this.notificationModel.updateStatus(
                notification._id,
                'processing'
            );

            // Проверяем тихие часы
            if (await this.shouldRespectQuietHours(notification)) {
                await this.scheduleAfterQuietHours(notification);
                return;
            }

            // Определяем каналы для отправки
            const channels = await this.selectChannels(notification);
            if (channels.length === 0) {
                throw new AppError('No available channels', 'NO_CHANNELS', 400);
            }

            // Рендерим контент для каждого канала
            const renderedContent = await this.renderContent(notification, channels);

            // Отправляем через каналы
            const results = await this.sendThroughChannels(
                notification,
                channels,
                renderedContent
            );

            // Обрабатываем результаты
            await this.processDeliveryResults(notification, results);

            // Обновляем статистику
            const processingTime = Date.now() - startTime;
            await this.updateStats(notification._id, { processingTime });

            this.stats.processing--;

            return results;

        } catch (error) {
            this.stats.processing--;

            // Обработка ошибок
            await this.handleProcessingError(notification, error);
            throw error;
        }
    }

    /**
     * Выбор каналов для отправки
     */
    async selectChannels(notification) {
        // Получаем доступные каналы пользователя
        const user = await this.getUserData(notification.recipient.userId);
        const activeChannels = getUserActiveChannels(user);

        // Фильтруем по настройкам уведомления
        const metadata = getNotificationMetadata(notification.type);
        const allowedChannels = notification.channels || metadata?.channels || [];

        const availableChannels = activeChannels.filter(channel =>
            allowedChannels.includes(channel) &&
            this.channels[channel] // Проверяем что канал инициализирован
        );

        // Выбираем оптимальный канал или все если указано
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

    /**
     * Рендеринг контента для каналов
     */
    async renderContent(notification, channels) {
        const rendered = {};

        for (const channel of channels) {
            try {
                // Если есть кастомный контент
                if (notification.content) {
                    rendered[channel] = this.prepareCustomContent(
                        notification.content,
                        channel,
                        notification.recipient.language
                    );
                } else {
                    // Используем шаблон
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

    /**
     * Отправка через каналы
     */
    async sendThroughChannels(notification, channels, renderedContent) {
        const results = {};

        // Параллельная отправка через все каналы
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

                // Подготавливаем данные для канала
                const channelData = this.prepareChannelData(
                    notification,
                    channel,
                    content
                );

                // Отправляем
                const result = await channelService.send(channelData);

                // Обновляем статус канала
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

    /**
     * Подготовка данных для канала
     */
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
                // In-app сохраняется в БД, отправка через WebSocket
                return {
                    ...baseData,
                    content
                };

            default:
                return { ...baseData, ...content };
        }
    }

    /**
     * Обработка результатов доставки
     */
    async processDeliveryResults(notification, results) {
        const successChannels = Object.entries(results)
            .filter(([_, result]) => result.success)
            .map(([channel]) => channel);

        const failedChannels = Object.entries(results)
            .filter(([_, result]) => !result.success)
            .map(([channel]) => channel);

        // Определяем общий статус
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

        // Обновляем статус уведомления
        await this.notificationModel.updateStatus(notification._id, status, {
            successChannels,
            failedChannels
        });

        // Если все каналы не сработали, пробуем fallback
        if (status === 'failed' && notification.priority !== 'low') {
            await this.tryFallbackChannels(notification, failedChannels);
        }

        // Отправляем вебхук если настроен
        if (notification.metadata.webhookUrl) {
            await this.sendDeliveryWebhook(notification, results);
        }
    }

    /**
     * Попытка отправки через резервные каналы
     */
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

            // Пробуем первый доступный fallback
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

    /**
     * Проверка дедупликации
     */
    async checkDuplication(key) {
        const lockKey = this.redis.keys.notificationDedup(key);
        const exists = await this.redis.get(lockKey);

        if (exists) {
            return true;
        }

        // Устанавливаем ключ на 24 часа
        await this.redis.setex(lockKey, 86400, '1');
        return false;
    }

    /**
     * Проверка тихих часов
     */
    async shouldRespectQuietHours(notification) {
        // Критичные уведомления игнорируют тихие часы
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

    /**
     * Планирование после тихих часов
     */
    async scheduleAfterQuietHours(notification) {
        const quietHours = notification.recipient.preferences.quietHours;
        const now = new Date();

        // Вычисляем время окончания тихих часов
        const [endHour, endMinute] = quietHours.end.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0, 0);

        // Если уже прошло время окончания, переносим на завтра
        if (endTime <= now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        // Обновляем расписание
        await this.notificationModel.collection.updateOne(
            { _id: notification._id },
            {
                $set: {
                    'scheduling.scheduledFor': endTime,
                    'metadata.rescheduledDueToQuietHours': true
                }
            }
        );

        // Добавляем обратно в очередь
        await this.queueNotification(
            { ...notification, scheduling: { scheduledFor: endTime } },
            notification.priority
        );
    }

    /**
     * Добавление в очередь
     */
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

        // Обновляем статус
        await this.notificationModel.updateStatus(notification._id, 'queued');
    }

    /**
     * Массовая отправка уведомлений
     */
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

        // Создаем батч уведомлений
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

        // Создаем уведомления в БД
        const result = await this.notificationModel.createBatch(notifications);

        // Отправляем в очередь для обработки
        for (const notificationId of Object.values(result.insertedIds)) {
            await this.queueNotification(
                { _id: notificationId, ...batchData },
                batchData.priority || 'normal'
            );
        }

        return result;
    }

    /**
     * Получение данных пользователя
     */
    async getUserData(userId) {
        const cacheKey = this.redis.keys.userNotificationData(userId);

        // Проверяем кэш
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Получаем из БД
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
            // Кэшируем на 5 минут
            await this.redis.setex(cacheKey, 300, JSON.stringify(user));
        }

        return user;
    }

    /**
     * Обработчики очередей
     */
    async startQueueProcessors() {
        const priorities = ['critical', 'high', 'normal', 'low'];

        for (const priority of priorities) {
            const queueName = `notification_${priority}`;
            const concurrency = this.config.processing.workers[priority] || 1;

            await this.rabbitmq.consume(queueName, async (message) => {
                try {
                    const { notificationId } = message.content;

                    // Получаем уведомление из БД
                    const notification = await this.notificationModel.collection.findOne({
                        _id: new ObjectId(notificationId)
                    });

                    if (!notification) {
                        throw new Error('Notification not found');
                    }

                    // Проверяем не истекло ли
                    if (new Date() > notification.lifecycle.expiresAt) {
                        await this.notificationModel.updateStatus(
                            notification._id,
                            'expired'
                        );
                        message.ack();
                        return;
                    }

                    // Обрабатываем
                    await this.processNotification(notification);

                    message.ack();

                } catch (error) {
                    this.logger.error({
                        message: message.content,
                        error: error.message
                    }, 'Failed to process queued notification');

                    // Retry или DLQ
                    const retryCount = message.properties.headers?.['x-retry-count'] || 0;
                    if (retryCount < 3) {
                        message.nack(true); // requeue
                    } else {
                        message.nack(false); // to DLQ
                    }
                }
            }, {
                concurrency
            });
        }
    }

    /**
     * Обработка ошибок
     */
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

        // Алерт для критичных уведомлений
        if (notification.priority === 'critical') {
            await this.sendCriticalFailureAlert(notification, error);
        }
    }

    /**
     * Вспомогательные методы
     */

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
        // Если явно указан приоритет
        if (notification.priority) {
            return notification.priority;
        }

        // Определяем по типу
        const metadata = getNotificationMetadata(notification.type);
        return metadata?.priority || 'normal';
    }

    prepareCustomContent(content, channel, language) {
        const result = {};

        // Копируем локализованные поля
        ['title', 'body', 'subtitle'].forEach(field => {
            if (content[field]?.[language]) {
                result[field] = content[field][language];
            }
        });

        // Копируем остальные поля
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
        // Реализация webhook вызовов
        // TODO: Implement webhook delivery
    }

    async sendCriticalFailureAlert(notification, error) {
        // Отправка алертов админам о критичных ошибках
        this.logger.fatal({
            notificationId: notification._id,
            type: notification.type,
            recipient: notification.recipient.userId,
            error: error.message
        }, 'Critical notification failed');

        // TODO: Implement admin alerts
    }

    /**
     * API методы
     */

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

        // Проверяем каналы
        for (const [name, service] of Object.entries(this.channels)) {
            if (service.healthCheck) {
                checks.channels[name] = await service.healthCheck();
            }
        }

        // Проверяем очереди
        checks.queues = await this.rabbitmq.healthCheck();

        return checks;
    }
}

module.exports = NotificationService;