// src/models/user.model.js

'use strict';

const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// Константы
const USER_ROLES = {
    CLIENT: 'client',
    MASTER: 'master',
    STO_OWNER: 'sto_owner',
    STO_EMPLOYEE: 'sto_employee',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

const USER_STATUS = {
    PENDING: 'pending',         // Ожидает верификации
    ACTIVE: 'active',          // Активен
    INACTIVE: 'inactive',      // Неактивен (сам отключил)
    BLOCKED: 'blocked',        // Заблокирован администрацией
    DELETED: 'deleted'         // Удален (soft delete)
};

const MASTER_STATUS = {
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};

// Схема пользователя
const userSchema = {
    // Основные поля
    _id: ObjectId,
    phone: String,              // +998901234567 - уникальный
    email: String,              // Опционально, для уведомлений
    password: String,           // Хеш пароля (bcrypt)

    // Профиль
    name: {
        first: String,
        last: String,
        middle: String          // Отчество
    },

    avatar: {
        url: String,
        thumbnailUrl: String,
        uploadedAt: Date
    },

    birthDate: Date,
    gender: String,             // male, female
    language: String,           // ru, uz, en

    // Роль и статус
    role: String,               // Из USER_ROLES
    status: String,             // Из USER_STATUS

    // Безопасность
    loginAttempts: Number,      // Счетчик неудачных попыток
    lockUntil: Date,           // Блокировка до указанного времени
    lastLogin: Date,
    lastLoginIp: String,

    // Верификация
    isPhoneVerified: Boolean,
    isEmailVerified: Boolean,
    phoneVerifiedAt: Date,
    emailVerifiedAt: Date,

    // Устройства
    devices: [{
        deviceId: String,
        deviceType: String,     // ios, android, web
        deviceModel: String,
        appVersion: String,
        pushToken: String,
        lastActiveAt: Date,
        addedAt: Date
    }],

    // Для клиентов
    clientData: {
        vehicles: [ObjectId],   // Ссылки на коллекцию vehicles
        favoriteServices: [String],
        defaultLocation: {
            address: String,
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number] // [longitude, latitude]
            }
        },
        referralCode: String,
        referredBy: ObjectId,
        bonusBalance: Number
    },

    // Для мастеров
    masterData: {
        status: String,         // Из MASTER_STATUS
        services: [String],     // Массив услуг, которые оказывает

        documents: [{
            type: String,       // passport, license, certificate
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
                coordinates: [[[Number]]] // GeoJSON polygon
            }
        }],

        currentLocation: {
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },
            accuracy: Number,
            heading: Number,    // Направление движения
            speed: Number,      // Скорость км/ч
            updatedAt: Date
        },

        isOnline: Boolean,
        lastOnlineAt: Date,

        rating: {
            average: Number,    // 1-5
            count: Number,      // Количество оценок
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
            averageResponseTime: Number, // В секундах
            completionRate: Number       // Процент завершенных
        },

        bankAccount: {
            cardNumber: String,
            cardHolder: String,
            bankName: String,
            isVerified: Boolean
        }
    },

    // Для владельцев и сотрудников СТО
    stoData: {
        stoId: ObjectId,        // Ссылка на СТО
        position: String,       // Должность
        permissions: [String],  // Массив разрешений

        // Для владельцев
        isOwner: Boolean,
        ownedStos: [ObjectId],  // Если владеет несколькими СТО

        // Рабочий график сотрудника
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

    // Для администраторов
    adminData: {
        level: String,          // operator, manager, admin, super_admin
        permissions: [String],  // Детальные права доступа
        assignedRegions: [String],
        notes: String          // Заметки о сотруднике
    },

    // Настройки уведомлений
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

    // Метаданные
    metadata: {
        source: String,         // app, web, import, admin
        registrationIp: String,
        userAgent: String,
        appVersion: String,
        platform: String        // ios, android, web
    },

    // Временные метки
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date            // Для soft delete
};

