// src/services/payment/wallet.service.js

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

/**
 * Сервис управления кошельками
 * Обеспечивает работу с балансами, транзакциями и выводами
 */
class WalletService {
    constructor(walletModel, transactionModel, paymentModel, cacheService, auditService, redis, logger) {
        this.walletModel = walletModel;
        this.transactionModel = transactionModel;
        this.paymentModel = paymentModel;
        this.cache = cacheService;
        this.audit = auditService;
        this.redis = redis;
        this.logger = logger;

        // Конфигурация
        this.config = {
            // Префиксы для Redis ключей
            redisKeys: {
                balance: (walletId) => `wallet:${walletId}:balance`,
                lock: (walletId) => `wallet:${walletId}:lock`,
                dailyLimit: (walletId, type) => `wallet:${walletId}:limit:${type}:daily`,
                monthlyLimit: (walletId, type) => `wallet:${walletId}:limit:${type}:monthly`
            },

            // TTL для кеша (секунды)
            cacheTTL: {
                balance: 300,        // 5 минут
                limits: 3600,        // 1 час
                lock: 30            // 30 секунд для distributed lock
            },

            // Настройки безопасности
            security: {
                maxRetries: 3,
                lockTimeout: 5000,   // 5 секунд
                doubleSpendWindow: 1000 // 1 секунда
            }
        };
    }

