

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_STATUS, PAYMENT_TYPES } = require('../utils/constants/payment-status');
const { COMMISSION_TYPES, COMMISSION_CATEGORIES, COMMISSION_TARGETS } = require('../utils/constants/commission-types');
const { COMMISSION_STATUS } = require('../utils/constants/commission-status');
const { USER_ROLES } = require('../utils/constants/user-roles');


const COMMISSION_SOURCES = {
    ORDER: 'order',                         
    WITHDRAWAL: 'withdrawal',               
    PENALTY: 'penalty',                     
    ADJUSTMENT: 'adjustment',               
    SUBSCRIPTION: 'subscription',           
    PROMOTION: 'promotion'                  
};


const CALCULATION_METHODS = {
    STANDARD: 'standard',                   
    TIERED: 'tiered',                      
    VOLUME_BASED: 'volume_based',           
    TIME_BASED: 'time_based',               
    CUSTOM: 'custom'                        
};


const PROCESSING_STATUS = {
    CALCULATED: 'calculated',               
    APPLIED: 'applied',                     
    DISTRIBUTED: 'distributed',             
    SETTLED: 'settled',                     
    REVERSED: 'reversed',                   
    DISPUTED: 'disputed'                    
};


const commissionTransactionSchema = {
    _id: ObjectId,

    
    transactionId: String,                  
    commissionId: String,                   

    
    source: String,                         
    type: String,                           
    category: String,                       
    status: String,                         

    
    references: {
        
        parentTransactionId: ObjectId,      

        
        orderId: ObjectId,
        orderNumber: String,                

        
        payerId: ObjectId,                  
        payerType: String,                  
        payerRole: String,                  

        
        recipientId: ObjectId,              
        recipientType: String,              

        
        stoId: ObjectId,                    
        masterId: ObjectId,                 

        
        relatedCommissions: [ObjectId]      
    },

    
    calculation: {
        
        method: String,                     

        
        baseAmount: Number,                 
        baseCurrency: String,               

        
        rate: {
            percentage: Number,             
            fixed: Number,                  

            
            tiers: [{
                from: Number,
                to: Number,
                rate: Number
            }],

            
            source: String,                 
            rateId: ObjectId               
        },

        
        modifiers: {
            
            surgeMultiplier: Number,        
            volumeMultiplier: Number,       
            timeMultiplier: Number,         
            customMultiplier: Number,       

            
            discounts: [{
                type: String,               
                amount: Number,
                percentage: Number,
                reason: String
            }],

            penalties: [{
                type: String,               
                amount: Number,
                percentage: Number,
                reason: String
            }]
        },

        
        breakdown: {
            baseCommission: Number,         
            surgeAmount: Number,            
            discountAmount: Number,         
            penaltyAmount: Number,          
            adjustmentAmount: Number,       

            
            subtotal: Number,               
            roundingAmount: Number,         

            
            vatRate: Number,                
            vatAmount: Number,              

            
            total: Number                   
        },

        
        validation: {
            minAmount: Number,              
            maxAmount: Number,              
            wasLimited: Boolean,            
            originalAmount: Number          
        },

        
        calculatedAt: Date,
        calculatedBy: String               
    },

    
    amount: {
        value: Number,                      
        currency: String,                   

        
        originalValue: Number,              
        originalCurrency: String,
        exchangeRate: Number,

        
        components: {
            platform: Number,               
            referral: Number,               
            marketing: Number,              
            reserve: Number                 
        }
    },

    
    distribution: {
        
        rules: {
            platformShare: Number,          
            referralShare: Number,          
            marketingShare: Number,         
            reserveShare: Number            
        },

        
        recipients: [{
            recipientId: ObjectId,          
            recipientType: String,          

            share: Number,                  
            amount: Number,                 

            
            walletId: ObjectId,

            
            status: String,                 
            distributedAt: Date,

            
            transactionId: ObjectId
        }],

        
        status: String,                     
        completedAt: Date
    },

    
    processing: {
        
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
                distributions: Number       
            },
            settled: {
                completed: Boolean,
                timestamp: Date,
                settlementId: String
            }
        },

        
        automation: {
            enabled: Boolean,
            processAfter: Date,             
            retryCount: Number,
            lastRetryAt: Date,
            nextRetryAt: Date
        },

        
        errors: [{
            stage: String,
            code: String,
            message: String,
            timestamp: Date,
            resolved: Boolean
        }]
    },

    
    adjustments: {
        
        history: [{
            type: String,                   
            amount: Number,
            reason: String,

            
            previousAmount: Number,
            newAmount: Number,

            
            adjustedBy: ObjectId,
            adjustedByRole: String,
            adjustedAt: Date,

            
            approved: Boolean,
            approvedBy: ObjectId,
            approvedAt: Date
        }],

        
        disputes: [{
            status: String,                 
            reason: String,
            description: String,

            openedBy: ObjectId,
            openedAt: Date,

            
            evidence: [{
                type: String,
                url: String,
                description: String,
                uploadedAt: Date
            }],

            
            resolution: {
                decision: String,           
                amount: Number,             
                comment: String,
                resolvedBy: ObjectId,
                resolvedAt: Date
            }
        }],

        
        totalAdjustments: Number,           
        finalAmount: Number                 
    },

    
    compliance: {
        
        checks: {
            rateCompliance: Boolean,        
            limitCompliance: Boolean,       
            policyCompliance: Boolean,      

            
            violations: [{
                type: String,
                rule: String,
                expected: Object,
                actual: Object,
                severity: String            
            }]
        },

        
        approvals: [{
            requiredFor: String,            
            status: String,                 

            approvedBy: ObjectId,
            approvedByRole: String,
            approvedAt: Date,

            comment: String
        }],

        
        requiresReview: Boolean,
        reviewedBy: ObjectId,
        reviewedAt: Date
    },

    
    reporting: {
        
        period: {
            year: Number,
            month: Number,
            quarter: Number,
            week: Number,
            day: Number
        },

        
        categories: {
            service: String,                
            region: String,                 
            executorType: String,           
            customerSegment: String         
        },

        
        flags: {
            isHighValue: Boolean,           
            isAbnormal: Boolean,            
            isTest: Boolean,                
            isExcludedFromReports: Boolean  
        },

        
        metrics: {
            effectiveRate: Number,          
            conversionTime: Number,         
            processingDuration: Number      
        }
    },

    
    notifications: {
        
        recipients: [{
            userId: ObjectId,
            role: String,
            channels: [String]              
        }],

        
        sent: [{
            type: String,                   
            channel: String,
            recipient: String,
            sentAt: Date,
            status: String                  
        }]
    },

    
    metadata: {
        
        rulesVersion: String,
        configVersion: String,

        
        source: String,                     
        sourceIp: String,
        userAgent: String,

        
        externalReferences: {
            invoiceNumber: String,
            contractNumber: String,
            documentUrl: String
        },

        
        tags: [String],

        
        custom: Object,

        
        notes: [{
            text: String,
            addedBy: ObjectId,
            addedAt: Date
        }]
    },

    
    timestamps: {
        createdAt: Date,
        calculatedAt: Date,
        appliedAt: Date,
        distributedAt: Date,
        settledAt: Date,
        reversedAt: Date,

        
        periodStart: Date,
        periodEnd: Date
    },

    
    version: Number,                        
    isDeleted: Boolean,                     
    deletedAt: Date
};


