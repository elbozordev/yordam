// src/models/transaction.model.js

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_TYPES, PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants/payment-status');
const { WALLET_TYPES } = require('./wallet.model');

// Направления транзакции
const TRANSACTION_DIRECTION = {
    DEBIT: 'debit',                       // Списание (-)
    CREDIT: 'credit'                       // Зачисление (+)
};

// Типы счетов
const ACCOUNT_TYPES = {
    WALLET: 'wallet',                      // Кошелек платформы
    EXTERNAL: 'external',                  // Внешний счет (карта, банк)
    SYSTEM: 'system',                      // Системный счет
    ESCROW: 'escrow'                       // Эскроу счет
};

// Категории транзакций для отчетности
const TRANSACTION_CATEGORIES = {
    PAYMENT: 'payment',                    // Платежи
    TRANSFER: 'transfer',                  // Переводы
    COMMISSION: 'commission',              // Комиссии
    REFUND: 'refund',                      // Возвраты
    ADJUSTMENT: 'adjustment',              // Корректировки
    WITHDRAWAL: 'withdrawal',              // Выводы
    TOPUP: 'topup'                        // Пополнения
};

// Статусы проверки транзакции
const VERIFICATION_STATUS = {
    PENDING: 'pending',                    // Ожидает проверки
    VERIFIED: 'verified',                  // Проверена
    FAILED: 'failed',                      // Проверка не пройдена
    SUSPICIOUS: 'suspicious'               // Подозрительная
};

