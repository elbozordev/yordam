// src/models/wallet.model.js

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_TYPES, PAYMENT_STATUS } = require('../utils/constants/payment-status');
const { USER_ROLES } = require('../utils/constants/user-roles');

// Типы кошельков
const WALLET_TYPES = {
    USER: 'user',                          // Кошелек пользователя (клиент/мастер)
    STO: 'sto',                           // Кошелек СТО
    SYSTEM: 'system',                      // Системный кошелек (для комиссий)
    ESCROW: 'escrow'                       // Эскроу счет (для холдирования средств)
};

// Статусы кошелька
const WALLET_STATUS = {
    ACTIVE: 'active',                      // Активен
    SUSPENDED: 'suspended',                // Приостановлен
    BLOCKED: 'blocked',                    // Заблокирован
    CLOSED: 'closed'                       // Закрыт
};

// Типы балансов
const BALANCE_TYPES = {
    MAIN: 'main',                          // Основной баланс
    BONUS: 'bonus',                        // Бонусный баланс
    CASHBACK: 'cashback',                  // Кэшбэк баланс
    PENDING: 'pending'                     // Ожидающие средства
};

// Причины блокировки средств
const HOLD_REASONS = {
    ORDER_PAYMENT: 'order_payment',        // Оплата заказа
    WITHDRAWAL_REQUEST: 'withdrawal_request', // Запрос на вывод
    DISPUTE: 'dispute',                    // Спор по заказу
    VERIFICATION: 'verification',          // Проверка платежа
    PENALTY: 'penalty',                    // Штраф
    OTHER: 'other'                         // Другое
};

