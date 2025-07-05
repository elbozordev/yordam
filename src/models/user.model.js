

'use strict';

const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');


const USER_ROLES = {
    CLIENT: 'client',
    MASTER: 'master',
    STO_OWNER: 'sto_owner',
    STO_EMPLOYEE: 'sto_employee',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

const USER_STATUS = {
    PENDING: 'pending',         
    ACTIVE: 'active',          
    INACTIVE: 'inactive',      
    BLOCKED: 'blocked',        
    DELETED: 'deleted'         
};

const MASTER_STATUS = {
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};


const userSchema = {
    
    _id: ObjectId,
    phone: String,              
    email: String,              
    password: String,           

    
    name: {
        first: String,
        last: String,
        middle: String          
    },

    avatar: {
        url: String,
        thumbnailUrl: String,
        uploadedAt: Date
    },

    birthDate: Date,
    gender: String,             
    language: String,           

    
    role: String,               
    status: String,             

    
    loginAttempts: Number,      
    lockUntil: Date,           
    lastLogin: Date,
    lastLoginIp: String,

    
    isPhoneVerified: Boolean,
    isEmailVerified: Boolean,
    phoneVerifiedAt: Date,
    emailVerifiedAt: Date,

    
    devices: [{
        deviceId: String,
        deviceType: String,     
        deviceModel: String,
        appVersion: String,
        pushToken: String,
        lastActiveAt: Date,
        addedAt: Date
    }],

    
    clientData: {
        vehicles: [ObjectId],   
        favoriteServices: [String],
        defaultLocation: {
            address: String,
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number] 
            }
        },
        referralCode: String,
        referredBy: ObjectId,
        bonusBalance: Number
    },

    
    masterData: {
        status: String,         
        services: [String],     

        documents: [{
            type: String,       
            number: String,
            issuedDate: Date,
            expiryDate: Date,
            fileUrl: String,
            verifiedAt: Date,
            verifiedBy: ObjectId
        }],

        workSchedule: {
            monday: { start: String, end: String, enabled: Boolean },
            tuesday: { start: String, end: String, enabled: Boolean },
            wednesday: { start: String, end: String, enabled: Boolean },
            thursday: { start: String, end: String, enabled: Boolean },
            friday: { start: String, end: String, enabled: Boolean },
            saturday: { start: String, end: String, enabled: Boolean },
            sunday: { start: String, end: String, enabled: Boolean }
        },

        serviceZones: [{
            name: String,
            polygon: {
                type: { type: String, default: 'Polygon' },
                coordinates: [[[Number]]] 
            }
        }],

        currentLocation: {
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },
            accuracy: Number,
            heading: Number,    
            speed: Number,      
            updatedAt: Date
        },

        isOnline: Boolean,
        lastOnlineAt: Date,

        rating: {
            average: Number,    
            count: Number,      
            details: {
                5: Number,
                4: Number,
                3: Number,
                2: Number,
                1: Number
            }
        },

        statistics: {
            totalOrders: Number,
            completedOrders: Number,
            cancelledOrders: Number,
            totalEarnings: Number,
            thisMonthEarnings: Number,
            averageResponseTime: Number, 
            completionRate: Number       
        },

        bankAccount: {
            cardNumber: String,
            cardHolder: String,
            bankName: String,
            isVerified: Boolean
        }
    },

    
    stoData: {
        stoId: ObjectId,        
        position: String,       
        permissions: [String],  

        
        isOwner: Boolean,
        ownedStos: [ObjectId],  

        
        employeeSchedule: {
            monday: { start: String, end: String, enabled: Boolean },
            tuesday: { start: String, end: String, enabled: Boolean },
            wednesday: { start: String, end: String, enabled: Boolean },
            thursday: { start: String, end: String, enabled: Boolean },
            friday: { start: String, end: String, enabled: Boolean },
            saturday: { start: String, end: String, enabled: Boolean },
            sunday: { start: String, end: String, enabled: Boolean }
        }
    },

    
    adminData: {
        level: String,          
        permissions: [String],  
        assignedRegions: [String],
        notes: String          
    },

    
    notifications: {
        push: {
            enabled: Boolean,
            orders: Boolean,
            marketing: Boolean,
            system: Boolean
        },
        sms: {
            enabled: Boolean,
            orders: Boolean,
            marketing: Boolean
        },
        email: {
            enabled: Boolean,
            orders: Boolean,
            marketing: Boolean,
            reports: Boolean
        }
    },

    
    metadata: {
        source: String,         
        registrationIp: String,
        userAgent: String,
        appVersion: String,
        platform: String        
    },

    
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date            
};