    /**
     * Создание кошелька
     */
    async createWallet(ownerData, options = {}) {
        try {
            const walletData = {
                owner: this.determineOwner(ownerData),
                currency: 'UZS',
                status: WALLET_STATUS.ACTIVE,

                // Настройки по типу владельца
                ...this.getDefaultSettings(ownerData),

                // Дополнительные опции
                ...options
            };

            const wallet = await this.walletModel.create(walletData);

            // Логируем создание
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

    /**
     * Получение кошелька пользователя
     */
    async getUserWallet(userId, createIfNotExists = true) {
        // Проверяем кеш
        const cacheKey = `wallet:user:${userId}`;
        const cached = await this.cache.get(cacheKey, { namespace: 'wallet' });
        if (cached) return cached;

        // Ищем в БД
        let wallet = await this.walletModel.findByUserId(userId);

        // Создаем если не существует
        if (!wallet && createIfNotExists) {
            wallet = await this.createWallet({ userId, type: WALLET_TYPES.USER });
        }

        if (!wallet) {
            throw PaymentError.walletNotFound(userId);
        }

        // Кешируем
        await this.cache.set(cacheKey, wallet, {
            namespace: 'wallet',
            ttl: 3600 // 1 час
        });

        return wallet;
    }

    /**
     * Получение кошелька СТО
     */
    async getStoWallet(stoId, createIfNotExists = true) {
        // Проверяем кеш
        const cacheKey = `wallet:sto:${stoId}`;
        const cached = await this.cache.get(cacheKey, { namespace: 'wallet' });
        if (cached) return cached;

        // Ищем в БД
        let wallet = await this.walletModel.findByStoId(stoId);

        // Создаем если не существует
        if (!wallet && createIfNotExists) {
            wallet = await this.createWallet({ stoId, type: WALLET_TYPES.STO });
        }

        if (!wallet) {
            throw PaymentError.walletNotFound(stoId);
        }

        // Кешируем
        await this.cache.set(cacheKey, wallet, {
            namespace: 'wallet',
            ttl: 3600
        });

        return wallet;
    }

    /**
     * Получение баланса
     */
    async getBalance(walletId, useCache = true) {
        // Проверяем кеш
        if (useCache) {
            const cached = await this.redis.get(this.config.redisKeys.balance(walletId));
            if (cached) {
                return JSON.parse(cached);
            }
        }

        // Получаем из БД
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

        // Кешируем
        await this.redis.setex(
            this.config.redisKeys.balance(walletId),
            this.config.cacheTTL.balance,
            JSON.stringify(balance)
        );

        return balance;
    }

    /**
     * Пополнение кошелька
     */
    async deposit(walletId, amount, transactionData) {
        return await this.executeWithLock(walletId, async () => {
            // Валидация
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            // Обновляем баланс
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { main: amount }
            });

            // Создаем транзакцию
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.TOP_UP,
                amount,
                direction: 'in',
                status: 'completed',
                ...transactionData
            });

            // Обновляем статистику
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.TOP_UP,
                amount
            });

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            // Логируем
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

    /**
     * Списание с кошелька
     */
    async withdraw(walletId, amount, transactionData) {
        return await this.executeWithLock(walletId, async () => {
            // Валидация
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            // Проверяем баланс
            const balance = await this.getBalance(walletId, false);
            if (balance.available.main < amount) {
                throw PaymentError.insufficientBalance(amount, balance.available.main);
            }

            // Обновляем баланс
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { main: -amount }
            });

            // Создаем транзакцию
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount,
                direction: 'out',
                status: 'completed',
                ...transactionData
            });

            // Обновляем статистику
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount
            });

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            // Логируем
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

    /**
     * Перевод между кошельками
     */
    async transfer(fromWalletId, toWalletId, amount, transactionData) {
        // Сортируем ID для предотвращения deadlock
        const sortedWalletIds = [fromWalletId, toWalletId].sort();

        return await this.executeWithMultipleLocks(sortedWalletIds, async () => {
            // Валидация
            const validation = PaymentValidator.validateAmount(amount);
            if (!validation.valid) {
                throw ValidationErrorFactory.fromArray(validation.errors);
            }

            // Проверяем баланс отправителя
            const fromBalance = await this.getBalance(fromWalletId, false);
            if (fromBalance.available.main < amount) {
                throw PaymentError.insufficientBalance(amount, fromBalance.available.main);
            }

            // Списываем с отправителя
            const fromWallet = await this.walletModel.updateBalance(fromWalletId, {
                available: { main: -amount }
            });

            // Начисляем получателю
            const toWallet = await this.walletModel.updateBalance(toWalletId, {
                available: { main: amount }
            });

            // Создаем транзакции
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

            // Обновляем статистику
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

            // Инвалидируем кеш
            await Promise.all([
                this.invalidateCache(fromWalletId),
                this.invalidateCache(toWalletId)
            ]);

            // Логируем
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

    /**
     * Блокировка средств
     */
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

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            // Логируем
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

    /**
     * Разблокировка средств
     */
    async releaseFunds(walletId, holdId, options = {}) {
        return await this.executeWithLock(walletId, async () => {
            const wallet = await this.walletModel.releaseFunds(
                walletId,
                holdId,
                options.releaseToAvailable !== false
            );

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            // Логируем
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

    /**
     * Обработка комиссии за заказ
     */
    async processOrderCommission(orderId, orderAmount, masterId, stoId = null) {
        try {
            // Определяем получателя и ставку комиссии
            const recipient = stoId ?
                { type: 'sto', id: stoId, rate: PAYMENT_FEES.PLATFORM_COMMISSION * 0.67 } : // СТО платит меньше
                { type: 'master', id: masterId, rate: PAYMENT_FEES.PLATFORM_COMMISSION };

            const commissionAmount = Math.round(orderAmount * recipient.rate);

            // Получаем кошельки
            const recipientWallet = recipient.type === 'sto' ?
                await this.getStoWallet(recipient.id) :
                await this.getUserWallet(recipient.id);

            const systemWallet = await this.getSystemWallet('commission');

            // Переводим комиссию
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

    /**
     * Начисление бонусов
     */
    async creditBonus(walletId, amount, bonusData) {
        return await this.executeWithLock(walletId, async () => {
            // Обновляем бонусный баланс
            const wallet = await this.walletModel.updateBalance(walletId, {
                available: { bonus: amount }
            });

            // Создаем транзакцию
            const transaction = await this.createTransaction({
                walletId,
                type: PAYMENT_TYPES.BONUS,
                amount,
                direction: 'in',
                status: 'completed',
                balanceType: BALANCE_TYPES.BONUS,
                ...bonusData
            });

            // Добавляем в историю бонусов
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

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            return {
                transaction,
                newBonusBalance: wallet.balance.available.bonus
            };
        });
    }

    /**
     * Использование бонусов
     */
    async useBonus(walletId, amount, orderId) {
        return await this.executeWithLock(walletId, async () => {
            // Проверяем бонусный баланс
            const balance = await this.getBalance(walletId, false);
            if (balance.available.bonus < amount) {
                throw PaymentError.insufficientBonus(amount, balance.available.bonus);
            }

            // Проверяем ограничения использования
            const wallet = await this.walletModel.findById(walletId);
            const maxUsage = wallet.bonusProgram?.usage?.maxPercentagePerOrder || 50;
            // TODO: Проверить процент от суммы заказа

            // Списываем бонусы
            const updated = await this.walletModel.updateBalance(walletId, {
                available: { bonus: -amount }
            });

            // Создаем транзакцию
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

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            return {
                transaction,
                usedAmount: amount,
                remainingBonus: updated.balance.available.bonus
            };
        });
    }

    /**
     * Начисление кэшбэка
     */
    async creditCashback(walletId, orderAmount, orderId) {
        return await this.executeWithLock(walletId, async () => {
            // Получаем кошелек для определения уровня кэшбэка
            const wallet = await this.walletModel.findById(walletId);

            // Определяем процент кэшбэка
            const cashbackLevel = wallet.cashbackProgram?.currentLevel || 'bronze';
            const cashbackPercentage = this.getCashbackPercentage(cashbackLevel);
            const cashbackAmount = Math.round(orderAmount * cashbackPercentage);

            if (cashbackAmount === 0) return null;

            // Начисляем кэшбэк
            const updated = await this.walletModel.updateBalance(walletId, {
                available: { cashback: cashbackAmount }
            });

            // Создаем транзакцию
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

            // Обновляем историю кэшбэка
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

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            return {
                transaction,
                cashbackAmount,
                cashbackPercentage,
                newCashbackBalance: updated.balance.available.cashback
            };
        });
    }

    /**
     * Обработка запроса на вывод средств
     */
    async requestWithdrawal(walletId, withdrawalData) {
        return await this.executeWithLock(walletId, async () => {
            // Валидация данных вывода
            const wallet = await this.walletModel.findById(walletId);
            const balance = wallet.balance.available.main;

            const validation = PaymentValidator.validateWithdrawal(withdrawalData, balance);
            if (!validation.valid) {
                throw validation.error;
            }

            // Проверяем лимиты
            const limitCheck = await this.checkWithdrawalLimits(walletId, withdrawalData.amount);
            if (!limitCheck.allowed) {
                throw PaymentError.limitExceeded(limitCheck.errors[0]);
            }

            // Рассчитываем комиссию
            const fee = calculateFee(
                withdrawalData.amount,
                PAYMENT_TYPES.WITHDRAWAL,
                withdrawalData.method
            );

            const totalAmount = withdrawalData.amount + fee;

            // Проверяем достаточность средств с учетом комиссии
            if (balance < totalAmount) {
                throw PaymentError.insufficientBalance(totalAmount, balance);
            }

            // Блокируем средства
            const hold = await this.holdFunds(walletId, totalAmount, {
                reason: HOLD_REASONS.WITHDRAWAL_REQUEST,
                description: 'Withdrawal request',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
            });

            // Создаем платеж на вывод
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

            // Обновляем использованные лимиты
            await this.updateWithdrawalLimits(walletId, withdrawalData.amount);

            // Логируем
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

    /**
     * Подтверждение вывода средств
     */
    async confirmWithdrawal(paymentId, providerData) {
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) {
            throw PaymentError.paymentNotFound(paymentId);
        }

        const walletId = payment.references.walletIds.source;

        return await this.executeWithLock(walletId, async () => {
            // Обновляем статус платежа
            await this.paymentModel.updateStatus(
                paymentId,
                PAYMENT_STATUS.COMPLETED,
                { providerData }
            );

            // Конвертируем hold в списание
            const holdId = payment.metadata.holdId;
            await this.releaseFunds(walletId, holdId, { releaseToAvailable: false });

            // Создаем транзакцию
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

            // Обновляем статистику
            await this.walletModel.updateStatistics(walletId, {
                type: PAYMENT_TYPES.WITHDRAWAL,
                amount: payment.amount.original.value
            });

            // Инвалидируем кеш
            await this.invalidateCache(walletId);

            // Логируем
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

    /**
     * Отмена вывода средств
     */
    async cancelWithdrawal(paymentId, reason) {
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) {
            throw PaymentError.paymentNotFound(paymentId);
        }

        const walletId = payment.references.walletIds.source;

        return await this.executeWithLock(walletId, async () => {
            // Обновляем статус платежа
            await this.paymentModel.updateStatus(
                paymentId,
                PAYMENT_STATUS.CANCELLED,
                { reason }
            );

            // Разблокируем средства
            const holdId = payment.metadata.holdId;
            await this.releaseFunds(walletId, holdId);

            // Возвращаем лимиты
            await this.returnWithdrawalLimits(walletId, payment.amount.original.value);

            // Логируем
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

    /**
     * Получение истории транзакций
     */
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

    /**
     * Получение статистики кошелька
     */
    async getWalletStatistics(walletId, period = 'month') {
        const wallet = await this.walletModel.findById(walletId);
        if (!wallet) {
            throw PaymentError.walletNotFound(walletId);
        }

        // Определяем период
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

        // Агрегация транзакций
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

        // Форматируем результат
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

    /**
     * Вспомогательные методы
     */

    // Определение владельца кошелька
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

    // Получение настроек по умолчанию
    getDefaultSettings(ownerData) {
        const settings = {
            limits: {},
            withdrawalSettings: {
                fees: {}
            }
        };

        // Настройки для мастеров
        if (ownerData.role === USER_ROLES.MASTER) {
            settings.limits = {
                withdrawal: {
                    daily: { limit: 10000000 },    // 10M UZS
                    monthly: { limit: 100000000 }   // 100M UZS
                }
            };
            settings.withdrawalSettings.fees = {
                percentage: 0.01,  // 1%
                min: 1000,
                max: 50000
            };
        }

        // Настройки для СТО
        if (ownerData.type === WALLET_TYPES.STO) {
            settings.limits = {
                withdrawal: {
                    daily: { limit: 50000000 },     // 50M UZS
                    monthly: { limit: 1000000000 }  // 1B UZS
                }
            };
            settings.withdrawalSettings.fees = {
                fixed: 5000  // Фиксированная комиссия
            };
        }

        return settings;
    }

    // Получение системного кошелька
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
            ttl: 86400 // 24 часа
        });

        return wallet;
    }

    // Создание транзакции
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

    // Проверка лимитов на вывод
    async checkWithdrawalLimits(walletId, amount) {
        return await this.walletModel.checkLimit(walletId, amount, 'withdrawal');
    }

    // Обновление использованных лимитов
    async updateWithdrawalLimits(walletId, amount) {
        await this.walletModel.updateLimitUsage(walletId, amount, 'withdrawal');

        // Инвалидируем кеш лимитов
        const dailyKey = this.config.redisKeys.dailyLimit(walletId, 'withdrawal');
        const monthlyKey = this.config.redisKeys.monthlyLimit(walletId, 'withdrawal');

        await Promise.all([
            this.redis.del(dailyKey),
            this.redis.del(monthlyKey)
        ]);
    }

    // Возврат лимитов при отмене
    async returnWithdrawalLimits(walletId, amount) {
        await this.walletModel.updateLimitUsage(walletId, -amount, 'withdrawal');

        // Инвалидируем кеш лимитов
        const dailyKey = this.config.redisKeys.dailyLimit(walletId, 'withdrawal');
        const monthlyKey = this.config.redisKeys.monthlyLimit(walletId, 'withdrawal');

        await Promise.all([
            this.redis.del(dailyKey),
            this.redis.del(monthlyKey)
        ]);
    }

    // Получение процента кэшбэка
    getCashbackPercentage(level) {
        const levels = {
            bronze: 0.01,    // 1%
            silver: 0.02,    // 2%
            gold: 0.03,      // 3%
            platinum: 0.05   // 5%
        };

        return levels[level] || 0.01;
    }

    // Получение времени обработки вывода
    getEstimatedWithdrawalTime(method) {
        const times = {
            [PAYMENT_METHODS.CARD]: '5-15 минут',
            [PAYMENT_METHODS.BANK_TRANSFER]: '1-3 рабочих дня',
            [PAYMENT_METHODS.PAYME]: '5-30 минут',
            [PAYMENT_METHODS.CLICK]: '5-30 минут'
        };

        return times[method] || '1-24 часа';
    }

    // Выполнение операции с блокировкой
    async executeWithLock(walletId, operation) {
        const lockKey = this.config.redisKeys.lock(walletId);
        const lockValue = `${Date.now()}_${Math.random()}`;

        try {
            // Пытаемся получить блокировку
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

            // Выполняем операцию
            return await operation();

        } finally {
            // Освобождаем блокировку только если она наша
            const currentValue = await this.redis.get(lockKey);
            if (currentValue === lockValue) {
                await this.redis.del(lockKey);
            }
        }
    }

    // Выполнение операции с множественными блокировками
    async executeWithMultipleLocks(walletIds, operation) {
        const locks = [];

        try {
            // Получаем все блокировки
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

            // Выполняем операцию
            return await operation();

        } finally {
            // Освобождаем все блокировки
            for (const lock of locks) {
                const currentValue = await this.redis.get(lock.key);
                if (currentValue === lock.value) {
                    await this.redis.del(lock.key);
                }
            }
        }
    }

    // Инвалидация кеша
    async invalidateCache(walletId) {
        const keys = [
            this.config.redisKeys.balance(walletId),
            `wallet:user:*`,
            `wallet:sto:*`
        ];

        await Promise.all(
            keys.map(key => this.redis.del(key))
        );

        // Инвалидируем кеш сервиса
        await this.cache.delete(`wallet:*`, { pattern: true, namespace: 'wallet' });
    }

    // Автоматическое освобождение истекших holds
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