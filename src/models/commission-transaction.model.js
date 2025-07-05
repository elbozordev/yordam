// src/models/commission-transaction.model.js

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_STATUS, PAYMENT_TYPES } = require('../utils/constants/payment-status');
const { COMMISSION_TYPES, COMMISSION_CATEGORIES, COMMISSION_TARGETS } = require('../utils/constants/commission-types');
const { COMMISSION_STATUS } = require('../utils/constants/commission-status');
const { USER_ROLES } = require('../utils/constants/user-roles');

// Источники комиссионных транзакций
const COMMISSION_SOURCES = {
    ORDER: 'order',                         // Комиссия с заказа
    WITHDRAWAL: 'withdrawal',               // Комиссия за вывод средств
    PENALTY: 'penalty',                     // Штрафная комиссия
    ADJUSTMENT: 'adjustment',               // Корректировка комиссии
    SUBSCRIPTION: 'subscription',           // Подписка/абонплата
    PROMOTION: 'promotion'                  // Промо комиссия
};

// Методы расчета комиссии
const CALCULATION_METHODS = {
    STANDARD: 'standard',                   // Стандартный расчет
    TIERED: 'tiered',                      // Многоуровневый
    VOLUME_BASED: 'volume_based',           // На основе объема
    TIME_BASED: 'time_based',               // На основе времени
    CUSTOM: 'custom'                        // Кастомный расчет
};

// Статусы обработки комиссии
const PROCESSING_STATUS = {
    CALCULATED: 'calculated',               // Рассчитана
    APPLIED: 'applied',                     // Применена
    DISTRIBUTED: 'distributed',             // Распределена
    SETTLED: 'settled',                     // Исполнена
    REVERSED: 'reversed',                   // Отменена
    DISPUTED: 'disputed'                    // Оспорена
};