class UserModel {
    constructor(db) {
        this.collection = db.collection('users');
        this.setupIndexes();
    }

    
    async setupIndexes() {
        try {
            
            await this.collection.createIndex({ phone: 1 }, {
                unique: true,
                partialFilterExpression: { phone: { $exists: true } }
            });

            await this.collection.createIndex({ email: 1 }, {
                unique: true,
                sparse: true,
                partialFilterExpression: { email: { $exists: true } }
            });

            
            await this.collection.createIndex({ role: 1, status: 1 });
            await this.collection.createIndex({ 'masterData.isOnline': 1, 'masterData.status': 1 });
            await this.collection.createIndex({ 'masterData.services': 1 });
            await this.collection.createIndex({ 'masterData.rating.average': -1 });

            
            await this.collection.createIndex({ 'masterData.currentLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'clientData.defaultLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'masterData.serviceZones.polygon': '2dsphere' });

            
            await this.collection.createIndex({ 'name.first': 'text', 'name.last': 'text' });
            await this.collection.createIndex({ createdAt: -1 });
            await this.collection.createIndex({ 'devices.deviceId': 1 });
            await this.collection.createIndex({ 'devices.pushToken': 1 });

            
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 2592000 } 
            );

        } catch (error) {
            console.error('Error creating user indexes:', error);
        }
    }

    
    async create(userData) {
        const now = new Date();

        const user = {
            _id: new ObjectId(),
            ...userData,

            
            status: userData.status || USER_STATUS.PENDING,
            loginAttempts: 0,
            isPhoneVerified: false,
            isEmailVerified: false,
            devices: [],

            
            ...(userData.role === USER_ROLES.CLIENT && {
                clientData: {
                    vehicles: [],
                    favoriteServices: [],
                    bonusBalance: 0,
                    ...userData.clientData
                }
            }),

            ...(userData.role === USER_ROLES.MASTER && {
                masterData: {
                    status: MASTER_STATUS.PENDING_VERIFICATION,
                    services: [],
                    documents: [],
                    isOnline: false,
                    rating: {
                        average: 0,
                        count: 0,
                        details: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    },
                    statistics: {
                        totalOrders: 0,
                        completedOrders: 0,
                        cancelledOrders: 0,
                        totalEarnings: 0,
                        thisMonthEarnings: 0,
                        averageResponseTime: 0,
                        completionRate: 0
                    },
                    ...userData.masterData
                }
            }),

            
            notifications: {
                push: { enabled: true, orders: true, marketing: false, system: true },
                sms: { enabled: true, orders: true, marketing: false },
                email: { enabled: true, orders: true, marketing: false, reports: false },
                ...userData.notifications
            },

            createdAt: now,
            updatedAt: now
        };

        
        if (user.password) {
            user.password = await this.hashPassword(user.password);
        }

        const result = await this.collection.insertOne(user);
        return { ...user, _id: result.insertedId };
    }

    
    async findByPhone(phone) {
        return await this.collection.findOne({
            phone,
            status: { $ne: USER_STATUS.DELETED }
        });
    }

    
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: USER_STATUS.DELETED }
        });
    }

    
    async update(id, updateData) {
        const { password, ...otherData } = updateData;

        const update = {
            ...otherData,
            updatedAt: new Date()
        };

        
        if (password) {
            update.password = await this.hashPassword(password);
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after' }
        );

        return result;
    }

    
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    
    async incrementLoginAttempts(userId) {
        const maxAttempts = 5;
        const lockTime = 15 * 60 * 1000; 

        const user = await this.collection.findOne({ _id: new ObjectId(userId) });

        const attempts = (user.loginAttempts || 0) + 1;
        const update = {
            loginAttempts: attempts,
            updatedAt: new Date()
        };

        
        if (attempts >= maxAttempts) {
            update.lockUntil = new Date(Date.now() + lockTime);
        }

        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: update }
        );

        return attempts;
    }

    
    async resetLoginAttempts(userId) {
        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    loginAttempts: 0,
                    lastLogin: new Date(),
                    updatedAt: new Date()
                },
                $unset: { lockUntil: 1 }
            }
        );
    }

    
    async isLocked(userId) {
        const user = await this.collection.findOne({ _id: new ObjectId(userId) });

        if (!user.lockUntil) return false;

        const isLocked = user.lockUntil > new Date();

        
        if (!isLocked && user.lockUntil) {
            await this.collection.updateOne(
                { _id: new ObjectId(userId) },
                {
                    $unset: { lockUntil: 1 },
                    $set: { loginAttempts: 0 }
                }
            );
        }

        return isLocked;
    }

    
    async addDevice(userId, deviceData) {
        const device = {
            ...deviceData,
            addedAt: new Date(),
            lastActiveAt: new Date()
        };

        
        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { devices: { deviceId: device.deviceId } } }
        );

        
        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $push: { devices: device },
                $set: { updatedAt: new Date() }
            }
        );

        return device;
    }

    
    async updateMasterLocation(masterId, location) {
        const update = {
            'masterData.currentLocation': {
                coordinates: {
                    type: 'Point',
                    coordinates: [location.lng, location.lat]
                },
                accuracy: location.accuracy,
                heading: location.heading,
                speed: location.speed,
                updatedAt: new Date()
            },
            updatedAt: new Date()
        };

        return await this.collection.findOneAndUpdate(
            {
                _id: new ObjectId(masterId),
                role: USER_ROLES.MASTER
            },
            { $set: update },
            { returnDocument: 'after' }
        );
    }

    
    async findNearbyMasters(location, radius, services = []) {
        const query = {
            role: USER_ROLES.MASTER,
            status: USER_STATUS.ACTIVE,
            'masterData.status': MASTER_STATUS.VERIFIED,
            'masterData.isOnline': true,
            'masterData.currentLocation.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: radius
                }
            }
        };

        if (services.length > 0) {
            query['masterData.services'] = { $in: services };
        }

        return await this.collection.find(query).toArray();
    }

    
    async softDelete(userId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    status: USER_STATUS.DELETED,
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}


module.exports = {
    UserModel,
    USER_ROLES,
    USER_STATUS,
    MASTER_STATUS,
    userSchema
};