// Схема транзакции
const transactionSchema = {
    _id: ObjectId,

    // Уникальный идентификатор транзакции
    transactionId: String,                 // Уникальный ID для внешних систем

    // Тип и категория
    type: String,                          // Из PAYMENT_TYPES
    category: String,                      // Из TRANSACTION_CATEGORIES
    status: String,                        // Из PAYMENT_STATUS

    // Сумма и валюта
    amount: {
        value: Number,                     // Сумма в минимальных единицах (тийин)
        currency: String,                  // Валюта (UZS)

        // Для конвертации
        originalValue: Number,             // Оригинальная сумма
        originalCurrency: String,          // Оригинальная валюта
        exchangeRate: Number               // Курс конвертации
    },

    // Источник транзакции (откуда)
    source: {
        type: String,                      // Из ACCOUNT_TYPES

        // Для кошельков платформы
        walletId: ObjectId,

        // Для внешних счетов
        external: {
            method: String,                // Из PAYMENT_METHODS

            // Карта
            card: {
                number: String,            // Маскированный номер (****1234)
                holder: String,
                bank: String,
                country: String,
                type: String,              // debit, credit
                brand: String              // visa, mastercard, uzcard
            },

            // Банковский счет
            bankAccount: {
                accountNumber: String,
                bankName: String,
                bankCode: String
            },

            // Электронный кошелек
            eWallet: {
                provider: String,          // payme, click, paynet
                accountId: String
            }
        },

        // Метаданные источника
        metadata: {
            ip: String,
            country: String,
            city: String
        }
    },

    // Назначение транзакции (куда)
    destination: {
        type: String,                      // Из ACCOUNT_TYPES
        walletId: ObjectId,

        external: {
            // Аналогично source.external
            method: String,
            card: Object,
            bankAccount: Object,
            eWallet: Object
        }
    },

    // Связи с другими сущностями
    references: {
        orderId: ObjectId,                 // Связь с заказом
        userId: ObjectId,                  // Пользователь-инициатор
        masterId: ObjectId,                // Мастер (если применимо)
        stoId: ObjectId,                   // СТО (если применимо)

        // Родительская транзакция (для связанных)
        parentTransactionId: ObjectId,

        // Дочерние транзакции
        childTransactions: [ObjectId],

        // Связанные транзакции (например, комиссии)
        relatedTransactions: [{
            transactionId: ObjectId,
            relation: String               // commission, refund, reversal
        }]
    },

    // Детали платежа
    paymentDetails: {
        // Метод оплаты
        method: String,                    // Из PAYMENT_METHODS

        // Детали провайдера
        provider: {
            name: String,                  // payme, click, stripe
            transactionId: String,         // ID в системе провайдера
            referenceNumber: String,       // Референс номер
            authorizationCode: String,     // Код авторизации
            rrn: String                    // Retrieval Reference Number
        },

        // 3D Secure
        threeDSecure: {
            required: Boolean,
            version: String,               // 1.0, 2.0
            status: String,                // authenticated, attempted, failed
            eci: String,                   // Electronic Commerce Indicator
            cavv: String,                  // Cardholder Authentication Verification Value
            xid: String                    // Transaction ID
        },

        // Дополнительная информация
        invoice: {
            number: String,
            date: Date,
            dueDate: Date
        },

        description: String,               // Описание платежа
        purposeCode: String               // Код назначения платежа
    },

    // Комиссии и разделение платежа
    fees: {
        // Комиссия платформы
        platform: {
            amount: Number,
            percentage: Number,
            fixed: Number,
            walletId: ObjectId            // Куда зачислена комиссия
        },

        // Комиссия платежной системы
        provider: {
            amount: Number,
            percentage: Number,
            description: String
        },

        // Комиссия банка
        bank: {
            amount: Number,
            description: String
        },

        // Общая комиссия
        total: Number
    },

    // Разделение платежа (split payment)
    splits: [{
        recipientId: ObjectId,             // Кошелек получателя
        recipientType: String,             // master, sto, platform
        amount: Number,                    // Сумма
        percentage: Number,                // Процент от общей суммы
        description: String,
        status: String,                    // pending, completed, failed

        // Связанная транзакция
        transactionId: ObjectId
    }],

    // Статус верификации
    verification: {
        status: String,                    // Из VERIFICATION_STATUS

        // Проверки
        checks: {
            cardVerification: Boolean,
            addressVerification: Boolean,
            cvvVerification: Boolean,
            fraudCheck: Boolean,
            amlCheck: Boolean,             // Anti-Money Laundering
            sanctionsCheck: Boolean
        },

        // Риск-скоринг
        riskScore: Number,                 // 0-100
        riskFactors: [String],

        // Результаты проверки
        verifiedAt: Date,
        verifiedBy: String                 // system, manual
    },

    // Возвраты и споры
    refund: {
        // Для возвратов
        originalTransactionId: ObjectId,   // Оригинальная транзакция
        reason: String,                    // Причина возврата
        requestedAt: Date,
        approvedAt: Date,
        approvedBy: ObjectId,

        // Частичный возврат
        isPartial: Boolean,
        refundedAmount: Number
    },

    dispute: {
        // Для спорных транзакций
        status: String,                    // open, investigating, resolved, closed
        reason: String,                    // fraud, service_not_provided, other

        openedAt: Date,
        openedBy: ObjectId,

        // Доказательства
        evidence: [{
            type: String,                  // document, photo, text
            url: String,
            description: String,
            uploadedAt: Date,
            uploadedBy: ObjectId
        }],

        // Решение
        resolution: {
            decision: String,              // refund, reject, partial_refund
            amount: Number,
            resolvedAt: Date,
            resolvedBy: ObjectId,
            notes: String
        }
    },

    // Метаданные
    metadata: {
        // Источник транзакции
        source: String,                    // api, web, mobile, system
        apiVersion: String,
        clientVersion: String,

        // Геолокация
        location: {
            ip: String,
            country: String,
            city: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },

        // Устройство
        device: {
            id: String,
            type: String,                  // mobile, desktop
            model: String,
            os: String,
            browser: String
        },

        // Сессия
        sessionId: String,
        requestId: String,

        // Дополнительные данные
        customData: Object,
        tags: [String]
    },

    // Временные метки
    timestamps: {
        createdAt: Date,                   // Создана
        initiatedAt: Date,                 // Инициирована
        processedAt: Date,                 // Обработана
        completedAt: Date,                 // Завершена
        failedAt: Date,                    // Провалена
        cancelledAt: Date,                 // Отменена
        refundedAt: Date                   // Возвращена
    },

    // Попытки обработки
    processing: {
        attempts: Number,                  // Количество попыток
        lastAttemptAt: Date,
        nextRetryAt: Date,

        // История попыток
        history: [{
            attemptNumber: Number,
            timestamp: Date,
            status: String,
            errorCode: String,
            errorMessage: String,
            duration: Number               // Время обработки в мс
        }],

        // Конфигурация повторов
        retryConfig: {
            maxAttempts: Number,
            backoffMultiplier: Number,
            maxBackoffSeconds: Number
        }
    },

    // Уведомления
    notifications: {
        // Отправленные уведомления
        sent: [{
            type: String,                  // email, sms, push
            recipient: String,
            sentAt: Date,
            status: String,                // sent, delivered, failed
            template: String
        }],

        // Webhook вызовы
        webhooks: [{
            url: String,
            sentAt: Date,
            responseCode: Number,
            responseTime: Number,
            success: Boolean
        }]
    },

    // Бухгалтерская информация
    accounting: {
        // Проводки
        entries: [{
            accountType: String,           // debit, credit
            accountCode: String,           // Код счета
            amount: Number,
            description: String
        }],

        // Налоги
        tax: {
            amount: Number,
            rate: Number,
            type: String                   // vat, income_tax
        },

        // Отчетный период
        period: {
            year: Number,
            month: Number,
            quarter: Number
        },

        // Флаги
        isReconciled: Boolean,
        reconciledAt: Date,
        reconciledBy: ObjectId
    },

    // Безопасность
    security: {
        // Подпись транзакции
        signature: String,
        signatureAlgorithm: String,

        // Шифрование чувствительных данных
        encryptedData: String,
        encryptionKeyId: String,

        // Аудит
        auditLog: [{
            action: String,
            performedBy: ObjectId,
            performedAt: Date,
            ip: String,
            changes: Object
        }]
    },

    // Флаги
    flags: {
        isTest: Boolean,                   // Тестовая транзакция
        isRecurring: Boolean,              // Рекуррентный платеж
        isInstant: Boolean,                // Мгновенный платеж
        requiresApproval: Boolean,         // Требует одобрения
        isLargeAmount: Boolean,            // Крупная сумма
        isSuspicious: Boolean,             // Подозрительная
        isBlocked: Boolean,                // Заблокирована
        isReversed: Boolean                // Отменена
    },

    // Срок действия
    expiry: {
        expiresAt: Date,                   // Когда истекает
        expiredAt: Date,                   // Когда истекла
        autoExpire: Boolean                // Автоматическое истечение
    }
};

