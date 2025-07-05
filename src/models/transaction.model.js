

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_TYPES, PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants/payment-status');
const { WALLET_TYPES } = require('./wallet.model');


const TRANSACTION_DIRECTION = {
    DEBIT: 'debit',                       
    CREDIT: 'credit'                       
};


const ACCOUNT_TYPES = {
    WALLET: 'wallet',                      
    EXTERNAL: 'external',                  
    SYSTEM: 'system',                      
    ESCROW: 'escrow'                       
};


const TRANSACTION_CATEGORIES = {
    PAYMENT: 'payment',                    
    TRANSFER: 'transfer',                  
    COMMISSION: 'commission',              
    REFUND: 'refund',                      
    ADJUSTMENT: 'adjustment',              
    WITHDRAWAL: 'withdrawal',              
    TOPUP: 'topup'                        
};


const VERIFICATION_STATUS = {
    PENDING: 'pending',                    
    VERIFIED: 'verified',                  
    FAILED: 'failed',                      
    SUSPICIOUS: 'suspicious'               
};


const transactionSchema = {
    _id: ObjectId,

    
    transactionId: String,                 

    
    type: String,                          
    category: String,                      
    status: String,                        

    
    amount: {
        value: Number,                     
        currency: String,                  

        
        originalValue: Number,             
        originalCurrency: String,          
        exchangeRate: Number               
    },

    
    source: {
        type: String,                      

        
        walletId: ObjectId,

        
        external: {
            method: String,                

            
            card: {
                number: String,            
                holder: String,
                bank: String,
                country: String,
                type: String,              
                brand: String              
            },

            
            bankAccount: {
                accountNumber: String,
                bankName: String,
                bankCode: String
            },

            
            eWallet: {
                provider: String,          
                accountId: String
            }
        },

        
        metadata: {
            ip: String,
            country: String,
            city: String
        }
    },

    
    destination: {
        type: String,                      
        walletId: ObjectId,

        external: {
            
            method: String,
            card: Object,
            bankAccount: Object,
            eWallet: Object
        }
    },

    
    references: {
        orderId: ObjectId,                 
        userId: ObjectId,                  
        masterId: ObjectId,                
        stoId: ObjectId,                   

        
        parentTransactionId: ObjectId,

        
        childTransactions: [ObjectId],

        
        relatedTransactions: [{
            transactionId: ObjectId,
            relation: String               
        }]
    },

    
    paymentDetails: {
        
        method: String,                    

        
        provider: {
            name: String,                  
            transactionId: String,         
            referenceNumber: String,       
            authorizationCode: String,     
            rrn: String                    
        },

        
        threeDSecure: {
            required: Boolean,
            version: String,               
            status: String,                
            eci: String,                   
            cavv: String,                  
            xid: String                    
        },

        
        invoice: {
            number: String,
            date: Date,
            dueDate: Date
        },

        description: String,               
        purposeCode: String               
    },

    
    fees: {
        
        platform: {
            amount: Number,
            percentage: Number,
            fixed: Number,
            walletId: ObjectId            
        },

        
        provider: {
            amount: Number,
            percentage: Number,
            description: String
        },

        
        bank: {
            amount: Number,
            description: String
        },

        
        total: Number
    },

    
    splits: [{
        recipientId: ObjectId,             
        recipientType: String,             
        amount: Number,                    
        percentage: Number,                
        description: String,
        status: String,                    

        
        transactionId: ObjectId
    }],

    
    verification: {
        status: String,                    

        
        checks: {
            cardVerification: Boolean,
            addressVerification: Boolean,
            cvvVerification: Boolean,
            fraudCheck: Boolean,
            amlCheck: Boolean,             
            sanctionsCheck: Boolean
        },

        
        riskScore: Number,                 
        riskFactors: [String],

        
        verifiedAt: Date,
        verifiedBy: String                 
    },

    
    refund: {
        
        originalTransactionId: ObjectId,   
        reason: String,                    
        requestedAt: Date,
        approvedAt: Date,
        approvedBy: ObjectId,

        
        isPartial: Boolean,
        refundedAmount: Number
    },

    dispute: {
        
        status: String,                    
        reason: String,                    

        openedAt: Date,
        openedBy: ObjectId,

        
        evidence: [{
            type: String,                  
            url: String,
            description: String,
            uploadedAt: Date,
            uploadedBy: ObjectId
        }],

        
        resolution: {
            decision: String,              
            amount: Number,
            resolvedAt: Date,
            resolvedBy: ObjectId,
            notes: String
        }
    },

    
    metadata: {
        
        source: String,                    
        apiVersion: String,
        clientVersion: String,

        
        location: {
            ip: String,
            country: String,
            city: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },

        
        device: {
            id: String,
            type: String,                  
            model: String,
            os: String,
            browser: String
        },

        
        sessionId: String,
        requestId: String,

        
        customData: Object,
        tags: [String]
    },

    
    timestamps: {
        createdAt: Date,                   
        initiatedAt: Date,                 
        processedAt: Date,                 
        completedAt: Date,                 
        failedAt: Date,                    
        cancelledAt: Date,                 
        refundedAt: Date                   
    },

    
    processing: {
        attempts: Number,                  
        lastAttemptAt: Date,
        nextRetryAt: Date,

        
        history: [{
            attemptNumber: Number,
            timestamp: Date,
            status: String,
            errorCode: String,
            errorMessage: String,
            duration: Number               
        }],

        
        retryConfig: {
            maxAttempts: Number,
            backoffMultiplier: Number,
            maxBackoffSeconds: Number
        }
    },

    
    notifications: {
        
        sent: [{
            type: String,                  
            recipient: String,
            sentAt: Date,
            status: String,                
            template: String
        }],

        
        webhooks: [{
            url: String,
            sentAt: Date,
            responseCode: Number,
            responseTime: Number,
            success: Boolean
        }]
    },

    
    accounting: {
        
        entries: [{
            accountType: String,           
            accountCode: String,           
            amount: Number,
            description: String
        }],

        
        tax: {
            amount: Number,
            rate: Number,
            type: String                   
        },

        
        period: {
            year: Number,
            month: Number,
            quarter: Number
        },

        
        isReconciled: Boolean,
        reconciledAt: Date,
        reconciledBy: ObjectId
    },

    
    security: {
        
        signature: String,
        signatureAlgorithm: String,

        
        encryptedData: String,
        encryptionKeyId: String,

        
        auditLog: [{
            action: String,
            performedBy: ObjectId,
            performedAt: Date,
            ip: String,
            changes: Object
        }]
    },

    
    flags: {
        isTest: Boolean,                   
        isRecurring: Boolean,              
        isInstant: Boolean,                
        requiresApproval: Boolean,         
        isLargeAmount: Boolean,            
        isSuspicious: Boolean,             
        isBlocked: Boolean,                
        isReversed: Boolean                
    },

    
    expiry: {
        expiresAt: Date,                   
        expiredAt: Date,                   
        autoExpire: Boolean                
    }
};