// Схема транзакции комиссии
const commissionTransactionSchema = {
    _id: ObjectId,

    // Уникальный идентификатор транзакции
    transactionId: String,                  // Уникальный ID транзакции
    commissionId: String,                   // ID комиссии для внешних систем

    // Основная информация
    source: String,                         // Из COMMISSION_SOURCES
    type: String,                           // Из COMMISSION_TYPES
    category: String,                       // Из COMMISSION_CATEGORIES
    status: String,                         // Из PROCESSING_STATUS

    // Связи с другими сущностями
    references: {
        // Основная транзакция
        parentTransactionId: ObjectId,      // ID родительской транзакции

        // Заказ (если применимо)
        orderId: ObjectId,
        orderNumber: String,                // Для быстрого поиска

        // Участники
        payerId: ObjectId,                  // Кто платит комиссию
        payerType: String,                  // master, sto, client
        payerRole: String,                  // Из USER_ROLES

        // Получатель комиссии (обычно платформа)
        recipientId: ObjectId,              // ID получателя
        recipientType: String,              // platform, partner

        // Дополнительные связи
        stoId: ObjectId,                    // Если связано с СТО
        masterId: ObjectId,                 // Если связано с мастером

        // Связанные комиссионные транзакции
        relatedCommissions: [ObjectId]      // Например, при split
    },

    // Детали расчета
    calculation: {
        // Метод расчета
        method: String,                     // Из CALCULATION_METHODS

        // Базовая сумма для расчета
        baseAmount: Number,                 // Сумма, от которой считается комиссия
        baseCurrency: String,               // Валюта базовой суммы

        // Параметры расчета
        rate: {
            percentage: Number,             // Процентная ставка
            fixed: Number,                  // Фиксированная сумма

            // Для tiered
            tiers: [{
                from: Number,
                to: Number,
                rate: Number
            }],

            // Источник ставки
            source: String,                 // config, override, promo
            rateId: ObjectId               // ID ставки из commission-rate
        },

        // Модификаторы
        modifiers: {
            // Множители
            surgeMultiplier: Number,        // Surge pricing
            volumeMultiplier: Number,       // Объемная скидка
            timeMultiplier: Number,         // Временной множитель
            customMultiplier: Number,       // Кастомный множитель

            // Скидки/надбавки
            discounts: [{
                type: String,               // volume, promo, loyalty
                amount: Number,
                percentage: Number,
                reason: String
            }],

            penalties: [{
                type: String,               // cancellation, low_rating
                amount: Number,
                percentage: Number,
                reason: String
            }]
        },

        // Детальный расчет
        breakdown: {
            baseCommission: Number,         // Базовая комиссия
            surgeAmount: Number,            // Surge надбавка
            discountAmount: Number,         // Сумма скидок
            penaltyAmount: Number,          // Сумма штрафов
            adjustmentAmount: Number,       // Корректировки

            // Промежуточные расчеты
            subtotal: Number,               // До округления
            roundingAmount: Number,         // Сумма округления

            // НДС
            vatRate: Number,                // Ставка НДС
            vatAmount: Number,              // Сумма НДС

            // Итог
            total: Number                   // Итоговая комиссия
        },

        // Валидация расчета
        validation: {
            minAmount: Number,              // Минимальная комиссия
            maxAmount: Number,              // Максимальная комиссия
            wasLimited: Boolean,            // Была ли применена граница
            originalAmount: Number          // Сумма до применения лимитов
        },

        // Когда рассчитано
        calculatedAt: Date,
        calculatedBy: String               // system, manual, override
    },

    // Итоговая комиссия
    amount: {
        value: Number,                      // Итоговая сумма комиссии
        currency: String,                   // Валюта (UZS)

        // Для конвертации
        originalValue: Number,              // Если была конвертация
        originalCurrency: String,
        exchangeRate: Number,

        // Составляющие
        components: {
            platform: Number,               // Доля платформы
            referral: Number,               // Реферальные выплаты
            marketing: Number,              // Маркетинговый фонд
            reserve: Number                 // Резерв
        }
    },

    // Распределение комиссии
    distribution: {
        // Правила распределения
        rules: {
            platformShare: Number,          // Доля платформы (0.7 = 70%)
            referralShare: Number,          // Доля рефералов
            marketingShare: Number,         // Доля маркетинга
            reserveShare: Number            // Доля резерва
        },

        // Получатели
        recipients: [{
            recipientId: ObjectId,          // ID получателя
            recipientType: String,          // platform, referrer, fund

            share: Number,                  // Доля (0.5 = 50%)
            amount: Number,                 // Сумма

            // Кошелек для зачисления
            walletId: ObjectId,

            // Статус распределения
            status: String,                 // pending, completed
            distributedAt: Date,

            // Связанная транзакция
            transactionId: ObjectId
        }],

        // Статус распределения
        status: String,                     // pending, partial, completed
        completedAt: Date
    },

    // Обработка и исполнение
    processing: {
        // Этапы обработки
        stages: {
            calculated: {
                completed: Boolean,
                timestamp: Date,
                details: Object
            },
            validated: {
                completed: Boolean,
                timestamp: Date,
                errors: [String]
            },
            applied: {
                completed: Boolean,
                timestamp: Date,
                walletTransactions: [ObjectId]
            },
            distributed: {
                completed: Boolean,
                timestamp: Date,
                distributions: Number       // Количество распределений
            },
            settled: {
                completed: Boolean,
                timestamp: Date,
                settlementId: String
            }
        },

        // Автоматическая обработка
        automation: {
            enabled: Boolean,
            processAfter: Date,             // Когда обработать
            retryCount: Number,
            lastRetryAt: Date,
            nextRetryAt: Date
        },

        // Ошибки обработки
        errors: [{
            stage: String,
            code: String,
            message: String,
            timestamp: Date,
            resolved: Boolean
        }]
    },

    // Оспаривание и корректировки
    adjustments: {
        // История корректировок
        history: [{
            type: String,                   // refund, correction, penalty
            amount: Number,
            reason: String,

            // До и после
            previousAmount: Number,
            newAmount: Number,

            // Кто и когда
            adjustedBy: ObjectId,
            adjustedByRole: String,
            adjustedAt: Date,

            // Подтверждение
            approved: Boolean,
            approvedBy: ObjectId,
            approvedAt: Date
        }],

        // Споры
        disputes: [{
            status: String,                 // open, investigating, resolved
            reason: String,
            description: String,

            openedBy: ObjectId,
            openedAt: Date,

            // Доказательства
            evidence: [{
                type: String,
                url: String,
                description: String,
                uploadedAt: Date
            }],

            // Решение
            resolution: {
                decision: String,           // refund, reject, partial
                amount: Number,             // Сумма корректировки
                comment: String,
                resolvedBy: ObjectId,
                resolvedAt: Date
            }
        }],

        // Итоговые корректировки
        totalAdjustments: Number,           // Общая сумма корректировок
        finalAmount: Number                 // Итоговая сумма после корректировок
    },

    // Соответствие правилам
    compliance: {
        // Проверки
        checks: {
            rateCompliance: Boolean,        // Соответствует утвержденным ставкам
            limitCompliance: Boolean,       // В рамках лимитов
            policyCompliance: Boolean,      // Соответствует политикам

            // Детали несоответствий
            violations: [{
                type: String,
                rule: String,
                expected: Object,
                actual: Object,
                severity: String            // warning, error, critical
            }]
        },

        // Одобрения
        approvals: [{
            requiredFor: String,            // high_amount, policy_exception
            status: String,                 // pending, approved, rejected

            approvedBy: ObjectId,
            approvedByRole: String,
            approvedAt: Date,

            comment: String
        }],

        // Аудит флаги
        requiresReview: Boolean,
        reviewedBy: ObjectId,
        reviewedAt: Date
    },

    // Отчетность
    reporting: {
        // Период отчетности
        period: {
            year: Number,
            month: Number,
            quarter: Number,
            week: Number,
            day: Number
        },

        // Категоризация для отчетов
        categories: {
            service: String,                // Тип услуги
            region: String,                 // Регион
            executorType: String,           // Тип исполнителя
            customerSegment: String         // Сегмент клиента
        },

        // Флаги для отчетов
        flags: {
            isHighValue: Boolean,           // Крупная сумма
            isAbnormal: Boolean,            // Аномальная транзакция
            isTest: Boolean,                // Тестовая
            isExcludedFromReports: Boolean  // Исключить из отчетов
        },

        // Метрики
        metrics: {
            effectiveRate: Number,          // Эффективная ставка
            conversionTime: Number,         // Время от расчета до исполнения
            processingDuration: Number      // Длительность обработки
        }
    },

    // Уведомления
    notifications: {
        // Кому отправлять
        recipients: [{
            userId: ObjectId,
            role: String,
            channels: [String]              // email, sms, push
        }],

        // Отправленные уведомления
        sent: [{
            type: String,                   // calculated, distributed, disputed
            channel: String,
            recipient: String,
            sentAt: Date,
            status: String                  // sent, delivered, failed
        }]
    },

    // Метаданные
    metadata: {
        // Версия правил расчета
        rulesVersion: String,
        configVersion: String,

        // Источник
        source: String,                     // api, auto, manual, system
        sourceIp: String,
        userAgent: String,

        // Внешние ссылки
        externalReferences: {
            invoiceNumber: String,
            contractNumber: String,
            documentUrl: String
        },

        // Теги
        tags: [String],

        // Кастомные поля
        custom: Object,

        // Заметки
        notes: [{
            text: String,
            addedBy: ObjectId,
            addedAt: Date
        }]
    },

    // Временные метки
    timestamps: {
        createdAt: Date,
        calculatedAt: Date,
        appliedAt: Date,
        distributedAt: Date,
        settledAt: Date,
        reversedAt: Date,

        // Для периодических комиссий
        periodStart: Date,
        periodEnd: Date
    },

    // Служебные поля
    version: Number,                        // Версия документа
    isDeleted: Boolean,                     // Soft delete
    deletedAt: Date
};

