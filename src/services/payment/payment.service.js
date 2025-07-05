

'use strict';

const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const {
    PAYMENT_STATUS,
    PAYMENT_TYPES,
    PAYMENT_METHODS,
    PAYMENT_PROVIDERS,
    PAYMENT_ERROR_CODES,
    CANCELLATION_REASONS,
    PAYMENT_TIMEOUTS,
    STATUS_TRANSITIONS,
    STATUS_GROUPS,
    canTransition,
    isPaymentExpired,
    calculateFee,
    formatAmount
} = require('../../utils/constants/payment-status');
const {
    ORDER_STATUS
} = require('../../utils/constants/order-status');
const {
    CONFIRMATION_TYPES,
    PAYMENT_STAGES
} = require('../../models/payment.model');
const {
    TRANSACTION_DIRECTION,
    ACCOUNT_TYPES
} = require('../../models/transaction.model');
const PaymentError = require('../../utils/errors/payment-error');
const { EVENT_TYPES } = require('../../queues/publishers/event.publisher');


class PaymentService {
    constructor(
        paymentModel,
        transactionModel,
        orderModel,
        walletService,
        commissionService,
        notificationService,
        eventPublisher,
        cacheService,
        auditService,
        redis,
        logger
    ) {
        this.paymentModel = paymentModel;
        this.transactionModel = transactionModel;
        this.orderModel = orderModel;
        this.walletService = walletService;
        this.commissionService = commissionService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
        this.cache = cacheService;
        this.audit = auditService;
        this.redis = redis;
        this.logger = logger;

        
        this.config = {
            
            idempotency: {
                enabled: true,
                ttl: 86400,  
                keyPrefix: 'payment:idempotency:'
            },

            
            security: {
                maxPaymentAttempts: 3,
                fraudCheckEnabled: true,
                requirePinForLargeAmounts: 1000000, 
                doubleSpendProtectionWindow: 5000    
            },

            
            timeouts: {
                ...PAYMENT_TIMEOUTS,
                webhookProcessing: 30000,  
                providerResponse: 60000    
            },

            
            providers: {
                payme: {
                    enabled: true,
                    apiUrl: process.env.PAYME_API_URL,
                    merchantId: process.env.PAYME_MERCHANT_ID,
                    secretKey: process.env.PAYME_SECRET_KEY
                },
                click: {
                    enabled: true,
                    apiUrl: process.env.CLICK_API_URL,
                    merchantId: process.env.CLICK_MERCHANT_ID,
                    secretKey: process.env.CLICK_SECRET_KEY
                }
            },

            
            retry: {
                maxAttempts: 3,
                backoffMultiplier: 2,
                initialDelay: 1000
            }
        };

        
        this.providers = new Map();
        this.initializeProviders();
    }

    
    async createOrderPayment(orderId, paymentData) {
        try {
            
            if (paymentData.idempotencyKey) {
                const existing = await this.checkIdempotency(paymentData.idempotencyKey);
                if (existing) return existing;
            }

            
            const order = await this.orderModel.findById(orderId);
            if (!order) {
                throw PaymentError.orderNotFound(orderId);
            }

            
            if (!this.canCreatePayment(order)) {
                throw PaymentError.invalidOrderStatus(order.status);
            }

            
            if (!this.isValidPaymentMethod(paymentData.method)) {
                throw PaymentError.invalidPaymentMethod(
                    paymentData.method,
                    Object.values(PAYMENT_METHODS)
                );
            }

            
            const amount = this.calculatePaymentAmount(order, paymentData);

            
            await this.validatePaymentLimits(amount, paymentData.method);

            
            const payment = await this.paymentModel.create({
                type: PAYMENT_TYPES.ORDER_PAYMENT,
                status: PAYMENT_STATUS.PENDING,

                references: {
                    orderId: order._id,
                    userId: order.customer.userId,
                    masterId: order.executor?.masterId,
                    stoId: order.executor?.stoId
                },

                amount: {
                    original: {
                        value: amount.original,
                        currency: 'UZS'
                    },
                    breakdown: amount.breakdown,
                    fees: amount.fees,
                    final: {
                        value: amount.final,
                        currency: 'UZS'
                    }
                },

                method: {
                    type: paymentData.method,
                    provider: this.determineProvider(paymentData.method),
                    details: paymentData.methodDetails || {}
                },

                confirmation: {
                    type: this.getConfirmationType(paymentData.method),
                    required: this.isConfirmationRequired(paymentData.method)
                },

                security: {
                    ipAddress: paymentData.ipAddress,
                    deviceFingerprint: paymentData.deviceFingerprint,
                    riskScore: 0 
                },

                metadata: {
                    source: paymentData.source || 'mobile_app',
                    idempotencyKey: paymentData.idempotencyKey,
                    customData: paymentData.metadata
                }
            });

            
            if (paymentData.idempotencyKey) {
                await this.saveIdempotency(paymentData.idempotencyKey, payment);
            }

            
            await this.orderModel.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'payment.paymentId': payment._id,
                        'payment.status': PAYMENT_STATUS.PENDING
                    }
                }
            );

            
            await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_INITIATED, {
                paymentId: payment._id,
                orderId: order._id,
                userId: order.customer.userId,
                amount: amount.final,
                method: paymentData.method
            });

            
            await this.notificationService.sendPaymentNotification(
                order.customer.userId,
                'payment_created',
                { payment, order }
            );

            
            await this.audit.logPayment(
                'PAYMENT_CREATED',
                payment,
                { userId: order.customer.userId },
                'SUCCESS',
                { orderId }
            );

            
            if (paymentData.method === PAYMENT_METHODS.WALLET) {
                
                return await this.processWalletPayment(payment);
            } else if (paymentData.method === PAYMENT_METHODS.CASH) {
                
                return payment;
            } else {
                
                return await this.initiateProviderPayment(payment, paymentData);
            }

        } catch (error) {
            this.logger.error({
                action: 'create_payment_error',
                orderId,
                error: error.message
            }, 'Failed to create payment');

            throw error;
        }
    }

    
    async processWalletPayment(payment) {
        try {
            
            const wallet = await this.walletService.getUserWallet(
                payment.references.userId
            );

            
            const balance = await this.walletService.getBalance(wallet._id);
            if (balance.available.main < payment.amount.final.value) {
                throw PaymentError.insufficientBalance(
                    payment.amount.final.value,
                    balance.available.main
                );
            }

            
            await this.updatePaymentStatus(
                payment._id,
                PAYMENT_STATUS.PROCESSING
            );

            
            const withdrawal = await this.walletService.withdraw(
                wallet._id,
                payment.amount.final.value,
                {
                    paymentId: payment._id,
                    orderId: payment.references.orderId,
                    description: `Оплата заказа ${payment.references.orderId}`
                }
            );

            
            const transaction = await this.createTransaction({
                payment,
                type: PAYMENT_TYPES.ORDER_PAYMENT,
                direction: TRANSACTION_DIRECTION.DEBIT,
                status: PAYMENT_STATUS.COMPLETED,
                amount: payment.amount.final.value,
                source: {
                    type: ACCOUNT_TYPES.WALLET,
                    walletId: wallet._id
                }
            });

            
            payment = await this.completePayment(payment._id, {
                transactionId: transaction._id,
                providerData: {
                    walletId: wallet._id,
                    withdrawalTransactionId: withdrawal.transaction._id
                }
            });

            return payment;

        } catch (error) {
            
            await this.failPayment(payment._id, {
                errorCode: error.code || PAYMENT_ERROR_CODES.PROCESSING_ERROR,
                errorMessage: error.message
            });

            throw error;
        }
    }

    
    async initiateProviderPayment(payment, paymentData) {
        try {
            const provider = this.getProvider(payment.method.provider);
            if (!provider) {
                throw new Error(`Provider ${payment.method.provider} not configured`);
            }

            
            await this.updatePaymentStatus(
                payment._id,
                PAYMENT_STATUS.PROCESSING
            );

            
            const providerResponse = await provider.initiatePayment({
                paymentId: payment.paymentId,
                amount: payment.amount.final.value,
                orderId: payment.references.orderId,
                description: `Order #${payment.references.orderId}`,
                returnUrl: `${process.env.APP_URL}/payment/return/${payment._id}`,
                webhookUrl: `${process.env.API_URL}/webhooks/${payment.method.provider}`,
                metadata: {
                    paymentId: payment._id.toString()
                }
            });

            
            payment = await this.paymentModel.findOneAndUpdate(
                { _id: payment._id },
                {
                    $set: {
                        'providerData.transactionId': providerResponse.transactionId,
                        'providerData.referenceNumber': providerResponse.reference,
                        'providerData.status': providerResponse.status,
                        'providerData.raw': providerResponse
                    }
                },
                { returnDocument: 'after' }
            );

            
            return {
                ...payment.toObject(),
                redirectUrl: providerResponse.redirectUrl,
                paymentUrl: providerResponse.paymentUrl
            };

        } catch (error) {
            await this.failPayment(payment._id, {
                errorCode: PAYMENT_ERROR_CODES.PROVIDER_ERROR,
                errorMessage: error.message
            });

            throw error;
        }
    }

    
    async confirmCashPayment(paymentId, confirmationData) {
        try {
            const payment = await this.paymentModel.findById(paymentId);
            if (!payment) {
                throw PaymentError.paymentNotFound(paymentId);
            }

            
            if (payment.method.type !== PAYMENT_METHODS.CASH) {
                throw new Error('Payment method is not cash');
            }

            if (payment.status !== PAYMENT_STATUS.PENDING &&
                payment.status !== PAYMENT_STATUS.WAITING_CONFIRMATION) {
                throw PaymentError.invalidPaymentStatus(payment.status);
            }

            
            payment = await this.paymentModel.confirmPayment(paymentId, {
                confirmedBy: confirmationData.masterId,
                location: confirmationData.location,
                signature: confirmationData.signature
            });

            
            const transaction = await this.createTransaction({
                payment,
                type: PAYMENT_TYPES.ORDER_PAYMENT,
                direction: TRANSACTION_DIRECTION.DEBIT,
                status: PAYMENT_STATUS.COMPLETED,
                amount: payment.amount.final.value,
                source: {
                    type: ACCOUNT_TYPES.EXTERNAL,
                    external: {
                        method: PAYMENT_METHODS.CASH
                    }
                }
            });

            
            payment = await this.completePayment(payment._id, {
                transactionId: transaction._id,
                confirmedBy: confirmationData.masterId
            });

            return payment;

        } catch (error) {
            this.logger.error({
                action: 'confirm_cash_payment_error',
                paymentId,
                error: error.message
            }, 'Failed to confirm cash payment');

            throw error;
        }
    }

    
    async processProviderWebhook(provider, webhookData, signature) {
        try {
            
            const providerInstance = this.getProvider(provider);
            if (!providerInstance) {
                throw new Error(`Unknown provider: ${provider}`);
            }

            const isValid = await providerInstance.verifyWebhookSignature(
                webhookData,
                signature
            );

            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            
            const paymentId = webhookData.metadata?.paymentId ||
                webhookData.merchantTransactionId;

            const payment = await this.paymentModel.findOne({
                $or: [
                    { _id: new ObjectId(paymentId) },
                    { 'providerData.transactionId': webhookData.transactionId }
                ]
            });

            if (!payment) {
                this.logger.warn({
                    action: 'webhook_payment_not_found',
                    provider,
                    webhookData
                }, 'Payment not found for webhook');
                return;
            }

            
            await this.paymentModel.updateOne(
                { _id: payment._id },
                {
                    $push: {
                        'providerData.callbacks': {
                            timestamp: new Date(),
                            type: 'webhook',
                            data: webhookData,
                            signature,
                            verified: true
                        }
                    }
                }
            );

            
            switch (webhookData.status) {
                case 'success':
                case 'completed':
                    await this.handleProviderSuccess(payment, webhookData);
                    break;

                case 'failed':
                case 'error':
                    await this.handleProviderFailure(payment, webhookData);
                    break;

                case 'cancelled':
                    await this.handleProviderCancellation(payment, webhookData);
                    break;

                case 'pending':
                case 'processing':
                    
                    break;

                default:
                    this.logger.warn({
                        action: 'unknown_webhook_status',
                        status: webhookData.status,
                        paymentId: payment._id
                    }, 'Unknown webhook status');
            }

        } catch (error) {
            this.logger.error({
                action: 'process_webhook_error',
                provider,
                error: error.message
            }, 'Failed to process webhook');

            throw error;
        }
    }

    
    async cancelPayment(paymentId, reason, cancelledBy) {
        try {
            const payment = await this.paymentModel.findById(paymentId);
            if (!payment) {
                throw PaymentError.paymentNotFound(paymentId);
            }

            
            if (STATUS_GROUPS.FINAL.includes(payment.status)) {
                throw PaymentError.cannotCancelFinalStatus(payment.status);
            }

            
            const updatedPayment = await this.updatePaymentStatus(
                paymentId,
                PAYMENT_STATUS.CANCELLED,
                {
                    reason,
                    cancelledBy
                }
            );

            
            if (payment.providerData?.transactionId &&
                payment.method.provider !== PAYMENT_PROVIDERS.INTERNAL) {

                try {
                    const provider = this.getProvider(payment.method.provider);
                    await provider.cancelPayment(payment.providerData.transactionId);
                } catch (error) {
                    this.logger.error({
                        action: 'provider_cancel_error',
                        paymentId,
                        error: error.message
                    }, 'Failed to cancel at provider');
                }
            }

            
            if (payment.references.walletIds?.source) {
                
            }

            
            if (payment.references.orderId) {
                await this.orderModel.updateOne(
                    { _id: payment.references.orderId },
                    {
                        $set: {
                            'payment.status': PAYMENT_STATUS.CANCELLED,
                            'payment.cancelledAt': new Date()
                        }
                    }
                );
            }

            
            await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_CANCELLED, {
                paymentId: payment._id,
                orderId: payment.references.orderId,
                reason,
                cancelledBy
            });

            
            await this.notificationService.sendPaymentNotification(
                payment.references.userId,
                'payment_cancelled',
                { payment: updatedPayment, reason }
            );

            
            await this.audit.logPayment(
                'PAYMENT_CANCELLED',
                updatedPayment,
                { userId: cancelledBy },
                'CANCELLED',
                { reason }
            );

            return updatedPayment;

        } catch (error) {
            this.logger.error({
                action: 'cancel_payment_error',
                paymentId,
                error: error.message
            }, 'Failed to cancel payment');

            throw error;
        }
    }

    
    async createRefund(paymentId, refundData) {
        try {
            const payment = await this.paymentModel.findById(paymentId);
            if (!payment) {
                throw PaymentError.paymentNotFound(paymentId);
            }

            
            if (payment.status !== PAYMENT_STATUS.COMPLETED) {
                throw PaymentError.cannotRefundIncompletePayment(payment.status);
            }

            
            const refundPeriod = this.config.timeouts.REFUND_PERIOD;
            if (Date.now() - payment.timestamps.completedAt > refundPeriod) {
                throw PaymentError.refundPeriodExpired(
                    payment.timestamps.completedAt,
                    refundPeriod / (24 * 60 * 60 * 1000)
                );
            }

            
            const refund = await this.paymentModel.createRefund(paymentId, refundData);

            
            if (payment.method.type === PAYMENT_METHODS.WALLET) {
                await this.processWalletRefund(payment, refund);
            } else if (payment.method.type === PAYMENT_METHODS.CASH) {
                
                refund.status = 'manual_required';
            } else {
                
                await this.processProviderRefund(payment, refund);
            }

            
            await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_REFUNDED, {
                paymentId: payment._id,
                refundId: refund.refundId,
                amount: refund.amount,
                reason: refund.reason
            });

            
            await this.notificationService.sendPaymentNotification(
                payment.references.userId,
                'refund_initiated',
                { payment, refund }
            );

            return refund;

        } catch (error) {
            this.logger.error({
                action: 'create_refund_error',
                paymentId,
                error: error.message
            }, 'Failed to create refund');

            throw error;
        }
    }

    
    async getPayment(paymentId) {
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) {
            throw PaymentError.paymentNotFound(paymentId);
        }

        
        const enriched = payment.toObject();

        
        if (payment.references.transactions?.main) {
            enriched.transaction = await this.transactionModel.findById(
                payment.references.transactions.main
            );
        }

        
        if (payment.status === PAYMENT_STATUS.PENDING) {
            enriched.isExpired = isPaymentExpired(
                payment.timestamps.createdAt,
                'CARD_PAYMENT'
            );
        }

        return enriched;
    }

    
    async getPayments(filters = {}, options = {}) {
        const {
            userId,
            orderId,
            status,
            method,
            dateFrom,
            dateTo,
            minAmount,
            maxAmount
        } = filters;

        const {
            limit = 50,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = -1
        } = options;

        const query = {};

        if (userId) query['references.userId'] = new ObjectId(userId);
        if (orderId) query['references.orderId'] = new ObjectId(orderId);
        if (status) query.status = Array.isArray(status) ? { $in: status } : status;
        if (method) query['method.type'] = method;

        if (dateFrom || dateTo) {
            query['timestamps.createdAt'] = {};
            if (dateFrom) query['timestamps.createdAt'].$gte = new Date(dateFrom);
            if (dateTo) query['timestamps.createdAt'].$lte = new Date(dateTo);
        }

        if (minAmount || maxAmount) {
            query['amount.final.value'] = {};
            if (minAmount) query['amount.final.value'].$gte = minAmount;
            if (maxAmount) query['amount.final.value'].$lte = maxAmount;
        }

        const payments = await this.paymentModel.collection
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(offset)
            .limit(limit)
            .toArray();

        const total = await this.paymentModel.collection.countDocuments(query);

        return {
            payments,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + payments.length < total
            }
        };
    }

    
    async retryPayment(paymentId) {
        try {
            const payment = await this.paymentModel.findById(paymentId);
            if (!payment) {
                throw PaymentError.paymentNotFound(paymentId);
            }

            
            if (!payment.isRetryable || !payment.isRetryable()) {
                throw new Error('Payment is not retryable');
            }

            
            await this.paymentModel.updateOne(
                { _id: payment._id },
                {
                    $inc: { 'processing.attempts': 1 },
                    $set: {
                        'processing.lastAttemptAt': new Date(),
                        status: PAYMENT_STATUS.PROCESSING
                    }
                }
            );

            
            if (payment.method.provider !== PAYMENT_PROVIDERS.INTERNAL) {
                await this.retryProviderPayment(payment);
            } else if (payment.method.type === PAYMENT_METHODS.WALLET) {
                await this.processWalletPayment(payment);
            }

            return await this.paymentModel.findById(paymentId);

        } catch (error) {
            
            const nextRetryAt = this.calculateNextRetryTime(
                payment.processing.attempts + 1
            );

            await this.paymentModel.updateOne(
                { _id: payment._id },
                {
                    $set: {
                        status: PAYMENT_STATUS.PENDING,
                        'processing.nextRetryAt': nextRetryAt
                    },
                    $push: {
                        'processing.history': {
                            attemptNumber: payment.processing.attempts + 1,
                            timestamp: new Date(),
                            result: 'failed',
                            error: {
                                code: error.code || 'RETRY_FAILED',
                                message: error.message
                            }
                        }
                    }
                }
            );

            throw error;
        }
    }

    
    async processExpiredPayments() {
        try {
            const expiredPayments = await this.paymentModel.collection.find({
                status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
                'timestamps.createdAt': {
                    $lt: new Date(Date.now() - this.config.timeouts.CARD_PAYMENT)
                },
                'flags.isTest': false
            }).limit(100).toArray();

            const results = {
                processed: 0,
                failed: 0,
                errors: []
            };

            for (const payment of expiredPayments) {
                try {
                    await this.expirePayment(payment._id);
                    results.processed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        paymentId: payment._id,
                        error: error.message
                    });
                }
            }

            this.logger.info({
                action: 'process_expired_payments',
                results
            }, 'Processed expired payments');

            return results;

        } catch (error) {
            this.logger.error({
                action: 'process_expired_payments_error',
                error: error.message
            }, 'Failed to process expired payments');

            throw error;
        }
    }

    

    
    canCreatePayment(order) {
        const allowedStatuses = [
            ORDER_STATUS.NEW,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.ACCEPTED
        ];

        return allowedStatuses.includes(order.status) &&
            (!order.payment?.status ||
                order.payment.status === PAYMENT_STATUS.CANCELLED ||
                order.payment.status === PAYMENT_STATUS.FAILED);
    }

    
    isValidPaymentMethod(method) {
        return Object.values(PAYMENT_METHODS).includes(method);
    }

    
    determineProvider(method) {
        const providerMap = {
            [PAYMENT_METHODS.CASH]: PAYMENT_PROVIDERS.INTERNAL,
            [PAYMENT_METHODS.WALLET]: PAYMENT_PROVIDERS.INTERNAL,
            [PAYMENT_METHODS.PAYME]: PAYMENT_PROVIDERS.PAYME,
            [PAYMENT_METHODS.CLICK]: PAYMENT_PROVIDERS.CLICK,
            [PAYMENT_METHODS.CARD]: PAYMENT_PROVIDERS.PAYME 
        };

        return providerMap[method] || PAYMENT_PROVIDERS.INTERNAL;
    }

    
    getConfirmationType(method) {
        const confirmationMap = {
            [PAYMENT_METHODS.CASH]: CONFIRMATION_TYPES.MANUAL,
            [PAYMENT_METHODS.CARD]: CONFIRMATION_TYPES.AUTOMATIC,
            [PAYMENT_METHODS.WALLET]: CONFIRMATION_TYPES.NONE
        };

        return confirmationMap[method] || CONFIRMATION_TYPES.AUTOMATIC;
    }

    
    isConfirmationRequired(method) {
        return method === PAYMENT_METHODS.CASH;
    }

    
    calculatePaymentAmount(order, paymentData) {
        const amount = {
            original: order.pricing.calculation.total,
            breakdown: { ...order.pricing.calculation },
            fees: {
                platform: { amount: 0, percentage: 0 },
                provider: { amount: 0, percentage: 0 },
                total: 0
            },
            final: order.pricing.calculation.total
        };

        
        if (paymentData.method !== PAYMENT_METHODS.CASH &&
            paymentData.method !== PAYMENT_METHODS.WALLET) {

            const providerFee = calculateFee(
                amount.original,
                PAYMENT_TYPES.ORDER_PAYMENT,
                paymentData.method
            );

            if (paymentData.feePayedByCustomer) {
                amount.fees.provider.amount = providerFee;
                amount.fees.total = providerFee;
                amount.final += providerFee;
            }
        }

        return amount;
    }

    
    async validatePaymentLimits(amount, method) {
        
        return true;
    }

    
    async updatePaymentStatus(paymentId, newStatus, details = {}) {
        const payment = await this.paymentModel.updateStatus(
            paymentId,
            newStatus,
            details
        );

        
        await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_STATUS_CHANGED, {
            paymentId,
            oldStatus: payment.status,
            newStatus,
            details
        });

        return payment;
    }

    
    async completePayment(paymentId, completionData) {
        const payment = await this.updatePaymentStatus(
            paymentId,
            PAYMENT_STATUS.COMPLETED,
            completionData
        );

        
        if (payment.references.orderId) {
            await this.commissionService.processOrderCommission(
                payment.references.orderId,
                payment.amount.final.value,
                payment.references.masterId,
                payment.references.stoId
            );
        }

        
        await this.orderModel.updateOne(
            { _id: payment.references.orderId },
            {
                $set: {
                    'payment.status': PAYMENT_STATUS.COMPLETED,
                    'payment.completedAt': new Date(),
                    'payment.transactionId': completionData.transactionId
                }
            }
        );

        
        await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_COMPLETED, {
            paymentId: payment._id,
            orderId: payment.references.orderId,
            amount: payment.amount.final.value
        });

        
        await this.notificationService.sendPaymentNotification(
            payment.references.userId,
            'payment_completed',
            { payment }
        );

        
        await this.audit.logPayment(
            'PAYMENT_COMPLETED',
            payment,
            { system: true },
            'SUCCESS',
            completionData
        );

        return payment;
    }

    
    async failPayment(paymentId, failureData) {
        const payment = await this.updatePaymentStatus(
            paymentId,
            PAYMENT_STATUS.FAILED,
            failureData
        );

        
        if (payment.references.orderId) {
            await this.orderModel.updateOne(
                { _id: payment.references.orderId },
                {
                    $set: {
                        'payment.status': PAYMENT_STATUS.FAILED,
                        'payment.failedAt': new Date(),
                        'payment.failureReason': failureData.errorMessage
                    }
                }
            );
        }

        
        await this.eventPublisher.publish(EVENT_TYPES.PAYMENT_FAILED, {
            paymentId: payment._id,
            orderId: payment.references.orderId,
            errorCode: failureData.errorCode,
            errorMessage: failureData.errorMessage
        });

        
        await this.notificationService.sendPaymentNotification(
            payment.references.userId,
            'payment_failed',
            { payment, error: failureData }
        );

        return payment;
    }

    
    async expirePayment(paymentId) {
        return await this.updatePaymentStatus(
            paymentId,
            PAYMENT_STATUS.EXPIRED,
            { reason: 'timeout' }
        );
    }

    
    async createTransaction(data) {
        return await this.transactionModel.create({
            type: data.type,
            status: data.status,
            amount: {
                value: data.amount,
                currency: 'UZS'
            },
            source: data.source,
            destination: data.destination || {
                type: ACCOUNT_TYPES.SYSTEM,
                systemId: 'revenue'
            },
            references: {
                orderId: data.payment.references.orderId,
                userId: data.payment.references.userId,
                paymentId: data.payment._id
            },
            paymentDetails: {
                method: data.payment.method.type,
                provider: {
                    name: data.payment.method.provider,
                    transactionId: data.payment.providerData?.transactionId
                }
            }
        });
    }

    
    async handleProviderSuccess(payment, webhookData) {
        
        const transaction = await this.createTransaction({
            payment,
            type: PAYMENT_TYPES.ORDER_PAYMENT,
            direction: TRANSACTION_DIRECTION.DEBIT,
            status: PAYMENT_STATUS.COMPLETED,
            amount: payment.amount.final.value,
            source: {
                type: ACCOUNT_TYPES.EXTERNAL,
                external: {
                    method: payment.method.type,
                    provider: payment.method.provider
                }
            }
        });

        
        await this.completePayment(payment._id, {
            transactionId: transaction._id,
            providerData: webhookData
        });
    }

    
    async handleProviderFailure(payment, webhookData) {
        await this.failPayment(payment._id, {
            errorCode: webhookData.errorCode || PAYMENT_ERROR_CODES.PROVIDER_ERROR,
            errorMessage: webhookData.errorMessage || 'Provider payment failed',
            providerData: webhookData
        });
    }

    
    async handleProviderCancellation(payment, webhookData) {
        await this.cancelPayment(
            payment._id,
            webhookData.reason || CANCELLATION_REASONS.USER_CANCELLED,
            'provider'
        );
    }

    
    async processWalletRefund(payment, refund) {
        const wallet = await this.walletService.getUserWallet(
            payment.references.userId
        );

        await this.walletService.deposit(
            wallet._id,
            refund.amount,
            {
                type: PAYMENT_TYPES.REFUND,
                paymentId: payment._id,
                refundId: refund.refundId,
                description: `Возврат по заказу ${payment.references.orderId}`
            }
        );

        refund.status = 'completed';
        refund.processedAt = new Date();
    }

    
    async processProviderRefund(payment, refund) {
        const provider = this.getProvider(payment.method.provider);

        const providerResponse = await provider.createRefund({
            transactionId: payment.providerData.transactionId,
            amount: refund.amount,
            reason: refund.reason
        });

        refund.providerData = {
            refundId: providerResponse.refundId,
            status: providerResponse.status
        };

        if (providerResponse.status === 'completed') {
            refund.status = 'completed';
            refund.processedAt = new Date();
        }
    }

    
    async retryProviderPayment(payment) {
        const provider = this.getProvider(payment.method.provider);

        const status = await provider.checkPaymentStatus(
            payment.providerData.transactionId
        );

        if (status.status === 'completed') {
            await this.handleProviderSuccess(payment, status);
        } else if (status.status === 'failed') {
            await this.handleProviderFailure(payment, status);
        }
    }

    
    calculateNextRetryTime(attemptNumber) {
        const delay = Math.min(
            this.config.retry.initialDelay *
            Math.pow(this.config.retry.backoffMultiplier, attemptNumber - 1),
            300000 
        );

        return new Date(Date.now() + delay);
    }

    
    async checkIdempotency(key) {
        const cached = await this.redis.get(
            `${this.config.idempotency.keyPrefix}${key}`
        );

        return cached ? JSON.parse(cached) : null;
    }

    
    async saveIdempotency(key, payment) {
        await this.redis.setex(
            `${this.config.idempotency.keyPrefix}${key}`,
            this.config.idempotency.ttl,
            JSON.stringify(payment)
        );
    }

    
    initializeProviders() {
        
        
        
    }

    
    getProvider(providerName) {
        return this.providers.get(providerName);
    }

    
    generateWebhookSignature(data, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(data))
            .digest('hex');
    }
}

module.exports = PaymentService;