// Класс для работы с транзакциями
class TransactionModel {
    constructor(db) {
        this.collection = db.collection('transactions');
        this.setupIndexes();
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Уникальные индексы
            await this.collection.createIndex(
                { transactionId: 1 },
                { unique: true, sparse: true }
            );

            // Основные индексы
            await this.collection.createIndex({ status: 1, 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ type: 1, status: 1 });
            await this.collection.createIndex({ 'source.walletId': 1 });
            await this.collection.createIndex({ 'destination.walletId': 1 });

            // Индексы для связей
            await this.collection.createIndex({ 'references.orderId': 1 });
            await this.collection.createIndex({ 'references.userId': 1 });
            await this.collection.createIndex({ 'references.parentTransactionId': 1 });

            // Индексы для поиска
            await this.collection.createIndex({ 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ 'amount.value': -1 });
            await this.collection.createIndex({ 'paymentDetails.provider.name': 1 });

            // Составные индексы для отчетов
            await this.collection.createIndex({
                'references.userId': 1,
                status: 1,
                'timestamps.createdAt': -1
            });

            await this.collection.createIndex({
                'accounting.period.year': 1,
                'accounting.period.month': 1,
                status: 1
            });

            // Индексы для обработки
            await this.collection.createIndex({
                status: 1,
                'processing.nextRetryAt': 1
            });

            // TTL индекс для истекших транзакций
            await this.collection.createIndex(
                { 'expiry.expiresAt': 1 },
                { expireAfterSeconds: 0 }
            );

        } catch (error) {
            console.error('Error creating transaction indexes:', error);
        }
    }

    // Создание новой транзакции
    async create(transactionData) {
        const now = new Date();

        // Генерация уникального ID транзакции
        const transactionId = transactionData.transactionId || this.generateTransactionId();

        const transaction = {
            _id: new ObjectId(),
            transactionId,
            ...transactionData,

            // Defaults
            status: transactionData.status || PAYMENT_STATUS.PENDING,
            category: transactionData.category || this.determineCategory(transactionData.type),

            amount: {
                currency: 'UZS',
                ...transactionData.amount
            },

            fees: {
                platform: { amount: 0 },
                provider: { amount: 0 },
                bank: { amount: 0 },
                total: 0,
                ...transactionData.fees
            },

            verification: {
                status: VERIFICATION_STATUS.PENDING,
                checks: {},
                riskScore: 0,
                riskFactors: [],
                ...transactionData.verification
            },

            processing: {
                attempts: 0,
                history: [],
                retryConfig: {
                    maxAttempts: 3,
                    backoffMultiplier: 2,
                    maxBackoffSeconds: 300
                },
                ...transactionData.processing
            },

            timestamps: {
                createdAt: now,
                initiatedAt: now,
                ...transactionData.timestamps
            },

            flags: {
                isTest: false,
                isRecurring: false,
                isInstant: false,
                requiresApproval: false,
                isLargeAmount: transactionData.amount?.value > 10000000, // 10M UZS
                isSuspicious: false,
                isBlocked: false,
                isReversed: false,
                ...transactionData.flags
            }
        };

        // Расчет общей комиссии
        transaction.fees.total =
            (transaction.fees.platform?.amount || 0) +
            (transaction.fees.provider?.amount || 0) +
            (transaction.fees.bank?.amount || 0);

        const result = await this.collection.insertOne(transaction);
        return { ...transaction, _id: result.insertedId };
    }

    // Поиск транзакции по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id)
        });
    }

    // Поиск транзакции по transactionId
    async findByTransactionId(transactionId) {
        return await this.collection.findOne({ transactionId });
    }

    // Поиск транзакций кошелька
    async findByWalletId(walletId, options = {}) {
        const {
            direction = 'both', // both, credit, debit
            statuses = null,
            types = null,
            startDate = null,
            endDate = null,
            limit = 100,
            offset = 0
        } = options;

        const query = {
            $or: []
        };

        // Направление
        if (direction === 'both' || direction === 'credit') {
            query.$or.push({ 'destination.walletId': new ObjectId(walletId) });
        }
        if (direction === 'both' || direction === 'debit') {
            query.$or.push({ 'source.walletId': new ObjectId(walletId) });
        }

        // Фильтры
        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        if (types && types.length > 0) {
            query.type = { $in: types };
        }

        if (startDate || endDate) {
            query['timestamps.createdAt'] = {};
            if (startDate) query['timestamps.createdAt'].$gte = startDate;
            if (endDate) query['timestamps.createdAt'].$lte = endDate;
        }

        return await this.collection
            .find(query)
            .sort({ 'timestamps.createdAt': -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
    }

    // Обновление статуса транзакции
    async updateStatus(transactionId, newStatus, details = {}) {
        const now = new Date();
        const updateQuery = {
            $set: {
                status: newStatus,
                [`timestamps.${newStatus}At`]: now
            }
        };

        // Добавляем в историю обработки
        if (details.error) {
            updateQuery.$push = {
                'processing.history': {
                    attemptNumber: details.attemptNumber || 1,
                    timestamp: now,
                    status: newStatus,
                    errorCode: details.error.code,
                    errorMessage: details.error.message,
                    duration: details.duration
                }
            };
            updateQuery.$inc = { 'processing.attempts': 1 };
        }

        // Обновляем временные метки
        const timestampMap = {
            [PAYMENT_STATUS.PROCESSING]: 'processedAt',
            [PAYMENT_STATUS.COMPLETED]: 'completedAt',
            [PAYMENT_STATUS.FAILED]: 'failedAt',
            [PAYMENT_STATUS.CANCELLED]: 'cancelledAt',
            [PAYMENT_STATUS.REFUNDED]: 'refundedAt'
        };

        if (timestampMap[newStatus]) {
            updateQuery.$set[`timestamps.${timestampMap[newStatus]}`] = now;
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(transactionId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Создание связанной транзакции (например, комиссии)
    async createRelatedTransaction(parentTransactionId, relatedData) {
        const parentTransaction = await this.findById(parentTransactionId);
        if (!parentTransaction) {
            throw new Error('Parent transaction not found');
        }

        const relatedTransaction = await this.create({
            ...relatedData,
            references: {
                ...relatedData.references,
                parentTransactionId: parentTransaction._id,
                orderId: parentTransaction.references.orderId,
                userId: parentTransaction.references.userId
            }
        });

        // Обновляем родительскую транзакцию
        await this.collection.updateOne(
            { _id: parentTransaction._id },
            {
                $push: {
                    'references.childTransactions': relatedTransaction._id,
                    'references.relatedTransactions': {
                        transactionId: relatedTransaction._id,
                        relation: relatedData.relation || 'related'
                    }
                }
            }
        );

        return relatedTransaction;
    }

    // Создание разделенных транзакций (split payment)
    async createSplitTransactions(mainTransactionId, splits) {
        const mainTransaction = await this.findById(mainTransactionId);
        if (!mainTransaction) {
            throw new Error('Main transaction not found');
        }

        const splitTransactions = [];

        for (const split of splits) {
            const splitTransaction = await this.create({
                type: PAYMENT_TYPES.TRANSFER,
                amount: {
                    value: split.amount,
                    currency: mainTransaction.amount.currency
                },
                source: {
                    type: ACCOUNT_TYPES.SYSTEM,
                    walletId: mainTransaction.destination.walletId
                },
                destination: {
                    type: ACCOUNT_TYPES.WALLET,
                    walletId: split.recipientId
                },
                references: {
                    parentTransactionId: mainTransaction._id,
                    orderId: mainTransaction.references.orderId
                },
                paymentDetails: {
                    description: split.description || `Split payment from ${mainTransaction.transactionId}`
                }
            });

            splitTransactions.push(splitTransaction);

            // Обновляем информацию о split в основной транзакции
            await this.collection.updateOne(
                { _id: mainTransaction._id, 'splits._id': split._id },
                {
                    $set: {
                        'splits.$.status': 'completed',
                        'splits.$.transactionId': splitTransaction._id
                    }
                }
            );
        }

        return splitTransactions;
    }

    // Создание транзакции возврата
    async createRefundTransaction(originalTransactionId, refundData) {
        const originalTransaction = await this.findById(originalTransactionId);
        if (!originalTransaction) {
            throw new Error('Original transaction not found');
        }

        if (originalTransaction.status !== PAYMENT_STATUS.COMPLETED) {
            throw new Error('Can only refund completed transactions');
        }

        const refundAmount = refundData.amount || originalTransaction.amount.value;
        const isPartial = refundAmount < originalTransaction.amount.value;

        const refundTransaction = await this.create({
            type: PAYMENT_TYPES.REFUND,
            amount: {
                value: refundAmount,
                currency: originalTransaction.amount.currency
            },
            source: originalTransaction.destination,
            destination: originalTransaction.source,
            references: {
                parentTransactionId: originalTransaction._id,
                orderId: originalTransaction.references.orderId,
                userId: originalTransaction.references.userId
            },
            paymentDetails: {
                method: originalTransaction.paymentDetails.method,
                provider: originalTransaction.paymentDetails.provider,
                description: refundData.description || 'Refund'
            },
            refund: {
                originalTransactionId: originalTransaction._id,
                reason: refundData.reason,
                requestedAt: new Date(),
                isPartial,
                refundedAmount: refundAmount
            }
        });

        // Обновляем оригинальную транзакцию
        await this.collection.updateOne(
            { _id: originalTransaction._id },
            {
                $set: {
                    'flags.isReversed': !isPartial,
                    'timestamps.refundedAt': new Date()
                },
                $push: {
                    'references.relatedTransactions': {
                        transactionId: refundTransaction._id,
                        relation: 'refund'
                    }
                }
            }
        );

        return refundTransaction;
    }

    // Поиск транзакций для повторной обработки
    async findTransactionsForRetry() {
        const now = new Date();

        return await this.collection.find({
            status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
            'processing.nextRetryAt': { $lte: now },
            'processing.attempts': { $lt: '$processing.retryConfig.maxAttempts' },
            'flags.isBlocked': { $ne: true }
        }).toArray();
    }

    // Расчет следующего времени повтора
    calculateNextRetryTime(attempts, config) {
        const backoffSeconds = Math.min(
            Math.pow(config.backoffMultiplier, attempts) * 10,
            config.maxBackoffSeconds
        );

        return new Date(Date.now() + backoffSeconds * 1000);
    }

    // Генерация уникального ID транзакции
    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `TXN${timestamp}${random}`.toUpperCase();
    }

    // Определение категории транзакции
    determineCategory(type) {
        const categoryMap = {
            [PAYMENT_TYPES.ORDER_PAYMENT]: TRANSACTION_CATEGORIES.PAYMENT,
            [PAYMENT_TYPES.WITHDRAWAL]: TRANSACTION_CATEGORIES.WITHDRAWAL,
            [PAYMENT_TYPES.COMMISSION]: TRANSACTION_CATEGORIES.COMMISSION,
            [PAYMENT_TYPES.REFUND]: TRANSACTION_CATEGORIES.REFUND,
            [PAYMENT_TYPES.TOP_UP]: TRANSACTION_CATEGORIES.TOPUP,
            [PAYMENT_TYPES.TRANSFER]: TRANSACTION_CATEGORIES.TRANSFER,
            [PAYMENT_TYPES.ADJUSTMENT]: TRANSACTION_CATEGORIES.ADJUSTMENT
        };

        return categoryMap[type] || TRANSACTION_CATEGORIES.PAYMENT;
    }

    // Агрегация транзакций для отчетов
    async aggregateTransactions(filters = {}) {
        const pipeline = [];

        // Фильтры
        const match = {};
        if (filters.startDate || filters.endDate) {
            match['timestamps.createdAt'] = {};
            if (filters.startDate) match['timestamps.createdAt'].$gte = filters.startDate;
            if (filters.endDate) match['timestamps.createdAt'].$lte = filters.endDate;
        }
        if (filters.status) match.status = filters.status;
        if (filters.type) match.type = filters.type;

        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        // Группировка
        pipeline.push({
            $group: {
                _id: {
                    type: '$type',
                    status: '$status'
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount.value' },
                avgAmount: { $avg: '$amount.value' },
                totalFees: { $sum: '$fees.total' }
            }
        });

        // Сортировка
        pipeline.push({ $sort: { totalAmount: -1 } });

        return await this.collection.aggregate(pipeline).toArray();
    }
}

// Экспортируем
module.exports = {
    TransactionModel,
    TRANSACTION_DIRECTION,
    ACCOUNT_TYPES,
    TRANSACTION_CATEGORIES,
    VERIFICATION_STATUS,
    transactionSchema
};