class TransactionModel {
    constructor(db) {
        this.collection = db.collection('transactions');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex(
                { transactionId: 1 },
                { unique: true, sparse: true }
            );

            
            await this.collection.createIndex({ status: 1, 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ type: 1, status: 1 });
            await this.collection.createIndex({ 'source.walletId': 1 });
            await this.collection.createIndex({ 'destination.walletId': 1 });

            
            await this.collection.createIndex({ 'references.orderId': 1 });
            await this.collection.createIndex({ 'references.userId': 1 });
            await this.collection.createIndex({ 'references.parentTransactionId': 1 });

            
            await this.collection.createIndex({ 'timestamps.createdAt': -1 });
            await this.collection.createIndex({ 'amount.value': -1 });
            await this.collection.createIndex({ 'paymentDetails.provider.name': 1 });

            
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

            
            await this.collection.createIndex({
                status: 1,
                'processing.nextRetryAt': 1
            });

            
            await this.collection.createIndex(
                { 'expiry.expiresAt': 1 },
                { expireAfterSeconds: 0 }
            );

        } catch (error) {
            console.error('Error creating transaction indexes:', error);
        }
    }

    
    async create(transactionData) {
        const now = new Date();

        
        const transactionId = transactionData.transactionId || this.generateTransactionId();

        const transaction = {
            _id: new ObjectId(),
            transactionId,
            ...transactionData,

            
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
                isLargeAmount: transactionData.amount?.value > 10000000, 
                isSuspicious: false,
                isBlocked: false,
                isReversed: false,
                ...transactionData.flags
            }
        };

        
        transaction.fees.total =
            (transaction.fees.platform?.amount || 0) +
            (transaction.fees.provider?.amount || 0) +
            (transaction.fees.bank?.amount || 0);

        const result = await this.collection.insertOne(transaction);
        return { ...transaction, _id: result.insertedId };
    }

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id)
        });
    }

    
    async findByTransactionId(transactionId) {
        return await this.collection.findOne({ transactionId });
    }

    
    async findByWalletId(walletId, options = {}) {
        const {
            direction = 'both', 
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

        
        if (direction === 'both' || direction === 'credit') {
            query.$or.push({ 'destination.walletId': new ObjectId(walletId) });
        }
        if (direction === 'both' || direction === 'debit') {
            query.$or.push({ 'source.walletId': new ObjectId(walletId) });
        }

        
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

    
    async updateStatus(transactionId, newStatus, details = {}) {
        const now = new Date();
        const updateQuery = {
            $set: {
                status: newStatus,
                [`timestamps.${newStatus}At`]: now
            }
        };

        
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

    
    async findTransactionsForRetry() {
        const now = new Date();

        return await this.collection.find({
            status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
            'processing.nextRetryAt': { $lte: now },
            'processing.attempts': { $lt: '$processing.retryConfig.maxAttempts' },
            'flags.isBlocked': { $ne: true }
        }).toArray();
    }

    
    calculateNextRetryTime(attempts, config) {
        const backoffSeconds = Math.min(
            Math.pow(config.backoffMultiplier, attempts) * 10,
            config.maxBackoffSeconds
        );

        return new Date(Date.now() + backoffSeconds * 1000);
    }

    
    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `TXN${timestamp}${random}`.toUpperCase();
    }

    
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

    
    async aggregateTransactions(filters = {}) {
        const pipeline = [];

        
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

        
        pipeline.push({ $sort: { totalAmount: -1 } });

        return await this.collection.aggregate(pipeline).toArray();
    }
}


module.exports = {
    TransactionModel,
    TRANSACTION_DIRECTION,
    ACCOUNT_TYPES,
    TRANSACTION_CATEGORIES,
    VERIFICATION_STATUS,
    transactionSchema
};