// Класс для работы с комиссионными транзакциями
class CommissionTransactionModel {
    constructor(db) {
        this.collection = db.collection('commission_transactions');
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

            await this.collection.createIndex(
                { commissionId: 1 },
                { unique: true, sparse: true }
            );

            // Основные индексы для поиска
            await this.collection.createIndex({ status: 1, 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ 'references.orderId': 1 });
            await this.collection.createIndex({ 'references.parentTransactionId': 1 });
            await this.collection.createIndex({ 'references.payerId': 1, source: 1 });
            await this.collection.createIndex({ 'references.masterId': 1 });
            await this.collection.createIndex({ 'references.stoId': 1 });

            // Индексы для обработки
            await this.collection.createIndex({
                'processing.automation.enabled': 1,
                'processing.automation.processAfter': 1,
                status: 1
            });

            // Индексы для отчетности
            await this.collection.createIndex({
                'reporting.period.year': -1,
                'reporting.period.month': -1,
                source: 1
            });

            await this.collection.createIndex({
                'amount.value': -1,
                'timestamps.createdAt': -1
            });

            // Составные индексы для аналитики
            await this.collection.createIndex({
                source: 1,
                type: 1,
                status: 1,
                'timestamps.createdAt': -1
            });

            // Индексы для compliance
            await this.collection.createIndex({
                'compliance.requiresReview': 1,
                'compliance.reviewedAt': 1
            });

            // Индексы для споров
            await this.collection.createIndex({
                'adjustments.disputes.status': 1,
                'adjustments.disputes.openedAt': -1
            });

            // TTL индекс для архивации
            await this.collection.createIndex(
                { 'timestamps.createdAt': 1 },
                { expireAfterSeconds: 365 * 24 * 60 * 60 } // 1 год
            );

            console.log('✓ Commission transaction indexes created');
        } catch (error) {
            console.error('Error creating commission transaction indexes:', error);
        }
    }

    // Создание новой комиссионной транзакции
    async create(data) {
        const now = new Date();

        const transaction = {
            _id: new ObjectId(),
            transactionId: this.generateTransactionId(),
            commissionId: this.generateCommissionId(),

            ...data,

            // Defaults
            status: data.status || PROCESSING_STATUS.CALCULATED,

            calculation: {
                method: CALCULATION_METHODS.STANDARD,
                calculatedAt: now,
                calculatedBy: 'system',
                ...data.calculation,

                breakdown: {
                    baseCommission: 0,
                    surgeAmount: 0,
                    discountAmount: 0,
                    penaltyAmount: 0,
                    adjustmentAmount: 0,
                    subtotal: 0,
                    roundingAmount: 0,
                    vatAmount: 0,
                    total: 0,
                    ...data.calculation?.breakdown
                }
            },

            amount: {
                currency: 'UZS',
                ...data.amount,
                components: {
                    platform: 0,
                    referral: 0,
                    marketing: 0,
                    reserve: 0,
                    ...data.amount?.components
                }
            },

            processing: {
                stages: {
                    calculated: {
                        completed: true,
                        timestamp: now
                    },
                    validated: {
                        completed: false
                    },
                    applied: {
                        completed: false
                    },
                    distributed: {
                        completed: false
                    },
                    settled: {
                        completed: false
                    }
                },
                automation: {
                    enabled: true,
                    processAfter: new Date(now.getTime() + 60000), // 1 минута
                    retryCount: 0,
                    ...data.processing?.automation
                },
                errors: []
            },

            adjustments: {
                history: [],
                disputes: [],
                totalAdjustments: 0,
                finalAmount: data.amount?.value || 0
            },

            compliance: {
                checks: {
                    rateCompliance: true,
                    limitCompliance: true,
                    policyCompliance: true,
                    violations: []
                },
                approvals: [],
                requiresReview: false,
                ...data.compliance
            },

            reporting: {
                period: this.getPeriodFromDate(now),
                flags: {
                    isHighValue: (data.amount?.value || 0) > 1000000, // 1M UZS
                    isAbnormal: false,
                    isTest: false,
                    isExcludedFromReports: false
                },
                ...data.reporting
            },

            notifications: {
                recipients: [],
                sent: []
            },

            timestamps: {
                createdAt: now,
                calculatedAt: now,
                ...data.timestamps
            },

            version: 1,
            isDeleted: false
        };

        const result = await this.collection.insertOne(transaction);
        return { ...transaction, _id: result.insertedId };
    }

    // Поиск по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            isDeleted: { $ne: true }
        });
    }

    // Поиск по ID транзакции
    async findByTransactionId(transactionId) {
        return await this.collection.findOne({
            transactionId,
            isDeleted: { $ne: true }
        });
    }

    // Поиск комиссий по заказу
    async findByOrderId(orderId, options = {}) {
        const query = {
            'references.orderId': new ObjectId(orderId),
            isDeleted: { $ne: true }
        };

        if (options.status) {
            query.status = options.status;
        }

        return await this.collection
            .find(query)
            .sort({ 'timestamps.createdAt': -1 })
            .toArray();
    }

    // Поиск комиссий исполнителя
    async findByExecutorId(executorId, executorType = 'master', options = {}) {
        const {
            startDate,
            endDate,
            status,
            source,
            limit = 100,
            skip = 0
        } = options;

        const query = {
            isDeleted: { $ne: true }
        };

        // Фильтр по исполнителю
        if (executorType === 'master') {
            query['references.masterId'] = new ObjectId(executorId);
        } else {
            query['references.stoId'] = new ObjectId(executorId);
        }

        // Дополнительные фильтры
        if (status) query.status = status;
        if (source) query.source = source;

        if (startDate || endDate) {
            query['timestamps.createdAt'] = {};
            if (startDate) query['timestamps.createdAt'].$gte = startDate;
            if (endDate) query['timestamps.createdAt'].$lte = endDate;
        }

        return await this.collection
            .find(query)
            .sort({ 'timestamps.createdAt': -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    // Обновление статуса
    async updateStatus(id, newStatus, details = {}) {
        const updateData = {
            status: newStatus,
            [`processing.stages.${newStatus.toLowerCase()}`]: {
                completed: true,
                timestamp: new Date(),
                ...details
            }
        };

        // Обновляем временные метки
        const timestampMap = {
            [PROCESSING_STATUS.APPLIED]: 'appliedAt',
            [PROCESSING_STATUS.DISTRIBUTED]: 'distributedAt',
            [PROCESSING_STATUS.SETTLED]: 'settledAt',
            [PROCESSING_STATUS.REVERSED]: 'reversedAt'
        };

        if (timestampMap[newStatus]) {
            updateData[`timestamps.${timestampMap[newStatus]}`] = new Date();
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
    }

    // Применение корректировки
    async applyAdjustment(id, adjustment) {
        const commission = await this.findById(id);
        if (!commission) {
            throw new Error('Commission transaction not found');
        }

        const adjustmentRecord = {
            ...adjustment,
            previousAmount: commission.adjustments.finalAmount,
            newAmount: commission.adjustments.finalAmount + adjustment.amount,
            adjustedAt: new Date()
        };

        const updateData = {
            $push: {
                'adjustments.history': adjustmentRecord
            },
            $inc: {
                'adjustments.totalAdjustments': adjustment.amount
            },
            $set: {
                'adjustments.finalAmount': adjustmentRecord.newAmount,
                'compliance.requiresReview': true
            }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            updateData,
            { returnDocument: 'after' }
        );
    }

    // Добавление спора
    async addDispute(id, disputeData) {
        const dispute = {
            _id: new ObjectId(),
            status: 'open',
            ...disputeData,
            openedAt: new Date(),
            evidence: [],
            resolution: null
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $push: { 'adjustments.disputes': dispute },
                $set: {
                    status: PROCESSING_STATUS.DISPUTED,
                    'compliance.requiresReview': true
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Распределение комиссии
    async distributeCommission(id, distributionRules) {
        const commission = await this.findById(id);
        if (!commission) {
            throw new Error('Commission transaction not found');
        }

        const distributions = this.calculateDistribution(
            commission.amount.value,
            distributionRules
        );

        const recipients = distributions.map(dist => ({
            ...dist,
            status: 'pending',
            distributedAt: null
        }));

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    'distribution.recipients': recipients,
                    'distribution.status': 'pending'
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Поиск транзакций для автоматической обработки
    async findForProcessing() {
        const now = new Date();

        return await this.collection.find({
            'processing.automation.enabled': true,
            'processing.automation.processAfter': { $lte: now },
            status: { $in: [PROCESSING_STATUS.CALCULATED, PROCESSING_STATUS.APPLIED] },
            isDeleted: { $ne: true }
        }).toArray();
    }

    // Агрегация для отчетов
    async aggregateCommissions(filters = {}) {
        const pipeline = [];

        // Базовые фильтры
        const match = {
            isDeleted: { $ne: true }
        };

        if (filters.startDate || filters.endDate) {
            match['timestamps.createdAt'] = {};
            if (filters.startDate) match['timestamps.createdAt'].$gte = filters.startDate;
            if (filters.endDate) match['timestamps.createdAt'].$lte = filters.endDate;
        }

        if (filters.source) match.source = filters.source;
        if (filters.type) match.type = filters.type;
        if (filters.status) match.status = filters.status;

        pipeline.push({ $match: match });

        // Группировка по периодам
        pipeline.push({
            $group: {
                _id: {
                    year: '$reporting.period.year',
                    month: '$reporting.period.month',
                    source: '$source',
                    type: '$type'
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount.value' },
                avgAmount: { $avg: '$amount.value' },
                totalAdjustments: { $sum: '$adjustments.totalAdjustments' },

                // Распределение
                platformShare: { $sum: '$amount.components.platform' },
                referralShare: { $sum: '$amount.components.referral' },
                marketingShare: { $sum: '$amount.components.marketing' },

                // Статусы
                disputed: {
                    $sum: {
                        $cond: [{ $eq: ['$status', PROCESSING_STATUS.DISPUTED] }, 1, 0]
                    }
                }
            }
        });

        // Сортировка
        pipeline.push({
            $sort: {
                '_id.year': -1,
                '_id.month': -1,
                totalAmount: -1
            }
        });

        return await this.collection.aggregate(pipeline).toArray();
    }

    // Вспомогательные методы

    // Генерация ID транзакции
    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `CT${timestamp}${random}`.toUpperCase();
    }

    // Генерация ID комиссии
    generateCommissionId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6);
        return `COM-${year}${month}-${random}`.toUpperCase();
    }

    // Получение периода из даты
    getPeriodFromDate(date) {
        const d = new Date(date);
        return {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            quarter: Math.ceil((d.getMonth() + 1) / 3),
            week: this.getWeekNumber(d),
            day: d.getDate()
        };
    }

    // Получение номера недели
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Расчет распределения
    calculateDistribution(amount, rules) {
        const distributions = [];

        Object.entries(rules).forEach(([key, share]) => {
            if (share > 0) {
                distributions.push({
                    recipientType: key,
                    share,
                    amount: Math.round(amount * share)
                });
            }
        });

        // Корректировка остатка
        const distributed = distributions.reduce((sum, d) => sum + d.amount, 0);
        const remainder = amount - distributed;

        if (remainder !== 0 && distributions.length > 0) {
            distributions[0].amount += remainder;
        }

        return distributions;
    }

    // Валидация комиссии
    async validateCommission(commission) {
        const errors = [];

        // Проверка обязательных полей
        if (!commission.source) errors.push('Source is required');
        if (!commission.type) errors.push('Type is required');
        if (!commission.references?.orderId && !commission.references?.parentTransactionId) {
            errors.push('Order ID or parent transaction ID is required');
        }

        // Проверка суммы
        if (!commission.amount?.value || commission.amount.value < 0) {
            errors.push('Valid amount is required');
        }

        // Проверка расчета
        if (commission.calculation?.breakdown) {
            const calculated = commission.calculation.breakdown.total;
            const stated = commission.amount.value;

            if (Math.abs(calculated - stated) > 1) {
                errors.push(`Calculation mismatch: ${calculated} vs ${stated}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Экспортируем
module.exports = {
    CommissionTransactionModel,
    COMMISSION_SOURCES,
    CALCULATION_METHODS,
    PROCESSING_STATUS,
    commissionTransactionSchema
};