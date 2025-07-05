

'use strict';

const { ObjectId } = require('mongodb');
const { PAYMENT_TYPES, PAYMENT_STATUS } = require('../utils/constants/payment-status');
const { USER_ROLES } = require('../utils/constants/user-roles');


const WALLET_TYPES = {
    USER: 'user',                          
    STO: 'sto',                           
    SYSTEM: 'system',                      
    ESCROW: 'escrow'                       
};


const WALLET_STATUS = {
    ACTIVE: 'active',                      
    SUSPENDED: 'suspended',                
    BLOCKED: 'blocked',                    
    CLOSED: 'closed'                       
};


const BALANCE_TYPES = {
    MAIN: 'main',                          
    BONUS: 'bonus',                        
    CASHBACK: 'cashback',                  
    PENDING: 'pending'                     
};


const HOLD_REASONS = {
    ORDER_PAYMENT: 'order_payment',        
    WITHDRAWAL_REQUEST: 'withdrawal_request', 
    DISPUTE: 'dispute',                    
    VERIFICATION: 'verification',          
    PENALTY: 'penalty',                    
    OTHER: 'other'                         
};


const walletSchema = {
    _id: ObjectId,

    
    owner: {
        type: String,                      
        userId: ObjectId,                  
        stoId: ObjectId,                   
        systemId: String                   
    },

    
    currency: String,                      
    status: String,                        

    
    balance: {
        
        available: {
            main: Number,                  
            bonus: Number,                 
            cashback: Number               
        },

        
        held: {
            total: Number,                 

            
            details: [{
                amount: Number,
                reason: String,            
                referenceId: ObjectId,     
                referenceType: String,     
                description: String,
                createdAt: Date,
                expiresAt: Date           
            }]
        },

        
        pending: {
            incoming: Number,              
            outgoing: Number               
        },

        
        total: {
            available: Number,             
            held: Number,                  
            pending: Number,               
            overall: Number                
        }
    },

    
    limits: {
        
        withdrawal: {
            daily: {
                limit: Number,             
                used: Number,              
                resetAt: Date              
            },
            monthly: {
                limit: Number,
                used: Number,
                resetAt: Date
            },
            perTransaction: {
                min: Number,               
                max: Number                
            }
        },

        
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

        
        minBalance: Number                 
    },

    
    withdrawalSettings: {
        
        autoWithdrawal: {
            enabled: Boolean,
            threshold: Number,             
            schedule: String               
        },

        
        methods: [{
            type: String,                  
            isDefault: Boolean,
            isVerified: Boolean,

            
            card: {
                number: String,            
                holder: String,
                bank: String,
                expiryMonth: Number,
                expiryYear: Number
            },

            
            bankAccount: {
                accountNumber: String,
                bankName: String,
                bankCode: String,
                recipientName: String
            },

            verifiedAt: Date,
            addedAt: Date
        }],

        
        fees: {
            percentage: Number,            
            fixed: Number,                 
            min: Number,                   
            max: Number                    
        }
    },

    
    statistics: {
        
        lifetime: {
            totalReceived: Number,         
            totalSpent: Number,            
            totalWithdrawn: Number,        
            totalCommissionPaid: Number,   
            totalBonusReceived: Number,    
            totalCashbackReceived: Number  
        },

        
        monthly: {
            income: Number,                
            expenses: Number,              
            withdrawals: Number,           

            
            byType: {
                [PAYMENT_TYPES.ORDER_PAYMENT]: Number,
                [PAYMENT_TYPES.WITHDRAWAL]: Number,
                [PAYMENT_TYPES.COMMISSION]: Number,
                [PAYMENT_TYPES.BONUS]: Number,
                [PAYMENT_TYPES.CASHBACK]: Number
            }
        },

        
        counters: {
            totalTransactions: Number,     
            successfulWithdrawals: Number, 
            failedWithdrawals: Number,     
            disputes: Number               
        },

        
        lastCalculatedAt: Date
    },

    
    notifications: {
        
        balance: {
            lowBalanceAlert: {
                enabled: Boolean,
                threshold: Number          
            },
            largeTransaction: {
                enabled: Boolean,
                threshold: Number          
            }
        },

        
        transactions: {
            incoming: Boolean,             
            outgoing: Boolean,             
            withdrawals: Boolean           
        }
    },

    
    security: {
        
        pin: {
            hash: String,                  
            attempts: Number,              
            lockedUntil: Date,            
            lastChangedAt: Date
        },

        
        twoFactorEnabled: Boolean,

        
        allowedIPs: [String],

        
        suspiciousActivities: [{
            type: String,                  
            description: String,
            amount: Number,
            timestamp: Date,
            resolved: Boolean
        }]
    },

    
    platformFees: {
        
        orderCommission: {
            percentage: Number,            
            min: Number,                   
            max: Number                    
        },

        
        specialRates: [{
            serviceType: String,           
            percentage: Number,
            validFrom: Date,
            validUntil: Date
        }],

        
        gracePeriod: {
            enabled: Boolean,
            endsAt: Date,
            commission: Number             
        }
    },

    
    bonusProgram: {
        
        rules: {
            signupBonus: Number,           
            referralBonus: Number,         
            orderBonus: {
                percentage: Number,        
                min: Number,               
                max: Number                
            }
        },

        
        history: [{
            amount: Number,
            type: String,                  
            referenceId: ObjectId,
            description: String,
            earnedAt: Date,
            expiresAt: Date               
        }],

        
        usage: {
            maxPercentagePerOrder: Number, 
            minOrderAmount: Number         
        }
    },

    
    cashbackProgram: {
        
        levels: [{
            name: String,                  
            percentage: Number,            
            minMonthlySpend: Number,       
            benefits: [String]             
        }],

        currentLevel: String,
        nextLevelProgress: Number,         

        
        history: [{
            amount: Number,
            orderId: ObjectId,
            percentage: Number,
            earnedAt: Date
        }]
    },

    
    related: {
        
        escrow: {
            orderId: ObjectId,
            buyerWalletId: ObjectId,
            sellerWalletId: ObjectId,
            releaseConditions: String,
            autoReleaseAt: Date
        }
    },

    
    metadata: {
        
        externalId: String,                
        externalSystem: String,            

        
        tags: [String],
        notes: String,
        customFields: Object
    },

    
    audit: {
        createdBy: ObjectId,               
        lastModifiedBy: ObjectId,          

        
        events: [{
            type: String,                  
            description: String,
            performedBy: ObjectId,
            timestamp: Date,
            details: Object
        }]
    },

    
    createdAt: Date,
    updatedAt: Date,
    lastActivityAt: Date,                  
    closedAt: Date                         
};


