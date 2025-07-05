

'use strict';

const { ObjectId } = require('mongodb');
const {
    WALLET_TYPES,
    WALLET_STATUS,
    BALANCE_TYPES,
    HOLD_REASONS
} = require('../../models/wallet.model');
const {
    PAYMENT_TYPES,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    PAYMENT_FEES,
    calculateFee
} = require('../../utils/constants/payment-status');
const { USER_ROLES } = require('../../utils/constants/user-roles');
const PaymentError = require('../../utils/errors/payment-error');
const PaymentValidator = require('../../utils/validators/payment.validator');


class WalletService {
    constructor(walletModel, transactionModel, paymentModel, cacheService, auditService, redis, logger) {
        this.walletModel = walletModel;
        this.transactionModel = transactionModel;
        this.paymentModel = paymentModel;
        this.cache = cacheService;
        this.audit = auditService;
        this.redis = redis;
        this.logger = logger;

        
        this.config = {
            
            redisKeys: {
                balance: (walletId) => `wallet:${walletId}:balance`,
                lock: (walletId) => `wallet:${walletId}:lock`,
                dailyLimit: (walletId, type) => `wallet:${walletId}:limit:${type}:daily`,
                monthlyLimit: (walletId, type) => `wallet:${walletId}:limit:${type}:monthly`
            },

            
            cacheTTL: {
                balance: 300,        
                limits: 3600,        
                lock: 30            
            },

            
            security: {
                maxRetries: 3,
                lockTimeout: 5000,   
                doubleSpendWindow: 1000 
            }
        };
    }

    
    async createWallet(ownerData, options = {}) {
        try {
            const walletData = {
                owner: this.determineOwner(ownerData),
                currency: 'UZS',
                status: WALLET_STATUS.ACTIVE,

                
                ...this.getDefaultSettings(ownerData),

                
                ...options
            };

            const wallet = await this.walletModel.create(walletData);

            
            await this.audit.log({
                action: 'WALLET_CREATED',
                category: 'PAYMENT',
                actor: { userId: ownerData.userId || ownerData.stoId },
                target: { type: 'wallet', id: wallet._id },
                details: { walletType: wallet.owner.type }
            });

            return wallet;

        } catch (error) {
            this.logger.error({
                action: 'create_wallet_error',
                error: error.message,
                ownerData
            }, 'Failed to create wallet');

            throw error;
        }
    }

    
    async getUserWallet(userId, createIfNotExists = true) {
        
        const cacheKey = `wallet:user:${userId}`;
        const cached = await this.cache.get(cacheKey, { namespace: 'wallet' });
        if (cached) return cached;

        
        let wallet = await this.walletModel.findByUserId(userId);

        
        if (!wallet && createIfNotExists) {
            wallet = await this.createWallet({ userId, type: WALLET_TYPES.USER });
        }

        if (!wallet) {
            throw PaymentError.walletNotFound(userId);
        }

        
        await this.cache.set(cacheKey, wallet, {
            namespace: 'wallet',
            ttl: 3600 
        });

        return wallet;
    }

    
    async getStoWallet(stoId, createIfNotExists = true) {
        
        const cacheKey = `wallet:sto:${stoId}`;
        const cached = await this.cache.get(cacheKey, { namespace: 'wallet' });
        if (cached) return cached;

        
        let wallet = await this.walletModel.findByStoId(stoId);

        
        if (!wallet && createIfNotExists) {
            wallet = await this.createWallet({ stoId, type: WALLET_TYPES.STO });
        }

        if (!wallet) {
            throw PaymentError.walletNotFound(stoId);
        }

        
        await this.cache.set(cacheKey, wallet, {
            namespace: 'wallet',
            ttl: 3600
        });

        return wallet;
    }

    
    async getBalance(walletId, useCache = true) {
        
        if (useCache) {
            const cached = await this.redis.get(this.config.redisKeys.balance(walletId));
            if (cached) {
                return JSON.parse(cached);
            }
        }

        
        const wallet = await this.walletModel.findById(walletId);
        if (!wallet) {
            throw PaymentError.walletNotFound(walletId);
        }

        const balance = {
            available: wallet.balance.available,
            held: wallet.balance.held.total,
            pending: wallet.balance.pending,
            total: wallet.balance.total
        };

        
        await this.redis.setex(
            this.config.redisKeys.balance(walletId),
            this.config.cacheTTL.balance,
            JSON.stringify(balance)
        );

        return balance;
    }

    
    async deposit(walletId, amount, transactionData) {
        return await this.executeWithLock(walletId, async () => {
            
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { main: amount }
            });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.TOP_UP,
                amount,
                direction: 'in',
                status: 'completed',
                ...transactionData
            });

            
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.TOP_UP,
                amount
            });

            
            await this.invalidateCache(walletId);

            
            await this.audit.logPayment(
                'WALLET_DEPOSIT',
                { _id: transaction._id, amount },
                { userId: wallet.owner.userId || wallet.owner.stoId },
                'SUCCESS',
                { walletId, newBalance: wallet.balance.total.available }
            );

            return {
                transaction,
                newBalance: wallet.balance.total.available
            };
        });
    }

    
    async withdraw(walletId, amount, transactionData) {
        return await this.executeWithLock(walletId, async () => {
            
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            
            const balance = await this.getBalance(walletId, false);
            if (balance.available.main < amount) {
                throw PaymentError.insufficientBalance(amount, balance.available.main);
            }

            
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { main: -amount }
            });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount,
                direction: 'out',
                status: 'completed',
                ...transactionData
            });

            
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount
            });

            
            await this.invalidateCache(walletId);

            
            await this.audit.logPayment(
                'WALLET_WITHDRAW',
                { _id: transaction._id, amount },
                { userId: wallet.owner.userId || wallet.owner.stoId },
                'SUCCESS',
                { walletId, newBalance: wallet.balance.total.available }
            );

            return {
                transaction,
                newBalance: wallet.balance.total.available
            };
        });
    }

    
    async transfer(fromWalletId, toWalletId, amount, transactionData) {
        
        const sortedWalletIds = [fromWalletId, toWalletId].sort();

        return await this.executeWithMultipleLocks(sortedWalletIds, async () => {
            
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            
            const fromBalance = await this.getBalance(fromWalletId, false);
            if (fromBalance.available.main < amount) {
                throw PaymentError.insufficientBalance(amount, fromBalance.available.main);
            }

            
            const fromWallet = await this.walletModel.updateBalance(fromWalletId, {
                available: { main: -amount }
            });

            
            const toWallet = await this.walletModel.updateBalance(toWalletId, {
                available: { main: amount }
            });

            
            const fromTransaction = await this.createTransaction({
                walletId: fromWalletId,
                type: PAYMENT_TYPES.TRANSFER,
                amount,
                direction: 'out',
                status: 'completed',
                relatedWalletId: toWalletId,
                ...transactionData
            });

            const toTransaction = await this.createTransaction({
                walletId: toWalletId,
                type: PAYMENT_TYPES.TRANSFER,
                amount,
                direction: 'in',
                status: 'completed',
                relatedWalletId: fromWalletId,
                relatedTransactionId: fromTransaction._id,
                ...transactionData
            });

            
            await Promise.all([
                this.walletModel.updateStatistics(fromWalletId, {
                    type: PAYMENT_TYPES.TRANSFER,
                    amount
                }),
                this.walletModel.updateStatistics(toWalletId, {
                    type: PAYMENT_TYPES.TRANSFER,
                    amount
                })
            ]);

            
            await Promise.all([
                this.invalidateCache(fromWalletId),
                this.invalidateCache(toWalletId)
            ]);

            
            await this.audit.log({
                action: 'WALLET_TRANSFER',
                category: 'PAYMENT',
                severity: 'CRITICAL',
                actor: { walletId: fromWalletId },
                target: { type: 'wallet', id: toWalletId },
                details: {
                    amount,
                    fromTransactionId: fromTransaction._id,
                    toTransactionId: toTransaction._id
                }
            });

            return {
                fromTransaction,
                toTransaction,
                fromBalance: fromWallet.balance.total.available,
                toBalance: toWallet.balance.total.available
            };
        });
    }

    
    async holdFunds(walletId, amount, holdData) {
        return await this.executeWithLock(walletId, async () => {
            const wallet = await this.walletModel.holdFunds(walletId, {
                amount,
                reason: holdData.reason || HOLD_REASONS.ORDER_PAYMENT,
                referenceId: holdData.referenceId,
                referenceType: holdData.referenceType || 'order',
                description: holdData.description,
                expiresAt: holdData.expiresAt
            });

            
            await this.invalidateCache(walletId);

            
            await this.audit.log({
                action: 'WALLET_HOLD_FUNDS',
                category: 'PAYMENT',
                actor: { walletId },
                details: {
                    amount,
                    reason: holdData.reason,
                    referenceId: holdData.referenceId
                }
            });

            return wallet;
        });
    }

    
    async releaseFunds(walletId, holdId, options = {}) {
        return await this.executeWithLock(walletId, async () => {
            const wallet = await this.walletModel.releaseFunds(
                walletId,
                holdId,
                options.releaseToAvailable !== false
            );

            
            await this.invalidateCache(walletId);

            
            await this.audit.log({
                action: 'WALLET_RELEASE_FUNDS',
                category: 'PAYMENT',
                actor: { walletId },
                details: {
                    holdId,
                    releaseToAvailable: options.releaseToAvailable !== false
                }
            });

            return wallet;
        });
    }

    
    async processOrderCommission(orderId, orderAmount, masterId, stoId = null) {
        try {
            
            const recipient = stoId ?
                { type: 'sto', id: stoId, rate: PAYMENT_FEES.PLATFORM_COMMISSION * 0.67 } : 
                { type: 'master', id: masterId, rate: PAYMENT_FEES.PLATFORM_COMMISSION };

            const commissionAmount = Math.round(orderAmount * recipient.rate);

            
            const recipientWallet = recipient.type === 'sto' ?
                await this.getStoWallet(recipient.id) :
                await this.getUserWallet(recipient.id);

            const systemWallet = await this.getSystemWallet('commission');

            
            const transfer = await this.transfer(
                recipientWallet._id,
                systemWallet._id,
                commissionAmount,
                {
                    orderId,
                    description: `Commission for order ${orderId}`,
                    metadata: {
                        orderAmount,
                        commissionRate: recipient.rate,
                        recipientType: recipient.type
                    }
                }
            );

            return {
                commissionAmount,
                commissionRate: recipient.rate,
                transactionId: transfer.fromTransaction._id
            };

        } catch (error) {
            this.logger.error({
                action: 'process_commission_error',
                orderId,
                error: error.message
            }, 'Failed to process order commission');

            throw error;
        }
    }

    
    async creditBonus(walletId, amount, bonusData) {
        return await this.executeWithLock(walletId, async () => {
            
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { bonus: amount }
            });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.BONUS,
                amount,
                direction: 'in',
                status: 'completed',
                balanceType: BALANCE_TYPES.BONUS,
                ...bonusData
            });

            
            await this.walletModel.collection.updateOne(
                { _id: new ObjectId(walletId) },
                {
                    $push: {
                        'bonusProgram.history': {
                            amount,
                            type: bonusData.type || 'manual',
                            referenceId: bonusData.referenceId,
                            description: bonusData.description,
                            earnedAt: new Date(),
                            expiresAt: bonusData.expiresAt
                        }
                    }
                }
            );

            
            await this.invalidateCache(walletId);

            return {
                transaction,
                newBonusBalance: wallet.balance.available.bonus
            };
        });
    }

    
    async useBonus(walletId, amount, orderId) {
        return await this.executeWithLock(walletId, async () => {
            
            const balance = await this.getBalance(walletId, false);
            if (balance.available.bonus < amount) {
                throw PaymentError.insufficientBonus(amount, balance.available.bonus);
            }

            
            const wallet = await this.walletModel.findById(walletId);
            const maxUsage = wallet.bonusProgram?.usage?.maxPercentagePerOrder || 50;
            

            
            const updated = await this.walletModel.updateBalance(walletId, {
                available: { bonus: -amount }
            });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.BONUS,
                amount,
                direction: 'out',
                status: 'completed',
                balanceType: BALANCE_TYPES.BONUS,
                orderId,
                description: `Bonus used for order ${orderId}`
            });

            
            await this.invalidateCache(walletId);

            return {
                transaction,
                usedAmount: amount,
                remainingBonus: updated.balance.available.bonus
            };
        });
    }

    
    async creditCashback(walletId, orderAmount, orderId) {
        return await this.executeWithLock(walletId, async () => {
            
            const wallet = await this.walletModel.findById(walletId);

            
            const cashbackLevel = wallet.cashbackProgram?.currentLevel || 'bronze';
            const cashbackPercentage = this.getCashbackPercentage(cashbackLevel);
            const cashbackAmount = Math.round(orderAmount * cashbackPercentage);

            if (cashbackAmount === 0) return null;

            
            const updated = await this.walletModel.updateBalance(walletId, {
                available: { cashback: cashbackAmount }
            });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.CASHBACK,
                amount: cashbackAmount,
                direction: 'in',
                status: 'completed',
                balanceType: BALANCE_TYPES.CASHBACK,
                orderId,
                metadata: {
                    orderAmount,
                    cashbackPercentage,
                    level: cashbackLevel
                }
            });

            
            await this.walletModel.collection.updateOne(
                { _id: new ObjectId(walletId) },
                {
                    $push: {
                        'cashbackProgram.history': {
                            amount: cashbackAmount,
                            orderId,
                            percentage: cashbackPercentage,
                            earnedAt: new Date()
                        }
                    }
                }
            );

            
            await this.invalidateCache(walletId);

            return {
                transaction,
                cashbackAmount,
                cashbackPercentage,
                newCashbackBalance: updated.balance.available.cashback
            };
        });
    }

    
    async requestWithdrawal(walletId, withdrawalData) {
        return await this.executeWithLock(walletId, async () => {
            
            const wallet = await this.walletModel.findById(walletId);
            const balance = wallet.balance.available.main;

            const validation = PaymentValidator.validateWithdrawal(withdrawalData, balance);
            if (!validation.valid) {
                throw validation.error;
            }

            
            const limitCheck = await this.checkWithdrawalLimits(walletId, withdrawalData.amount);
            if (!limitCheck.allowed) {
                throw PaymentError.limitExceeded(limitCheck.errors[0]);
            }

            
            const fee = calculateFee(
                withdrawalData.amount,
                PAYMENT_TYPES.WITHDRAWAL,
                withdrawalData.method
            );

            const totalAmount = withdrawalData.amount + fee;

            
            if (balance < totalAmount) {
                throw PaymentError.insufficientBalance(totalAmount, balance);
            }

            
            const hold = await this.holdFunds(walletId, totalAmount, {
                reason: HOLD_REASONS.WITHDRAWAL_REQUEST,
                description: 'Withdrawal request',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
            });

            
            const payment = await this.paymentModel.create({
                type: PAYMENT_TYPES.WITHDRAWAL,
                status: PAYMENT_STATUS.PENDING,
                method: withdrawalData.method,
                amount: {
                    original: { value: withdrawalData.amount },
                    fees: {
                        platform: { amount: fee, percentage: 0 },
                        total: fee
                    },
                    final: { value: withdrawalData.amount - fee }
                },
                references: {
                    userId: wallet.owner.userId,
                    walletIds: {
                        source: wallet._id
                    }
                },
                metadata: {
                    holdId: hold._id,
                    ...withdrawalData.metadata
                }
            });

            
            await this.updateWithdrawalLimits(walletId, withdrawalData.amount);

            
            await this.audit.logPayment(
                'WITHDRAWAL_REQUESTED',
                payment,
                { walletId },
                'PENDING',
                { amount: withdrawalData.amount, fee, method: withdrawalData.method }
            );

            return {
                payment,
                amount: withdrawalData.amount,
                fee,
                netAmount: withdrawalData.amount - fee,
                estimatedTime: this.getEstimatedWithdrawalTime(withdrawalData.method)
            };
        });
    }

    
    async confirmWithdrawal(paymentId, providerData) {
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) {
            throw PaymentError.paymentNotFound(paymentId);
        }

        const walletId = payment.references.walletIds.source;

        return await this.executeWithLock(walletId, async () => {
            
            await this.paymentModel.updateStatus(
                paymentId,
                PAYMENT_STATUS.COMPLETED,
                { providerData }
            );

            
            const holdId = payment.metadata.holdId;
            await this.releaseFunds(walletId, holdId, { releaseToAvailable: false });

            
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount: payment.amount.original.value,
                direction: 'out',
                status: 'completed',
                paymentId,
                fee: payment.amount.fees.total,
                netAmount: payment.amount.final.value
            });

            
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount: payment.amount.original.value
            });

            
            await this.invalidateCache(walletId);

            
            await this.audit.logPayment(
                'WITHDRAWAL_COMPLETED',
                payment,
                { walletId },
                'SUCCESS',
                { transactionId: transaction._id }
            );

            return {
                payment,
                transaction
            };
        });
    }

    
    async cancelWithdrawal(paymentId, reason) {
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) {
            throw PaymentError.paymentNotFound(paymentId);
        }

        const walletId = payment.references.walletIds.source;

        return await this.executeWithLock(walletId, async () => {
            
            await this.paymentModel.updateStatus(
                paymentId,
                PAYMENT_STATUS.CANCELLED,
                { reason }
            );

            
            const holdId = payment.metadata.holdId;
            await this.releaseFunds(walletId, holdId);

            
            await this.returnWithdrawalLimits(walletId, payment.amount.original.value);

            
            await this.audit.logPayment(
                'WITHDRAWAL_CANCELLED',
                payment,
                { walletId },
                'CANCELLED',
                { reason }
            );

            return {
                payment,
                refundedAmount: payment.amount.original.value
            };
        });
    }

    
    async getTransactionHistory(walletId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            type = null,
            dateFrom = null,
            dateTo = null,
            direction = null
        } = options;

        const query = { walletId: new ObjectId(walletId) };

        if (type) query.type = type;
        if (direction) query.direction = direction;

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const transactions = await this.transactionModel.collection
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(offset)
            .toArray();

        const total = await this.transactionModel.collection.countDocuments(query);

        return {
            transactions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + transactions.length < total
            }
        };
    }

    
    async getWalletStatistics(walletId, period = 'month') {
        const wallet = await this.walletModel.findById(walletId);
        if (!wallet) {
            throw PaymentError.walletNotFound(walletId);
        }

        
        const now = new Date();
        let dateFrom;

        switch (period) {
            case 'day':
                dateFrom = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                dateFrom = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                dateFrom = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                dateFrom = new Date(0);
        }

        
        const stats = await this.transactionModel.collection.aggregate([
            {
                $match: {
                    walletId: new ObjectId(walletId),
                    createdAt: { $gte: dateFrom }
                }
            },
            {
                $group: {
                    _id: {
                        type: '$type',
                        direction: '$direction'
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' },
                    totalFees: { $sum: '$fee' }
                }
            },
            {
                $group: {
                    _id: '$_id.type',
                    stats: {
                        $push: {
                            direction: '$_id.direction',
                            count: '$count',
                            totalAmount: '$totalAmount',
                            avgAmount: '$avgAmount',
                            totalFees: '$totalFees'
                        }
                    }
                }
            }
        ]).toArray();

        
        const formattedStats = {
            period,
            dateFrom,
            dateTo: new Date(),
            currentBalance: wallet.balance.total,
            lifetime: wallet.statistics.lifetime,
            byType: {}
        };

        stats.forEach(item => {
            formattedStats.byType[item._id] = {
                in: item.stats.find(s => s.direction === 'in') || { count: 0, totalAmount: 0 },
                out: item.stats.find(s => s.direction === 'out') || { count: 0, totalAmount: 0 }
            };
        });

        return formattedStats;
    }

    

    
    determineOwner(ownerData) {
        if (ownerData.userId) {
            return {
                type: WALLET_TYPES.USER,
                userId: new ObjectId(ownerData.userId)
            };
        } else if (ownerData.stoId) {
            return {
                type: WALLET_TYPES.STO,
                stoId: new ObjectId(ownerData.stoId)
            };
        } else if (ownerData.systemId) {
            return {
                type: WALLET_TYPES.SYSTEM,
                systemId: ownerData.systemId
            };
        }

        throw new Error('Invalid owner data');
    }

    
    getDefaultSettings(ownerData) {
        const settings = {
            limits: {},
            withdrawalSettings: {
                fees: {}
            }
        };

        
        if (ownerData.role === USER_ROLES.MASTER) {
            settings.limits = {
                withdrawal: {
                    daily: { limit: 10000000 },    
                    monthly: { limit: 100000000 }   
                }
            };
            settings.withdrawalSettings.fees = {
                percentage: 0.01,  
                min: 1000,
                max: 50000
            };
        }

        
        if (ownerData.type === WALLET_TYPES.STO) {
            settings.limits = {
                withdrawal: {
                    daily: { limit: 50000000 },     
                    monthly: { limit: 1000000000 }  
                }
            };
            settings.withdrawalSettings.fees = {
                fixed: 5000  
            };
        }

        return settings;
    }

    
    async getSystemWallet(systemId) {
        const cacheKey = `wallet:system:${systemId}`;
        const cached = await this.cache.get(cacheKey, { namespace: 'wallet' });
        if (cached) return cached;

        let wallet = await this.walletModel.collection.findOne({
            'owner.type': WALLET_TYPES.SYSTEM,
            'owner.systemId': systemId
        });

        if (!wallet) {
            wallet = await this.createWallet({
                type: WALLET_TYPES.SYSTEM,
                systemId
            });
        }

        await this.cache.set(cacheKey, wallet, {
            namespace: 'wallet',
            ttl: 86400 
        });

        return wallet;
    }

    
    async createTransaction(transactionData) {
        const transaction = {
            _id: new ObjectId(),
            walletId: new ObjectId(transactionData.walletId),
            type: transactionData.type,
            amount: transactionData.amount,
            direction: transactionData.direction,
            status: transactionData.status,
            balanceType: transactionData.balanceType || BALANCE_TYPES.MAIN,

            fee: transactionData.fee || 0,
            netAmount: transactionData.netAmount || transactionData.amount,

            relatedWalletId: transactionData.relatedWalletId,
            relatedTransactionId: transactionData.relatedTransactionId,
            orderId: transactionData.orderId,
            paymentId: transactionData.paymentId,

            description: transactionData.description,
            metadata: transactionData.metadata || {},

            createdAt: new Date()
        };

        await this.transactionModel.collection.insertOne(transaction);
        return transaction;
    }

    
    async checkWithdrawalLimits(walletId, amount) {
        return await this.walletModel.checkLimit(walletId, amount, 'withdrawal');
    }

    
    async updateWithdrawalLimits(walletId, amount) {
        await this.walletModel.updateLimitUsage(walletId, amount, 'withdrawal');

        
        const dailyKey = this.config.redisKeys.dailyLimit(walletId, 'withdrawal');
        const monthlyKey = this.config.redisKeys.monthlyLimit(walletId, 'withdrawal');

        await Promise.all([
            this.redis.del(dailyKey),
            this.redis.del(monthlyKey)
        ]);
    }

    
    async returnWithdrawalLimits(walletId, amount) {
        await this.walletModel.updateLimitUsage(walletId, -amount, 'withdrawal');

        
        const dailyKey = this.config.redisKeys.dailyLimit(walletId, 'withdrawal');
        const monthlyKey = this.config.redisKeys.monthlyLimit(walletId, 'withdrawal');

        await Promise.all([
            this.redis.del(dailyKey),
            this.redis.del(monthlyKey)
        ]);
    }

    
    getCashbackPercentage(level) {
        const levels = {
            bronze: 0.01,    
            silver: 0.02,    
            gold: 0.03,      
            platinum: 0.05   
        };

        return levels[level] || 0.01;
    }

    
    getEstimatedWithdrawalTime(method) {
        const times = {
            [PAYMENT_METHODS.CARD]: '5-15 минут',
            [PAYMENT_METHODS.BANK_TRANSFER]: '1-3 рабочих дня',
            [PAYMENT_METHODS.PAYME]: '5-30 минут',
            [PAYMENT_METHODS.CLICK]: '5-30 минут'
        };

        return times[method] || '1-24 часа';
    }

    
    async executeWithLock(walletId, operation) {
        const lockKey = this.config.redisKeys.lock(walletId);
        const lockValue = `${Date.now()}_${Math.random()}`;

        try {
            
            const acquired = await this.redis.set(
                lockKey,
                lockValue,
                'PX',
                this.config.security.lockTimeout,
                'NX'
            );

            if (!acquired) {
                throw PaymentError.walletLocked(walletId);
            }

            
            return await operation();

        } finally {
            
            const currentValue = await this.redis.get(lockKey);
            if (currentValue === lockValue) {
                await this.redis.del(lockKey);
            }
        }
    }

    
    async executeWithMultipleLocks(walletIds, operation) {
        const locks = [];

        try {
            
            for (const walletId of walletIds) {
                const lockKey = this.config.redisKeys.lock(walletId);
                const lockValue = `${Date.now()}_${Math.random()}`;

                const acquired = await this.redis.set(
                    lockKey,
                    lockValue,
                    'PX',
                    this.config.security.lockTimeout,
                    'NX'
                );

                if (!acquired) {
                    throw PaymentError.walletLocked(walletId);
                }

                locks.push({ key: lockKey, value: lockValue });
            }

            
            return await operation();

        } finally {
            
            for (const lock of locks) {
                const currentValue = await this.redis.get(lock.key);
                if (currentValue === lock.value) {
                    await this.redis.del(lock.key);
                }
            }
        }
    }

    
    async invalidateCache(walletId) {
        const keys = [
            this.config.redisKeys.balance(walletId),
            `wallet:user:*`,
            `wallet:sto:*`
        ];

        await Promise.all(
            keys.map(key => this.redis.del(key))
        );

        
        await this.cache.delete(`wallet:*`, { pattern: true, namespace: 'wallet' });
    }

    
    async releaseExpiredHolds() {
        try {
            const released = await this.walletModel.releaseExpiredHolds();

            this.logger.info({
                action: 'release_expired_holds',
                released
            }, 'Released expired holds');

            return released;

        } catch (error) {
            this.logger.error({
                action: 'release_expired_holds_error',
                error: error.message
            }, 'Failed to release expired holds');

            throw error;
        }
    }
}

module.exports = WalletService;