// Схема кошелька
const walletSchema = {
    _id: ObjectId,

    // Владелец кошелька
    owner: {
        type: String,                      // Из WALLET_TYPES
        userId: ObjectId,                  // Для USER типа
        stoId: ObjectId,                   // Для STO типа
        systemId: String                   // Для SYSTEM типа (например, 'commission', 'bonus_pool')
    },

    // Основная информация
    currency: String,                      // Валюта (UZS)
    status: String,                        // Из WALLET_STATUS

    // Балансы (в минимальных единицах - тийин для UZS)
    balance: {
        // Доступные средства
        available: {
            main: Number,                  // Основной доступный баланс
            bonus: Number,                 // Бонусный баланс
            cashback: Number               // Кэшбэк баланс
        },

        // Заблокированные средства
        held: {
            total: Number,                 // Всего заблокировано

            // Детализация по причинам
            details: [{
                amount: Number,
                reason: String,            // Из HOLD_REASONS
                referenceId: ObjectId,     // Ссылка на заказ/транзакцию
                referenceType: String,     // order, transaction, etc.
                description: String,
                createdAt: Date,
                expiresAt: Date           // Когда автоматически разблокировать
            }]
        },

        // Ожидающие зачисления
        pending: {
            incoming: Number,              // Ожидаемые поступления
            outgoing: Number               // Ожидаемые списания
        },

        // Итоговые суммы
        total: {
            available: Number,             // Сумма всех доступных балансов
            held: Number,                  // Сумма заблокированных
            pending: Number,               // Сумма ожидающих
            overall: Number                // Общий баланс (available + held + pending)
        }
    },

    // Лимиты и ограничения
    limits: {
        // Лимиты на вывод
        withdrawal: {
            daily: {
                limit: Number,             // Дневной лимит
                used: Number,              // Использовано сегодня
                resetAt: Date              // Когда сбросится
            },
            monthly: {
                limit: Number,
                used: Number,
                resetAt: Date
            },
            perTransaction: {
                min: Number,               // Минимальная сумма вывода
                max: Number                // Максимальная сумма вывода
            }
        },

        // Лимиты на платежи
        payment: {
            daily: {
                limit: Number,
                used: Number,
                resetAt: Date
            },
            perTransaction: {
                max: Number
            }
        },

        // Минимальный баланс
        minBalance: Number                 // Минимальный остаток на счете
    },

    // Настройки вывода средств
    withdrawalSettings: {
        // Автоматический вывод
        autoWithdrawal: {
            enabled: Boolean,
            threshold: Number,             // Порог для автовывода
            schedule: String               // daily, weekly, monthly
        },

        // Способы вывода
        methods: [{
            type: String,                  // card, bank_transfer
            isDefault: Boolean,
            isVerified: Boolean,

            // Данные карты
            card: {
                number: String,            // Маскированный номер
                holder: String,
                bank: String,
                expiryMonth: Number,
                expiryYear: Number
            },

            // Банковский счет
            bankAccount: {
                accountNumber: String,
                bankName: String,
                bankCode: String,
                recipientName: String
            },

            verifiedAt: Date,
            addedAt: Date
        }],

        // Комиссии за вывод
        fees: {
            percentage: Number,            // Процент комиссии
            fixed: Number,                 // Фиксированная комиссия
            min: Number,                   // Минимальная комиссия
            max: Number                    // Максимальная комиссия
        }
    },

    // Статистика
    statistics: {
        // Общая статистика
        lifetime: {
            totalReceived: Number,         // Всего получено
            totalSpent: Number,            // Всего потрачено
            totalWithdrawn: Number,        // Всего выведено
            totalCommissionPaid: Number,   // Всего комиссий уплачено
            totalBonusReceived: Number,    // Всего бонусов получено
            totalCashbackReceived: Number  // Всего кэшбэка получено
        },

        // Месячная статистика
        monthly: {
            income: Number,                // Доход за месяц
            expenses: Number,              // Расходы за месяц
            withdrawals: Number,           // Выводы за месяц

            // По типам транзакций
            byType: {
                [PAYMENT_TYPES.ORDER_PAYMENT]: Number,
                [PAYMENT_TYPES.WITHDRAWAL]: Number,
                [PAYMENT_TYPES.COMMISSION]: Number,
                [PAYMENT_TYPES.BONUS]: Number,
                [PAYMENT_TYPES.CASHBACK]: Number
            }
        },

        // Счетчики
        counters: {
            totalTransactions: Number,     // Всего транзакций
            successfulWithdrawals: Number, // Успешных выводов
            failedWithdrawals: Number,     // Неудачных выводов
            disputes: Number               // Споров
        },

        // Последнее обновление
        lastCalculatedAt: Date
    },

    // Настройки уведомлений
    notifications: {
        // Уведомления о балансе
        balance: {
            lowBalanceAlert: {
                enabled: Boolean,
                threshold: Number          // Порог для уведомления
            },
            largeTransaction: {
                enabled: Boolean,
                threshold: Number          // Порог для уведомления о крупной транзакции
            }
        },

        // Уведомления о транзакциях
        transactions: {
            incoming: Boolean,             // Уведомлять о поступлениях
            outgoing: Boolean,             // Уведомлять о списаниях
            withdrawals: Boolean           // Уведомлять о выводах
        }
    },

    // Безопасность
    security: {
        // PIN код для подтверждения операций
        pin: {
            hash: String,                  // Хэш PIN кода
            attempts: Number,              // Попытки ввода
            lockedUntil: Date,            // Заблокирован до
            lastChangedAt: Date
        },

        // Двухфакторная аутентификация для выводов
        twoFactorEnabled: Boolean,

        // Разрешенные IP для выводов (для бизнес-аккаунтов)
        allowedIPs: [String],

        // История подозрительных операций
        suspiciousActivities: [{
            type: String,                  // large_withdrawal, unusual_pattern
            description: String,
            amount: Number,
            timestamp: Date,
            resolved: Boolean
        }]
    },

    // Комиссии платформы
    platformFees: {
        // Для мастеров и СТО
        orderCommission: {
            percentage: Number,            // Процент с заказа
            min: Number,                   // Минимальная комиссия
            max: Number                    // Максимальная комиссия
        },

        // Специальные ставки
        specialRates: [{
            serviceType: String,           // Тип услуги
            percentage: Number,
            validFrom: Date,
            validUntil: Date
        }],

        // Льготный период
        gracePeriod: {
            enabled: Boolean,
            endsAt: Date,
            commission: Number             // Льготная комиссия
        }
    },

    // Бонусная программа
    bonusProgram: {
        // Правила начисления
        rules: {
            signupBonus: Number,           // Бонус за регистрацию
            referralBonus: Number,         // Бонус за реферала
            orderBonus: {
                percentage: Number,        // Процент от заказа
                min: Number,               // Минимальный бонус
                max: Number                // Максимальный бонус
            }
        },

        // История начислений
        history: [{
            amount: Number,
            type: String,                  // signup, referral, order, promo
            referenceId: ObjectId,
            description: String,
            earnedAt: Date,
            expiresAt: Date               // Когда сгорят бонусы
        }],

        // Использование бонусов
        usage: {
            maxPercentagePerOrder: Number, // Макс % от заказа бонусами
            minOrderAmount: Number         // Мин. сумма заказа для использования
        }
    },

    // Кэшбэк программа
    cashbackProgram: {
        // Уровни кэшбэка
        levels: [{
            name: String,                  // bronze, silver, gold
            percentage: Number,            // Процент кэшбэка
            minMonthlySpend: Number,       // Минимальная трата в месяц
            benefits: [String]             // Дополнительные преимущества
        }],

        currentLevel: String,
        nextLevelProgress: Number,         // Прогресс до следующего уровня (0-100)

        // История кэшбэка
        history: [{
            amount: Number,
            orderId: ObjectId,
            percentage: Number,
            earnedAt: Date
        }]
    },

    // Связанные сущности
    related: {
        // Для эскроу счетов
        escrow: {
            orderId: ObjectId,
            buyerWalletId: ObjectId,
            sellerWalletId: ObjectId,
            releaseConditions: String,
            autoReleaseAt: Date
        }
    },

    // Метаданные
    metadata: {
        // Для интеграций
        externalId: String,                // ID во внешней системе
        externalSystem: String,            // Название системы

        // Дополнительные данные
        tags: [String],
        notes: String,
        customFields: Object
    },

    // Аудит
    audit: {
        createdBy: ObjectId,               // Кто создал
        lastModifiedBy: ObjectId,          // Кто последний изменял

        // Важные события
        events: [{
            type: String,                  // status_change, limit_change, security_change
            description: String,
            performedBy: ObjectId,
            timestamp: Date,
            details: Object
        }]
    },

    // Временные метки
    createdAt: Date,
    updatedAt: Date,
    lastActivityAt: Date,                  // Последняя транзакция
    closedAt: Date                         // Когда закрыт (если закрыт)
};