class CommissionTransactionModel {
    constructor(db) {
        this.collection = db.collection('commission_transactions');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex(
                { transactionId: 1 },
                { unique: true, sparse: true }
            );

            await this.collection.createIndex(
                { commissionId: 1 },
                { unique: true, sparse: true }
            );

            
            await this.collection.createIndex({ status: 1, 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ 'references.orderId': 1 });
            await this.collection.createIndex({ 'references.parentTransactionId': 1 });
            await this.collection.createIndex({ 'references.payerId': 1, source: 1 });
            await this.collection.createIndex({ 'references.masterId': 1 });
            await this.collection.createIndex({ 'references.stoId': 1 });

            
            await this.collection.createIndex({
                'processing.automation.enabled': 1,
                'processing.automation.processAfter': 1,
                status: 1
            });

            
            await this.collection.createIndex({
                'reporting.period.year': -1,
                'reporting.period.month': -1,
                source: 1
            });

            await this.collection.createIndex({
                'amount.value': -1,
                'timestamps.createdAt': -1
            });

            
            await this.collection.createIndex({
                source: 1,
                type: 1,
                status: 1,
                'timestamps.createdAt': -1
            });

            
            await this.collection.createIndex({
                'compliance.requiresReview': 1,
                'compliance.reviewedAt': 1
            });

            
            await this.collection.createIndex({
                'adjustments.disputes.status': 1,
                'adjustments.disputes.openedAt': -1
            });

            
            await this.collection.createIndex(
                { 'timestamps.createdAt': 1 },
                { expireAfterSeconds: 365 * 24 * 60 * 60 } 
            );

            console.log('✓ Commission transaction indexes created');
        } catch (error) {
            console.error('Error creating commission transaction indexes:', error);
        }
    }

    
    async create(data) {
        const now = new Date();

        const transaction = {
            _id: new ObjectId(),
            transactionId: this.generateTransactionId(),
            commissionId: this.generateCommissionId(),

            ...data,

            
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
                    processAfter: new Date(now.getTime() + 60000), 
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
                    isHighValue: (data.amount?.value || 0) > 1000000, 
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

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            isDeleted: { $ne: true }
        });
    }

    
    async findByTransactionId(transactionId) {
        return await this.collection.findOne({
            transactionId,
            isDeleted: { $ne: true }
        });
    }

    
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

        
        if (executorType === 'master') {
            query['references.masterId'] = new ObjectId(executorId);
        } else {
            query['references.stoId'] = new ObjectId(executorId);
        }

        
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

    
    async updateStatus(id, newStatus, details = {}) {
        const updateData = {
            status: newStatus,
            [`processing.stages.${newStatus.toLowerCase()}`]: {
                completed: true,
                timestamp: new Date(),
                ...details
            }
        };

        
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

    
    async findForProcessing() {
        const now = new Date();

        return await this.collection.find({
            'processing.automation.enabled': true,
            'processing.automation.processAfter': { $lte: now },
            status: { $in: [PROCESSING_STATUS.CALCULATED, PROCESSING_STATUS.APPLIED] },
            isDeleted: { $ne: true }
        }).toArray();
    }

    
    async aggregateCommissions(filters = {}) {
        const pipeline = [];

        
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

                
                platformShare: { $sum: '$amount.components.platform' },
                referralShare: { $sum: '$amount.components.referral' },
                marketingShare: { $sum: '$amount.components.marketing' },

                
                disputed: {
                    $sum: {
                        $cond: [{ $eq: ['$status', PROCESSING_STATUS.DISPUTED] }, 1, 0]
                    }
                }
            }
        });

        
        pipeline.push({
            $sort: {
                '_id.year': -1,
                '_id.month': -1,
                totalAmount: -1
            }
        });

        return await this.collection.aggregate(pipeline).toArray();
    }

    

    
    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `CT${timestamp}${random}`.toUpperCase();
    }

    
    generateCommissionId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6);
        return `COM-${year}${month}-${random}`.toUpperCase();
    }

    
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

    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    
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

        
        const distributed = distributions.reduce((sum, d) => sum + d.amount, 0);
        const remainder = amount - distributed;

        if (remainder !== 0 && distributions.length > 0) {
            distributions[0].amount += remainder;
        }

        return distributions;
    }

    
    async validateCommission(commission) {
        const errors = [];

        
        if (!commission.source) errors.push('Source is required');
        if (!commission.type) errors.push('Type is required');
        if (!commission.references?.orderId && !commission.references?.parentTransactionId) {
            errors.push('Order ID or parent transaction ID is required');
        }

        
        if (!commission.amount?.value || commission.amount.value < 0) {
            errors.push('Valid amount is required');
        }

        
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


module.exports = {
    CommissionTransactionModel,
    COMMISSION_SOURCES,
    CALCULATION_METHODS,
    PROCESSING_STATUS,
    commissionTransactionSchema
};