// Класс для работы с пользователями
class UserModel {
    constructor(db) {
        this.collection = db.collection('users');
        this.setupIndexes();
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Уникальные индексы
            await this.collection.createIndex({ phone: 1 }, {
                unique: true,
                partialFilterExpression: { phone: { $exists: true } }
            });

            await this.collection.createIndex({ email: 1 }, {
                unique: true,
                sparse: true,
                partialFilterExpression: { email: { $exists: true } }
            });

            // Составные индексы
            await this.collection.createIndex({ role: 1, status: 1 });
            await this.collection.createIndex({ 'masterData.isOnline': 1, 'masterData.status': 1 });
            await this.collection.createIndex({ 'masterData.services': 1 });
            await this.collection.createIndex({ 'masterData.rating.average': -1 });

            // Геопространственные индексы
            await this.collection.createIndex({ 'masterData.currentLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'clientData.defaultLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'masterData.serviceZones.polygon': '2dsphere' });

            // Индексы для поиска
            await this.collection.createIndex({ 'name.first': 'text', 'name.last': 'text' });
            await this.collection.createIndex({ createdAt: -1 });
            await this.collection.createIndex({ 'devices.deviceId': 1 });
            await this.collection.createIndex({ 'devices.pushToken': 1 });

            // TTL индекс для автоматического удаления старых удаленных пользователей
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 2592000 } // 30 дней
            );

        } catch (error) {
            console.error('Error creating user indexes:', error);
        }
    }

    // Создание нового пользователя
    async create(userData) {
        const now = new Date();

        const user = {
            _id: new ObjectId(),
            ...userData,

            // Defaults
            status: userData.status || USER_STATUS.PENDING,
            loginAttempts: 0,
            isPhoneVerified: false,
            isEmailVerified: false,
            devices: [],

            // Role-specific defaults
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

            // Notifications defaults
            notifications: {
                push: { enabled: true, orders: true, marketing: false, system: true },
                sms: { enabled: true, orders: true, marketing: false },
                email: { enabled: true, orders: true, marketing: false, reports: false },
                ...userData.notifications
            },

            createdAt: now,
            updatedAt: now
        };

        // Хешируем пароль если есть
        if (user.password) {
            user.password = await this.hashPassword(user.password);
        }

        const result = await this.collection.insertOne(user);
        return { ...user, _id: result.insertedId };
    }

    // Поиск пользователя по телефону
    async findByPhone(phone) {
        return await this.collection.findOne({
            phone,
            status: { $ne: USER_STATUS.DELETED }
        });
    }

    // Поиск пользователя по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: USER_STATUS.DELETED }
        });
    }

    // Обновление пользователя
    async update(id, updateData) {
        const { password, ...otherData } = updateData;

        const update = {
            ...otherData,
            updatedAt: new Date()
        };

        // Хешируем новый пароль если есть
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

    // Хеширование пароля
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Проверка пароля
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Увеличение счетчика неудачных попыток входа
    async incrementLoginAttempts(userId) {
        const maxAttempts = 5;
        const lockTime = 15 * 60 * 1000; // 15 минут

        const user = await this.collection.findOne({ _id: new ObjectId(userId) });

        const attempts = (user.loginAttempts || 0) + 1;
        const update = {
            loginAttempts: attempts,
            updatedAt: new Date()
        };

        // Блокируем после максимального количества попыток
        if (attempts >= maxAttempts) {
            update.lockUntil = new Date(Date.now() + lockTime);
        }

        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: update }
        );

        return attempts;
    }

    // Сброс счетчика попыток входа
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

    // Проверка блокировки
    async isLocked(userId) {
        const user = await this.collection.findOne({ _id: new ObjectId(userId) });

        if (!user.lockUntil) return false;

        const isLocked = user.lockUntil > new Date();

        // Автоматически разблокируем если время истекло
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

    // Добавление устройства
    async addDevice(userId, deviceData) {
        const device = {
            ...deviceData,
            addedAt: new Date(),
            lastActiveAt: new Date()
        };

        // Удаляем старое устройство если есть
        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { devices: { deviceId: device.deviceId } } }
        );

        // Добавляем новое
        await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $push: { devices: device },
                $set: { updatedAt: new Date() }
            }
        );

        return device;
    }

    // Обновление локации мастера
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

    // Поиск мастеров поблизости
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

    // Мягкое удаление
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

// Экспортируем
module.exports = {
    UserModel,
    USER_ROLES,
    USER_STATUS,
    MASTER_STATUS,
    userSchema
};