// Класс для работы с кошельками
class WalletModel {
    constructor(db) {
        this.collection = db.collection('wallets');
        this.setupIndexes();
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Уникальные индексы
            await this.collection.createIndex(
                { 'owner.userId': 1 },
                {
                    unique: true,
                    sparse: true,
                    partialFilterExpression: {
                        'owner.type': WALLET_TYPES.USER,
                        status: { $ne: WALLET_STATUS.CLOSED }
                    }
                }
            );

            await this.collection.createIndex(
                { 'owner.stoId': 1 },
                {
                    unique: true,
                    sparse: true,
                    partialFilterExpression: {
                        'owner.type': WALLET_TYPES.STO,
                        status: { $ne: WALLET_STATUS.CLOSED }
                    }
                }
            );

            // Составные индексы
            await this.collection.createIndex({ 'owner.type': 1, status: 1 });
            await this.collection.createIndex({ 'balance.total.available': -1 });
            await this.collection.createIndex({ lastActivityAt: -1 });

            // Индексы для поиска holds
            await this.collection.createIndex({ 'balance.held.details.referenceId': 1 });
            await this.collection.createIndex({ 'balance.held.details.expiresAt': 1 });

            // Индексы для статистики
            await this.collection.createIndex({ 'statistics.monthly.income': -1 });
            await this.collection.createIndex({ createdAt: -1 });

            // TTL индекс для автоматического разблокирования holds
            await this.collection.createIndex(
                { 'balance.held.details.expiresAt': 1 },
                { expireAfterSeconds: 0 }
            );

        } catch (error) {
            console.error('Error creating wallet indexes:', error);
        }
    }

    // Создание нового кошелька
    async create(walletData) {
        const now = new Date();

        const wallet = {
            _id: new ObjectId(),
            ...walletData,

            // Defaults
            currency: walletData.currency || 'UZS',
            status: walletData.status || WALLET_STATUS.ACTIVE,

            balance: {
                available: {
                    main: 0,
                    bonus: 0,
                    cashback: 0
                },
                held: {
                    total: 0,
                    details: []
                },
                pending: {
                    incoming: 0,
                    outgoing: 0
                },
                total: {
                    available: 0,
                    held: 0,
                    pending: 0,
                    overall: 0
                },
                ...walletData.balance
            },

            limits: {
                withdrawal: {
                    daily: {
                        limit: this.getDefaultLimit('withdrawal', 'daily', walletData.owner.type),
                        used: 0,
                        resetAt: this.getNextResetDate('daily')
                    },
                    monthly: {
                        limit: this.getDefaultLimit('withdrawal', 'monthly', walletData.owner.type),
                        used: 0,
                        resetAt: this.getNextResetDate('monthly')
                    },
                    perTransaction: {
                        min: 10000,    // 10,000 UZS
                        max: 5000000   // 5,000,000 UZS
                    }
                },
                payment: {
                    daily: {
                        limit: this.getDefaultLimit('payment', 'daily', walletData.owner.type),
                        used: 0,
                        resetAt: this.getNextResetDate('daily')
                    },
                    perTransaction: {
                        max: 10000000  // 10,000,000 UZS
                    }
                },
                minBalance: 0,
                ...walletData.limits
            },

            statistics: {
                lifetime: {
                    totalReceived: 0,
                    totalSpent: 0,
                    totalWithdrawn: 0,
                    totalCommissionPaid: 0,
                    totalBonusReceived: 0,
                    totalCashbackReceived: 0
                },
                monthly: {
                    income: 0,
                    expenses: 0,
                    withdrawals: 0,
                    byType: {}
                },
                counters: {
                    totalTransactions: 0,
                    successfulWithdrawals: 0,
                    failedWithdrawals: 0,
                    disputes: 0
                },
                ...walletData.statistics
            },

            notifications: {
                balance: {
                    lowBalanceAlert: {
                        enabled: true,
                        threshold: 50000  // 50,000 UZS
                    },
                    largeTransaction: {
                        enabled: true,
                        threshold: 1000000  // 1,000,000 UZS
                    }
                },
                transactions: {
                    incoming: true,
                    outgoing: true,
                    withdrawals: true
                },
                ...walletData.notifications
            },

            security: {
                pin: {
                    attempts: 0
                },
                twoFactorEnabled: false,
                allowedIPs: [],
                suspiciousActivities: [],
                ...walletData.security
            },

            createdAt: now,
            updatedAt: now,
            lastActivityAt: now
        };

        // Пересчет общих балансов
        wallet.balance.total = this.calculateTotalBalances(wallet.balance);

        const result = await this.collection.insertOne(wallet);
        return { ...wallet, _id: result.insertedId };
    }

    // Поиск кошелька по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    // Поиск кошелька пользователя
    async findByUserId(userId) {
        return await this.collection.findOne({
            'owner.type': WALLET_TYPES.USER,
            'owner.userId': new ObjectId(userId),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    // Поиск кошелька СТО
    async findByStoId(stoId) {
        return await this.collection.findOne({
            'owner.type': WALLET_TYPES.STO,
            'owner.stoId': new ObjectId(stoId),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    // Обновление баланса (атомарная операция)
    async updateBalance(walletId, updates) {
        const updateQuery = {
            $set: {
                updatedAt: new Date(),
                lastActivityAt: new Date()
            }
        };

        // Обновление доступных балансов
        if (updates.available) {
            Object.entries(updates.available).forEach(([type, delta]) => {
                if (delta !== 0) {
                    updateQuery.$inc = updateQuery.$inc || {};
                    updateQuery.$inc[`balance.available.${type}`] = delta;
                    updateQuery.$inc['balance.total.available'] = delta;
                    updateQuery.$inc['balance.total.overall'] = delta;
                }
            });
        }

        // Обновление ожидающих
        if (updates.pending) {
            Object.entries(updates.pending).forEach(([direction, delta]) => {
                if (delta !== 0) {
                    updateQuery.$inc = updateQuery.$inc || {};
                    updateQuery.$inc[`balance.pending.${direction}`] = delta;

                    const pendingDelta = direction === 'incoming' ? delta : -delta;
                    updateQuery.$inc['balance.total.pending'] = pendingDelta;
                    updateQuery.$inc['balance.total.overall'] = pendingDelta;
                }
            });
        }

        // Добавление hold
        if (updates.addHold) {
            updateQuery.$push = {
                'balance.held.details': {
                    ...updates.addHold,
                    createdAt: new Date()
                }
            };
            updateQuery.$inc = updateQuery.$inc || {};
            updateQuery.$inc['balance.held.total'] = updates.addHold.amount;
            updateQuery.$inc['balance.total.held'] = updates.addHold.amount;
        }

        // Удаление hold
        if (updates.removeHold) {
            updateQuery.$pull = {
                'balance.held.details': {
                    _id: new ObjectId(updates.removeHold.holdId)
                }
            };
            updateQuery.$inc = updateQuery.$inc || {};
            updateQuery.$inc['balance.held.total'] = -updates.removeHold.amount;
            updateQuery.$inc['balance.total.held'] = -updates.removeHold.amount;
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(walletId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Блокировка средств
    async holdFunds(walletId, holdData) {
        const hold = {
            _id: new ObjectId(),
            amount: holdData.amount,
            reason: holdData.reason,
            referenceId: holdData.referenceId,
            referenceType: holdData.referenceType,
            description: holdData.description,
            createdAt: new Date(),
            expiresAt: holdData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа по умолчанию
        };

        // Проверяем достаточность средств
        const wallet = await this.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.balance.available.main < holdData.amount) {
            throw new Error('Insufficient funds');
        }

        // Блокируем средства
        return await this.updateBalance(walletId, {
            available: { main: -holdData.amount },
            addHold: hold
        });
    }

    // Разблокировка средств
    async releaseFunds(walletId, holdId, releaseToAvailable = true) {
        const wallet = await this.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const hold = wallet.balance.held.details.find(h =>
            h._id.toString() === holdId.toString()
        );

        if (!hold) {
            throw new Error('Hold not found');
        }

        const updates = {
            removeHold: {
                holdId: hold._id,
                amount: hold.amount
            }
        };

        // Возвращаем в доступный баланс если указано
        if (releaseToAvailable) {
            updates.available = { main: hold.amount };
        }

        return await this.updateBalance(walletId, updates);
    }

    // Обновление статистики
    async updateStatistics(walletId, transaction) {
        const { type, amount } = transaction;
        const isIncoming = [
            PAYMENT_TYPES.ORDER_PAYMENT,
            PAYMENT_TYPES.TOP_UP,
            PAYMENT_TYPES.BONUS,
            PAYMENT_TYPES.CASHBACK,
            PAYMENT_TYPES.REFUND
        ].includes(type);

        const updateQuery = {
            $inc: {
                'statistics.counters.totalTransactions': 1
            },
            $set: {
                'statistics.lastCalculatedAt': new Date()
            }
        };

        if (isIncoming) {
            updateQuery.$inc['statistics.lifetime.totalReceived'] = amount;
            updateQuery.$inc['statistics.monthly.income'] = amount;
        } else {
            updateQuery.$inc['statistics.lifetime.totalSpent'] = amount;
            updateQuery.$inc['statistics.monthly.expenses'] = amount;
        }

        // Специфичные обновления по типам
        if (type === PAYMENT_TYPES.WITHDRAWAL) {
            updateQuery.$inc['statistics.lifetime.totalWithdrawn'] = amount;
            updateQuery.$inc['statistics.monthly.withdrawals'] = amount;
            updateQuery.$inc['statistics.counters.successfulWithdrawals'] = 1;
        }

        if (type === PAYMENT_TYPES.COMMISSION) {
            updateQuery.$inc['statistics.lifetime.totalCommissionPaid'] = amount;
        }

        if (type === PAYMENT_TYPES.BONUS) {
            updateQuery.$inc['statistics.lifetime.totalBonusReceived'] = amount;
        }

        if (type === PAYMENT_TYPES.CASHBACK) {
            updateQuery.$inc['statistics.lifetime.totalCashbackReceived'] = amount;
        }

        // Обновление статистики по типам
        updateQuery.$inc[`statistics.monthly.byType.${type}`] = amount;

        return await this.collection.updateOne(
            { _id: new ObjectId(walletId) },
            updateQuery
        );
    }

    // Проверка лимитов
    async checkLimit(walletId, amount, limitType = 'withdrawal') {
        const wallet = await this.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const limits = wallet.limits[limitType];
        const errors = [];

        // Проверка дневного лимита
        if (limits.daily && limits.daily.used + amount > limits.daily.limit) {
            errors.push({
                type: 'daily_limit',
                message: `Превышен дневной лимит. Доступно: ${limits.daily.limit - limits.daily.used}`
            });
        }

        // Проверка месячного лимита
        if (limits.monthly && limits.monthly.used + amount > limits.monthly.limit) {
            errors.push({
                type: 'monthly_limit',
                message: `Превышен месячный лимит. Доступно: ${limits.monthly.limit - limits.monthly.used}`
            });
        }

        // Проверка лимитов транзакции
        if (limits.perTransaction) {
            if (limits.perTransaction.min && amount < limits.perTransaction.min) {
                errors.push({
                    type: 'min_amount',
                    message: `Минимальная сумма: ${limits.perTransaction.min}`
                });
            }

            if (limits.perTransaction.max && amount > limits.perTransaction.max) {
                errors.push({
                    type: 'max_amount',
                    message: `Максимальная сумма: ${limits.perTransaction.max}`
                });
            }
        }

        return {
            allowed: errors.length === 0,
            errors,
            availableDaily: limits.daily ? limits.daily.limit - limits.daily.used : null,
            availableMonthly: limits.monthly ? limits.monthly.limit - limits.monthly.used : null
        };
    }

    // Обновление использованных лимитов
    async updateLimitUsage(walletId, amount, limitType = 'withdrawal') {
        const now = new Date();

        const wallet = await this.findById(walletId);
        if (!wallet) return;

        const updateQuery = {
            $inc: {},
            $set: { updatedAt: now }
        };

        // Проверяем и сбрасываем дневной лимит если нужно
        if (wallet.limits[limitType].daily.resetAt < now) {
            updateQuery.$set[`limits.${limitType}.daily.used`] = amount;
            updateQuery.$set[`limits.${limitType}.daily.resetAt`] = this.getNextResetDate('daily');
        } else {
            updateQuery.$inc[`limits.${limitType}.daily.used`] = amount;
        }

        // Проверяем и сбрасываем месячный лимит если нужно
        if (wallet.limits[limitType].monthly.resetAt < now) {
            updateQuery.$set[`limits.${limitType}.monthly.used`] = amount;
            updateQuery.$set[`limits.${limitType}.monthly.resetAt`] = this.getNextResetDate('monthly');
        } else {
            updateQuery.$inc[`limits.${limitType}.monthly.used`] = amount;
        }

        return await this.collection.updateOne(
            { _id: new ObjectId(walletId) },
            updateQuery
        );
    }

    // Вспомогательные методы

    // Расчет общих балансов
    calculateTotalBalances(balance) {
        const available = Object.values(balance.available).reduce((sum, val) => sum + val, 0);
        const held = balance.held.total || 0;
        const pending = (balance.pending.incoming || 0) - (balance.pending.outgoing || 0);

        return {
            available,
            held,
            pending,
            overall: available + held + pending
        };
    }

    // Получение дефолтных лимитов
    getDefaultLimit(limitType, period, ownerType) {
        const limits = {
            withdrawal: {
                daily: {
                    [WALLET_TYPES.USER]: 10000000,    // 10M UZS
                    [WALLET_TYPES.STO]: 50000000      // 50M UZS
                },
                monthly: {
                    [WALLET_TYPES.USER]: 100000000,   // 100M UZS
                    [WALLET_TYPES.STO]: 1000000000    // 1B UZS
                }
            },
            payment: {
                daily: {
                    [WALLET_TYPES.USER]: 50000000,    // 50M UZS
                    [WALLET_TYPES.STO]: 100000000     // 100M UZS
                }
            }
        };

        return limits[limitType]?.[period]?.[ownerType] || 0;
    }

    // Получение следующей даты сброса
    getNextResetDate(period) {
        const now = new Date();

        if (period === 'daily') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow;
        }

        if (period === 'monthly') {
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            nextMonth.setHours(0, 0, 0, 0);
            return nextMonth;
        }

        return now;
    }

    // Автоматическое освобождение истекших holds
    async releaseExpiredHolds() {
        const now = new Date();

        const walletsWithExpiredHolds = await this.collection.find({
            'balance.held.details.expiresAt': { $lte: now }
        }).toArray();

        for (const wallet of walletsWithExpiredHolds) {
            const expiredHolds = wallet.balance.held.details.filter(h => h.expiresAt <= now);

            for (const hold of expiredHolds) {
                try {
                    await this.releaseFunds(wallet._id, hold._id, true);
                } catch (error) {
                    console.error(`Failed to release expired hold ${hold._id}:`, error);
                }
            }
        }

        return walletsWithExpiredHolds.length;
    }
}

// Экспортируем
module.exports = {
    WalletModel,
    WALLET_TYPES,
    WALLET_STATUS,
    BALANCE_TYPES,
    HOLD_REASONS,
    walletSchema
};