class WalletModel {
    constructor(db) {
        this.collection = db.collection('wallets');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
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

            
            await this.collection.createIndex({ 'owner.type': 1, status: 1 });
            await this.collection.createIndex({ 'balance.total.available': -1 });
            await this.collection.createIndex({ lastActivityAt: -1 });

            
            await this.collection.createIndex({ 'balance.held.details.referenceId': 1 });
            await this.collection.createIndex({ 'balance.held.details.expiresAt': 1 });

            
            await this.collection.createIndex({ 'statistics.monthly.income': -1 });
            await this.collection.createIndex({ createdAt: -1 });

            
            await this.collection.createIndex(
                { 'balance.held.details.expiresAt': 1 },
                { expireAfterSeconds: 0 }
            );

        } catch (error) {
            console.error('Error creating wallet indexes:', error);
        }
    }

    
    async create(walletData) {
        const now = new Date();

        const wallet = {
            _id: new ObjectId(),
            ...walletData,

            
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
                        min: 10000,    
                        max: 5000000   
                    }
                },
                payment: {
                    daily: {
                        limit: this.getDefaultLimit('payment', 'daily', walletData.owner.type),
                        used: 0,
                        resetAt: this.getNextResetDate('daily')
                    },
                    perTransaction: {
                        max: 10000000  
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
                        threshold: 50000  
                    },
                    largeTransaction: {
                        enabled: true,
                        threshold: 1000000  
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

        
        wallet.balance.total = this.calculateTotalBalances(wallet.balance);

        const result = await this.collection.insertOne(wallet);
        return { ...wallet, _id: result.insertedId };
    }

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    
    async findByUserId(userId) {
        return await this.collection.findOne({
            'owner.type': WALLET_TYPES.USER,
            'owner.userId': new ObjectId(userId),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    
    async findByStoId(stoId) {
        return await this.collection.findOne({
            'owner.type': WALLET_TYPES.STO,
            'owner.stoId': new ObjectId(stoId),
            status: { $ne: WALLET_STATUS.CLOSED }
        });
    }

    
    async updateBalance(walletId, updates) {
        const updateQuery = {
            $set: {
                updatedAt: new Date(),
                lastActivityAt: new Date()
            }
        };

        
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

    
    async holdFunds(walletId, holdData) {
        const hold = {
            _id: new ObjectId(),
            amount: holdData.amount,
            reason: holdData.reason,
            referenceId: holdData.referenceId,
            referenceType: holdData.referenceType,
            description: holdData.description,
            createdAt: new Date(),
            expiresAt: holdData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) 
        };

        
        const wallet = await this.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        if (wallet.balance.available.main < holdData.amount) {
            throw new Error('Insufficient funds');
        }

        
        return await this.updateBalance(walletId, {
            available: { main: -holdData.amount },
            addHold: hold
        });
    }

    
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

        
        if (releaseToAvailable) {
            updates.available = { main: hold.amount };
        }

        return await this.updateBalance(walletId, updates);
    }

    
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

        
        updateQuery.$inc[`statistics.monthly.byType.${type}`] = amount;

        return await this.collection.updateOne(
            { _id: new ObjectId(walletId) },
            updateQuery
        );
    }

    
    async checkLimit(walletId, amount, limitType = 'withdrawal') {
        const wallet = await this.findById(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const limits = wallet.limits[limitType];
        const errors = [];

        
        if (limits.daily && limits.daily.used + amount > limits.daily.limit) {
            errors.push({
                type: 'daily_limit',
                message: `Превышен дневной лимит. Доступно: ${limits.daily.limit - limits.daily.used}`
            });
        }

        
        if (limits.monthly && limits.monthly.used + amount > limits.monthly.limit) {
            errors.push({
                type: 'monthly_limit',
                message: `Превышен месячный лимит. Доступно: ${limits.monthly.limit - limits.monthly.used}`
            });
        }

        
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

    
    async updateLimitUsage(walletId, amount, limitType = 'withdrawal') {
        const now = new Date();

        const wallet = await this.findById(walletId);
        if (!wallet) return;

        const updateQuery = {
            $inc: {},
            $set: { updatedAt: now }
        };

        
        if (wallet.limits[limitType].daily.resetAt < now) {
            updateQuery.$set[`limits.${limitType}.daily.used`] = amount;
            updateQuery.$set[`limits.${limitType}.daily.resetAt`] = this.getNextResetDate('daily');
        } else {
            updateQuery.$inc[`limits.${limitType}.daily.used`] = amount;
        }

        
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

    
    getDefaultLimit(limitType, period, ownerType) {
        const limits = {
            withdrawal: {
                daily: {
                    [WALLET_TYPES.USER]: 10000000,    
                    [WALLET_TYPES.STO]: 50000000      
                },
                monthly: {
                    [WALLET_TYPES.USER]: 100000000,   
                    [WALLET_TYPES.STO]: 1000000000    
                }
            },
            payment: {
                daily: {
                    [WALLET_TYPES.USER]: 50000000,    
                    [WALLET_TYPES.STO]: 100000000     
                }
            }
        };

        return limits[limitType]?.[period]?.[ownerType] || 0;
    }

    
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


module.exports = {
    WalletModel,
    WALLET_TYPES,
    WALLET_STATUS,
    BALANCE_TYPES,
    HOLD_REASONS,
    walletSchema
};