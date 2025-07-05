// src/models/master.model.js

'use strict';

const { ObjectId } = require('mongodb');
const { SERVICE_TYPES } = require('../utils/constants/service-types');

// Статусы мастера
const MASTER_STATUS = {
    PENDING_VERIFICATION: 'pending_verification', // Ожидает проверки
    VERIFIED: 'verified',                  // Верифицирован
    ACTIVE: 'active',                      // Активен (может принимать заказы)
    INACTIVE: 'inactive',                  // Неактивен (временно)
    SUSPENDED: 'suspended',                // Приостановлен администрацией
    BLOCKED: 'blocked',                    // Заблокирован
    REJECTED: 'rejected',                  // Отклонен при верификации
    DELETED: 'deleted'                     // Удален
};

// Типы мастеров
const MASTER_TYPES = {
    INDEPENDENT: 'independent',            // Независимый мастер
    STO_EMPLOYEE: 'sto_employee',          // Сотрудник СТО
    STO_PARTNER: 'sto_partner',            // Партнер СТО
    FREELANCER: 'freelancer',              // Фрилансер
    SPECIALIST: 'specialist'               // Узкий специалист
};

// Уровни квалификации
const SKILL_LEVELS = {
    BEGINNER: 'beginner',                  // Начинающий (< 1 год)
    JUNIOR: 'junior',                      // Младший (1-3 года)
    MIDDLE: 'middle',                      // Средний (3-5 лет)
    SENIOR: 'senior',                      // Старший (5-10 лет)
    EXPERT: 'expert'                       // Эксперт (10+ лет)
};

// Статусы онлайн
const ONLINE_STATUS = {
    ONLINE: 'online',                      // Онлайн и готов к заказам
    BUSY: 'busy',                          // Занят текущим заказом
    BREAK: 'break',                        // На перерыве
    OFFLINE: 'offline'                     // Офлайн
};

// Схема мастера
const masterSchema = {
    _id: ObjectId,

    // Связь с пользователем
    userId: ObjectId,                      // Обязательная связь с users

    // Основная информация
    type: String,                          // Из MASTER_TYPES
    status: String,                        // Из MASTER_STATUS
    onlineStatus: String,                  // Из ONLINE_STATUS

    // Персональные данные (дублируются для быстрого доступа)
    personal: {
        firstName: String,
        lastName: String,
        middleName: String,
        phone: String,
        email: String,

        birthDate: Date,
        gender: String,

        // Фото профиля
        avatar: {
            url: String,
            thumbnailUrl: String,
            verifiedAt: Date
        },

        // Языки
        languages: [{
            code: String,                  // ru, uz, en
            level: String                  // native, fluent, basic
        }]
    },

    // Профессиональная информация
    professional: {
        // Опыт работы
        experienceYears: Number,           // Общий опыт в годах
        experienceStartDate: Date,         // Начало карьеры

        // Уровень квалификации
        skillLevel: String,                // Из SKILL_LEVELS

        // Специализации
        specializations: [{
            serviceType: String,           // Из SERVICE_TYPES
            level: String,                 // Из SKILL_LEVELS
            experienceYears: Number,

            // Подтверждение навыка
            verified: Boolean,
            verifiedBy: ObjectId,
            verifiedAt: Date,

            // Сертификаты по специализации
            certificates: [{
                name: String,
                issuer: String,
                issueDate: Date,
                expiryDate: Date,
                fileUrl: String
            }]
        }],

        // Дополнительные навыки
        additionalSkills: [String],        // Например: diagnostics, welding, painting

        // Образование
        education: [{
            type: String,                  // higher, vocational, courses
            institution: String,
            speciality: String,
            degree: String,
            startYear: Number,
            endYear: Number,
            diploma: {
                number: String,
                fileUrl: String,
                verified: Boolean
            }
        }],

        // Опыт работы
        workHistory: [{
            company: String,
            position: String,
            startDate: Date,
            endDate: Date,
            description: String,

            // Рекомендации
            reference: {
                name: String,
                position: String,
                phone: String,
                verified: Boolean
            }
        }]
    },

    // Документы
    documents: {
        // Основные документы
        identity: {
            type: String,                  // passport, id_card
            series: String,
            number: String,
            issuedBy: String,
            issuedDate: Date,
            expiryDate: Date,

            files: {
                front: String,             // URL скана
                back: String,
                selfie: String            // Селфи с документом
            },

            verified: Boolean,
            verifiedAt: Date,
            verifiedBy: ObjectId
        },

        // ИНН
        tin: {
            number: String,
            fileUrl: String,
            verified: Boolean
        },

        // Водительское удостоверение
        driverLicense: {
            number: String,
            categories: [String],          // A, B, C, D, E
            issuedDate: Date,
            expiryDate: Date,
            fileUrl: String,
            verified: Boolean
        },

        // Медицинская книжка
        medicalBook: {
            number: String,
            issuedDate: Date,
            expiryDate: Date,
            fileUrl: String,
            verified: Boolean
        },

        // Криминальная проверка
        criminalRecord: {
            checkedAt: Date,
            clearance: Boolean,
            fileUrl: String,
            expiryDate: Date
        },

        // Страховка
        insurance: {
            type: String,                  // liability, accident
            policyNumber: String,
            company: String,
            coverage: Number,
            expiryDate: Date,
            fileUrl: String
        }
    },

    // Оборудование и инструменты
    equipment: {
        // Транспорт
        vehicle: {
            hasVehicle: Boolean,
            type: String,                  // car, motorcycle, bicycle
            brand: String,
            model: String,
            year: Number,
            plateNumber: String,
            color: String,

            photos: [{
                url: String,
                type: String               // exterior, interior, documents
            }],

            // Техосмотр
            inspection: {
                passedAt: Date,
                expiryDate: Date,
                fileUrl: String
            },

            // Страховка
            insurance: {
                type: String,              // OSAGO, KASKO
                expiryDate: Date,
                fileUrl: String
            }
        },

        // Инструменты
        tools: [{
            category: String,              // diagnostic, repair, measurement
            name: String,
            brand: String,
            model: String,

            condition: String,             // new, good, fair, poor
            purchaseDate: Date,

            // Для спец оборудования
            certification: {
                required: Boolean,
                certified: Boolean,
                certNumber: String,
                expiryDate: Date
            },

            photos: [String]
        }],

        // Специальное оборудование
        specialEquipment: [{
            type: String,                  // tow_truck, lift, generator
            description: String,
            available: Boolean,

            specifications: Object,        // Технические характеристики

            rental: {
                isRental: Boolean,
                provider: String,
                dailyCost: Number
            }
        }]
    },

    // Рабочие параметры
    work: {
        // График работы
        schedule: {
            type: String,                  // flexible, fixed, shift

            // Обычный график
            regular: [{
                dayOfWeek: Number,         // 0-6
                periods: [{
                    startTime: String,     // "09:00"
                    endTime: String,       // "18:00"
                    type: String           // working, break
                }],
                enabled: Boolean
            }],

            // Готовность к экстренным вызовам
            emergency: {
                available: Boolean,
                nightWork: Boolean,        // Работа ночью
                holidayWork: Boolean,      // Работа в праздники

                responseTime: Number       // Время отклика в минутах
            },

            // Отпуска и выходные
            vacations: [{
                startDate: Date,
                endDate: Date,
                reason: String,
                approved: Boolean
            }]
        },

        // Зоны обслуживания
        serviceAreas: [{
            name: String,

            // Основная зона
            primary: {
                type: { type: String },    // Polygon
                coordinates: [],           // GeoJSON
                radius: Number             // Или радиус от базовой точки
            },

            // Расширенная зона (с доплатой)
            extended: {
                type: { type: String },
                coordinates: [],
                radius: Number,
                surcharge: Number          // Процент доплаты
            },

            // Исключенные зоны
            excluded: [{
                type: { type: String },
                coordinates: [],
                reason: String
            }],

            isActive: Boolean,
            priority: Number
        }],

        // Базовая локация
        baseLocation: {
            address: String,
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },

            // Готовность выезжать
            mobility: {
                maxDistance: Number,       // Максимальная дистанция
                preferredDistance: Number, // Предпочтительная

                // Стоимость выезда
                travelCost: {
                    included: Number,      // Включено в стоимость (км)
                    perKm: Number         // Цена за км сверх
                }
            }
        },

        // Предпочтения по заказам
        orderPreferences: {
            // Типы услуг
            preferredServices: [String],
            excludedServices: [String],

            // Стоимость заказа
            minOrderAmount: Number,
            preferredOrderAmount: Number,

            // Автомобили
            preferredBrands: [String],
            excludedBrands: [String],

            // Клиенты
            corporateOnly: Boolean,
            regularCustomersOnly: Boolean,

            // Автопринятие
            autoAccept: {
                enabled: Boolean,
                services: [String],
                radius: Number,
                minAmount: Number
            }
        },

        // Загруженность
        capacity: {
            maxOrdersPerDay: Number,
            maxActiveOrders: Number,       // Одновременно

            currentLoad: {
                activeOrders: Number,
                todayOrders: Number,

                // Слоты времени
                busySlots: [{
                    startTime: Date,
                    endTime: Date,
                    orderId: ObjectId
                }]
            }
        }
    },

    // Финансы
    finance: {
        // Тарифы и комиссии
        rates: {
            platformCommission: Number,    // Комиссия платформы (%)

            // Специальные ставки
            specialRates: [{
                serviceType: String,
                commission: Number,
                validUntil: Date
            }],

            // Бонусные программы
            bonuses: {
                completionBonus: Number,   // За выполнение
                ratingBonus: Number,       // За высокий рейтинг
                rushHourBonus: Number,     // За час пик
                weekendBonus: Number       // За выходные
            }
        },

        // Цены на услуги (переопределение базовых)
        servicePrices: [{
            serviceType: String,

            basePrice: Number,
            minPrice: Number,

            // Наценки
            surcharges: {
                night: Number,             // Процент
                weekend: Number,
                holiday: Number,
                urgency: Number
            },

            // Скидки постоянным клиентам
            loyaltyDiscount: Number
        }],

        // Платежные реквизиты
        paymentDetails: {
            // Для выплат
            withdrawal: {
                method: String,            // card, bank, wallet

                card: {
                    number: String,
                    holder: String,
                    bank: String
                },

                bankAccount: {
                    account: String,
                    bank: String,
                    mfo: String,
                    inn: String
                },

                wallet: {
                    provider: String,      // payme, click
                    account: String
                }
            },

            // НДС
            tax: {
                payer: Boolean,
                rate: Number,
                number: String
            }
        },

        // Финансовая статистика
        stats: {
            totalEarned: Number,
            currentBalance: Number,
            pendingPayments: Number,

            thisMonth: {
                earned: Number,
                orders: Number,
                commission: Number,
                bonuses: Number,
                penalties: Number
            },

            lastMonth: {
                earned: Number,
                orders: Number,
                commission: Number
            },

            // История выплат
            withdrawalHistory: [{
                amount: Number,
                method: String,
                requestedAt: Date,
                processedAt: Date,
                status: String,
                reference: String
            }]
        }
    },

    // Рейтинг и репутация
    rating: {
        // Общий рейтинг
        overall: {
            score: Number,                 // 1-5
            count: Number,

            distribution: {
                5: Number,
                4: Number,
                3: Number,
                2: Number,
                1: Number
            }
        },

        // По категориям
        categories: {
            quality: Number,               // Качество работы
            speed: Number,                 // Скорость
            communication: Number,         // Общение
            price: Number,                 // Адекватность цены
            cleanliness: Number            // Чистота/аккуратность
        },

        // По типам услуг
        byService: [{
            serviceType: String,
            avgRating: Number,
            count: Number
        }],

        // Последние отзывы
        recentReviews: [{
            orderId: ObjectId,
            rating: Number,
            comment: String,
            categories: Object,
            customerId: ObjectId,
            customerName: String,
            createdAt: Date,

            // Ответ мастера
            response: {
                comment: String,
                createdAt: Date
            }
        }],

        // Достижения
        achievements: [{
            type: String,                  // top_rated, fast_response, etc
            title: String,
            description: String,
            earnedAt: Date,
            expiresAt: Date,

            badge: {
                icon: String,
                color: String
            }
        }],

        // Индекс надежности
        reliability: {
            score: Number,                 // 0-100

            factors: {
                completionRate: Number,    // Процент выполненных
                onTimeRate: Number,        // Вовремя прибыл
                responseRate: Number,      // Отвечает на заказы
                cancellationRate: Number,  // Процент отмен

                // Веса факторов
                weights: {
                    completion: 0.4,
                    onTime: 0.3,
                    response: 0.2,
                    cancellation: 0.1
                }
            },

            // Штрафные баллы
            penalties: [{
                reason: String,
                points: Number,
                date: Date,
                expiresAt: Date
            }]
        }
    },

    // Статистика работы
    statistics: {
        // Общая статистика
        lifetime: {
            totalOrders: Number,
            completedOrders: Number,
            cancelledOrders: Number,

            totalEarnings: Number,
            totalDistance: Number,         // км
            totalHours: Number,

            joinedAt: Date,
            firstOrderAt: Date,
            lastOrderAt: Date
        },

        // Текущий период
        current: {
            // Сегодня
            today: {
                orders: Number,
                earnings: Number,
                distance: Number,
                onlineHours: Number
            },

            // Эта неделя
            thisWeek: {
                orders: Number,
                earnings: Number,
                onlineHours: Number,
                avgResponseTime: Number
            },

            // Этот месяц
            thisMonth: {
                orders: Number,
                earnings: Number,
                completionRate: Number,
                avgRating: Number
            }
        },

        // Производительность
        performance: {
            avgOrdersPerDay: Number,
            avgEarningsPerOrder: Number,
            avgCompletionTime: Number,     // минуты
            avgResponseTime: Number,       // секунды

            // Пиковые показатели
            bestDay: {
                date: Date,
                orders: Number,
                earnings: Number
            },

            bestMonth: {
                month: String,
                orders: Number,
                earnings: Number
            }
        },

        // По услугам
        byService: [{
            serviceType: String,
            count: Number,
            totalEarnings: Number,
            avgTime: Number,
            avgRating: Number
        }],

        // По клиентам
        customers: {
            total: Number,
            regular: Number,               // 2+ заказов

            favorites: [{                  // Топ клиентов
                customerId: ObjectId,
                name: String,
                ordersCount: Number,
                totalSpent: Number
            }]
        },

        // Тренды
        trends: {
            monthlyOrders: [{
                month: String,             // "2024-01"
                orders: Number,
                earnings: Number,
                avgRating: Number
            }],

            weeklyPattern: [Number],       // 7 элементов (пн-вс)
            hourlyPattern: [Number]        // 24 элемента (0-23)
        }
    },

    // Отношения
    relationships: {
        // СТО
        sto: {
            current: {
                stoId: ObjectId,
                type: String,              // employee, partner
                position: String,
                joinedAt: Date,

                terms: {
                    commission: Number,
                    fixedSalary: Number,
                    benefits: [String]
                }
            },

            history: [{
                stoId: ObjectId,
                name: String,
                startDate: Date,
                endDate: Date,
                reason: String             // Причина ухода
            }]
        },

        // Команда (для групповой работы)
        team: {
            isLeader: Boolean,

            members: [{
                masterId: ObjectId,
                name: String,
                role: String,              // leader, member
                specialization: String
            }],

            // Распределение заработка
            revenueSharing: {
                type: String,              // equal, by_contribution, custom
                rules: Object
            }
        },

        // Менторство
        mentorship: {
            // Как ментор
            mentees: [{
                masterId: ObjectId,
                name: String,
                startDate: Date,
                status: String
            }],

            // Как ученик
            mentor: {
                masterId: ObjectId,
                name: String,
                startDate: Date
            }
        }
    },

    // Настройки и предпочтения
    preferences: {
        // Уведомления
        notifications: {
            push: {
                newOrders: Boolean,
                orderUpdates: Boolean,
                payments: Boolean,
                news: Boolean,
                marketing: Boolean
            },

            sms: {
                newOrders: Boolean,
                urgentOnly: Boolean
            },

            email: {
                reports: Boolean,
                news: Boolean
            },

            // Звуковые уведомления
            sound: {
                enabled: Boolean,
                volume: Number,
                customSound: String
            }
        },

        // Интерфейс
        interface: {
            language: String,              // ru, uz, en
            theme: String,                 // light, dark, auto
            mapStyle: String,              // standard, satellite, terrain

            // Виджеты главного экрана
            dashboard: {
                widgets: [String],         // earnings, rating, orders, etc
                layout: String            // grid, list
            }
        },

        // Приватность
        privacy: {
            showFullName: Boolean,
            showPhone: Boolean,
            showPhoto: Boolean,

            // Для клиентов
            shareLocation: String,         // always, during_order, never
            allowDirectContact: Boolean
        },

        // Автоматизация
        automation: {
            // Автоответы
            autoResponses: [{
                trigger: String,           // new_order, customer_message
                message: String,
                enabled: Boolean
            }],

            // Автостатусы
            autoStatus: {
                goOfflineAfter: Number,    // Минут неактивности
                breakAfterOrders: Number,  // Перерыв после N заказов
                breakDuration: Number      // Длительность перерыва
            }
        }
    },

    // Обучение и развитие
    development: {
        // Пройденные курсы
        courses: [{
            name: String,
            provider: String,
            completedAt: Date,
            certificate: {
                number: String,
                fileUrl: String
            },

            // Результаты
            score: Number,
            passed: Boolean
        }],

        // Навыки для развития
        skillsToImprove: [{
            skill: String,
            currentLevel: String,
            targetLevel: String,
            progress: Number               // 0-100
        }],

        // План развития
        developmentPlan: {
            goals: [{
                title: String,
                description: String,
                deadline: Date,
                completed: Boolean
            }],

            nextReview: Date
        }
    },

    // Безопасность
    security: {
        // Проверки
        backgroundCheck: {
            completed: Boolean,
            date: Date,
            result: String,                // passed, failed, pending
            expiresAt: Date
        },

        // Инциденты
        incidents: [{
            type: String,                  // accident, complaint, violation
            date: Date,
            description: String,
            severity: String,              // low, medium, high
            resolved: Boolean,

            outcome: {
                action: String,            // warning, suspension, training
                description: String
            }
        }],

        // Блокировки
        suspensions: [{
            reason: String,
            startDate: Date,
            endDate: Date,
            permanent: Boolean,

            conditions: String             // Условия восстановления
        }],

        // Доверие
        trustScore: Number,                // 0-100

        // Экстренные контакты
        emergencyContacts: [{
            name: String,
            relation: String,
            phone: String,
            verified: Boolean
        }]
    },

    // Метрики качества
    quality: {
        // Показатели качества
        metrics: {
            // Точность диагностики
            diagnosticAccuracy: Number,    // 0-100

            // Качество ремонта
            repairQuality: {
                firstTimeFixRate: Number,  // Процент с первого раза
                comebackRate: Number,      // Процент возвратов
                warrantyClaimRate: Number  // Процент по гарантии
            },

            // Профессионализм
            professionalism: {
                appearanceScore: Number,
                communicationScore: Number,
                timelinessScore: Number
            }
        },

        // Контроль качества
        qualityChecks: [{
            date: Date,
            type: String,                  // random, scheduled, complaint
            inspector: ObjectId,

            results: {
                score: Number,
                issues: [String],
                recommendations: [String]
            },

            followUp: {
                required: Boolean,
                completedAt: Date
            }
        }],

        // Обратная связь от СТО
        stoFeedback: [{
            stoId: ObjectId,
            date: Date,
            rating: Number,
            comment: String,
            areas: {
                technical: Number,
                communication: Number,
                reliability: Number
            }
        }]
    },

    // Текущее состояние
    currentState: {
        // Локация
        location: {
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: [Number]
            },

            accuracy: Number,
            heading: Number,               // Направление движения
            speed: Number,                 // Скорость

            updatedAt: Date,
            source: String                 // gps, network, manual
        },

        // Текущий заказ
        activeOrder: {
            orderId: ObjectId,
            status: String,
            startedAt: Date,

            customer: {
                name: String,
                phone: String,
                location: Object
            }
        },

        // Очередь заказов
        orderQueue: [{
            orderId: ObjectId,
            scheduledTime: Date,
            estimatedDuration: Number
        }],

        // Статус смены
        shift: {
            startedAt: Date,
            scheduledEndAt: Date,

            breaks: [{
                startedAt: Date,
                endedAt: Date,
                type: String               // lunch, rest, prayer
            }],

            summary: {
                ordersCompleted: Number,
                earnings: Number,
                distance: Number,
                onlineHours: Number
            }
        }
    },

    // Геймификация
    gamification: {
        // Уровень
        level: {
            current: Number,
            experience: Number,
            nextLevelExp: Number,
            title: String                  // "Новичок", "Профи", "Эксперт"
        },

        // Достижения
        achievements: [{
            id: String,
            name: String,
            description: String,
            icon: String,

            progress: {
                current: Number,
                target: Number,
                completed: Boolean
            },

            reward: {
                type: String,              // bonus, badge, discount
                value: Number
            },

            unlockedAt: Date
        }],

        // Текущие задания
        quests: [{
            id: String,
            type: String,                  // daily, weekly, special
            title: String,
            description: String,

            requirements: [{
                type: String,              // orders, rating, distance
                target: Number,
                current: Number
            }],

            reward: {
                exp: Number,
                bonus: Number
            },

            expiresAt: Date
        }],

        // Рейтинг среди мастеров
        leaderboard: {
            overall: {
                rank: Number,
                totalMasters: Number,
                percentile: Number         // Топ X%
            },

            byCategory: [{
                category: String,          // earnings, orders, rating
                rank: Number,
                value: Number
            }],

            // Среди коллег СТО
            stoRank: {
                rank: Number,
                totalInSto: Number
            }
        },

        // Награды
        rewards: {
            points: Number,                // Баллы лояльности

            available: [{
                id: String,
                name: String,
                cost: Number,
                type: String               // discount, bonus, gift
            }],

            redeemed: [{
                rewardId: String,
                name: String,
                redeemedAt: Date,
                usedAt: Date
            }]
        }
    },

    // Интеграции
    integrations: {
        // Мессенджеры
        messengers: {
            telegram: {
                chatId: String,
                username: String,
                verified: Boolean,
                notifications: Boolean
            },

            whatsapp: {
                number: String,
                verified: Boolean
            }
        },

        // Внешние сервисы
        external: {
            // Трекинг
            tracking: {
                provider: String,          // google, yandex
                enabled: Boolean,
                shareLink: String
            },

            // Календарь
            calendar: {
                provider: String,          // google, outlook
                syncEnabled: Boolean,
                calendarId: String
            }
        }
    },

    // Логи и аудит
    audit: {
        // Последние действия
        recentActions: [{
            action: String,
            details: Object,
            ip: String,
            userAgent: String,
            timestamp: Date
        }],

        // История изменений
        changelog: [{
            field: String,
            oldValue: Object,
            newValue: Object,
            changedBy: ObjectId,
            changedAt: Date,
            reason: String
        }]
    },

    // Метаданные
    metadata: {
        source: String,                    // app, web, import, referral
        referrer: {
            type: String,                  // master, customer, sto, marketing
            id: ObjectId,
            campaign: String
        },

        tags: [String],                    // Для сегментации
        flags: [String],                   // Специальные отметки

        customFields: Object,              // Дополнительные поля
        notes: String                      // Внутренние заметки
    },

    // Временные метки
    createdAt: Date,
    updatedAt: Date,

    verifiedAt: Date,
    lastActiveAt: Date,
    deletedAt: Date                        // Для soft delete
};

// Класс для работы с мастерами
class MasterModel {
    constructor(db) {
        this.collection = db.collection('masters');
        this.setupIndexes();
    }

    // Создание индексов
    async setupIndexes() {
        try {
            // Уникальные индексы
            await this.collection.createIndex(
                { userId: 1 },
                {
                    unique: true,
                    partialFilterExpression: {
                        status: { $ne: MASTER_STATUS.DELETED }
                    }
                }
            );

            // Составные индексы для поиска
            await this.collection.createIndex({
                status: 1,
                onlineStatus: 1,
                'currentState.location.coordinates': '2dsphere'
            });

            await this.collection.createIndex({
                'professional.specializations.serviceType': 1,
                status: 1,
                onlineStatus: 1
            });

            // Геопространственные индексы
            await this.collection.createIndex({ 'currentState.location.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'work.baseLocation.coordinates': '2dsphere' });
            await this.collection.createIndex({ 'work.serviceAreas.primary': '2dsphere' });
            await this.collection.createIndex({ 'work.serviceAreas.extended': '2dsphere' });

            // Индексы для рейтинга и статистики
            await this.collection.createIndex({ 'rating.overall.score': -1 });
            await this.collection.createIndex({ 'rating.reliability.score': -1 });
            await this.collection.createIndex({ 'statistics.lifetime.totalOrders': -1 });
            await this.collection.createIndex({ 'statistics.current.thisMonth.earnings': -1 });

            // Индексы для связей
            await this.collection.createIndex({ 'relationships.sto.current.stoId': 1 });
            await this.collection.createIndex({ 'relationships.team.members.masterId': 1 });

            // Текстовый поиск
            await this.collection.createIndex({
                'personal.firstName': 'text',
                'personal.lastName': 'text',
                'professional.specializations.serviceType': 'text',
                'professional.additionalSkills': 'text'
            });

            // Индексы для финансов
            await this.collection.createIndex({ 'finance.stats.currentBalance': -1 });

            // TTL индекс
            await this.collection.createIndex(
                { deletedAt: 1 },
                { expireAfterSeconds: 2592000 } // 30 дней
            );

        } catch (error) {
            console.error('Error creating master indexes:', error);
        }
    }

    // Создание нового мастера
    async create(masterData) {
        const now = new Date();

        const master = {
            _id: new ObjectId(),
            ...masterData,

            // Defaults
            status: masterData.status || MASTER_STATUS.PENDING_VERIFICATION,
            onlineStatus: ONLINE_STATUS.OFFLINE,

            rating: {
                overall: {
                    score: 0,
                    count: 0,
                    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                },
                categories: {
                    quality: 0,
                    speed: 0,
                    communication: 0,
                    price: 0,
                    cleanliness: 0
                },
                byService: [],
                recentReviews: [],
                achievements: [],
                reliability: {
                    score: 100,
                    factors: {
                        completionRate: 100,
                        onTimeRate: 100,
                        responseRate: 100,
                        cancellationRate: 0
                    },
                    penalties: []
                },
                ...masterData.rating
            },

            statistics: {
                lifetime: {
                    totalOrders: 0,
                    completedOrders: 0,
                    cancelledOrders: 0,
                    totalEarnings: 0,
                    totalDistance: 0,
                    totalHours: 0,
                    joinedAt: now
                },
                current: {
                    today: {
                        orders: 0,
                        earnings: 0,
                        distance: 0,
                        onlineHours: 0
                    },
                    thisWeek: {
                        orders: 0,
                        earnings: 0,
                        onlineHours: 0,
                        avgResponseTime: 0
                    },
                    thisMonth: {
                        orders: 0,
                        earnings: 0,
                        completionRate: 100,
                        avgRating: 0
                    }
                },
                performance: {
                    avgOrdersPerDay: 0,
                    avgEarningsPerOrder: 0,
                    avgCompletionTime: 0,
                    avgResponseTime: 0
                },
                byService: [],
                customers: {
                    total: 0,
                    regular: 0,
                    favorites: []
                },
                trends: {
                    monthlyOrders: [],
                    weeklyPattern: new Array(7).fill(0),
                    hourlyPattern: new Array(24).fill(0)
                },
                ...masterData.statistics
            },

            finance: {
                stats: {
                    totalEarned: 0,
                    currentBalance: 0,
                    pendingPayments: 0,
                    thisMonth: {
                        earned: 0,
                        orders: 0,
                        commission: 0,
                        bonuses: 0,
                        penalties: 0
                    },
                    lastMonth: {
                        earned: 0,
                        orders: 0,
                        commission: 0
                    },
                    withdrawalHistory: []
                },
                ...masterData.finance
            },

            work: {
                capacity: {
                    currentLoad: {
                        activeOrders: 0,
                        todayOrders: 0,
                        busySlots: []
                    }
                },
                ...masterData.work
            },

            gamification: {
                level: {
                    current: 1,
                    experience: 0,
                    nextLevelExp: 100,
                    title: 'Новичок'
                },
                achievements: [],
                quests: [],
                leaderboard: {
                    overall: {
                        rank: 0,
                        totalMasters: 0,
                        percentile: 0
                    },
                    byCategory: []
                },
                rewards: {
                    points: 0,
                    available: [],
                    redeemed: []
                },
                ...masterData.gamification
            },

            currentState: {
                shift: {
                    breaks: [],
                    summary: {
                        ordersCompleted: 0,
                        earnings: 0,
                        distance: 0,
                        onlineHours: 0
                    }
                },
                orderQueue: [],
                ...masterData.currentState
            },

            quality: {
                metrics: {
                    diagnosticAccuracy: 100,
                    repairQuality: {
                        firstTimeFixRate: 100,
                        comebackRate: 0,
                        warrantyClaimRate: 0
                    },
                    professionalism: {
                        appearanceScore: 100,
                        communicationScore: 100,
                        timelinessScore: 100
                    }
                },
                qualityChecks: [],
                stoFeedback: [],
                ...masterData.quality
            },

            security: {
                trustScore: 100,
                incidents: [],
                suspensions: [],
                ...masterData.security
            },

            audit: {
                recentActions: [],
                changelog: []
            },

            createdAt: now,
            updatedAt: now
        };

        const result = await this.collection.insertOne(master);
        return { ...master, _id: result.insertedId };
    }

    // Поиск мастера по ID
    async findById(id) {
        return await this.collection.findOne({
            _id: new ObjectId(id),
            status: { $ne: MASTER_STATUS.DELETED }
        });
    }

    // Поиск мастера по userId
    async findByUserId(userId) {
        return await this.collection.findOne({
            userId: new ObjectId(userId),
            status: { $ne: MASTER_STATUS.DELETED }
        });
    }

    // Поиск активных мастеров
    async findActive(filters = {}) {
        const query = {
            status: MASTER_STATUS.ACTIVE,
            onlineStatus: { $in: [ONLINE_STATUS.ONLINE, ONLINE_STATUS.BUSY] },
            ...filters
        };

        return await this.collection.find(query).toArray();
    }

    // Поиск мастеров поблизости
    async findNearby(location, radius = 5000, filters = {}) {
        const query = {
            status: MASTER_STATUS.ACTIVE,
            onlineStatus: ONLINE_STATUS.ONLINE,
            'currentState.location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    $maxDistance: radius
                }
            },
            ...filters
        };

        return await this.collection.find(query).toArray();
    }

    // Поиск мастеров по услуге
    async findByService(serviceType, location = null, options = {}) {
        const {
            radius = 10000,
            minRating = 0,
            maxPrice = null,
            onlineOnly = true
        } = options;

        const query = {
            status: MASTER_STATUS.ACTIVE,
            'professional.specializations.serviceType': serviceType
        };

        if (onlineOnly) {
            query.onlineStatus = ONLINE_STATUS.ONLINE;
        }

        if (minRating > 0) {
            query['rating.overall.score'] = { $gte: minRating };
        }

        if (maxPrice) {
            query['finance.servicePrices'] = {
                $elemMatch: {
                    serviceType: serviceType,
                    basePrice: { $lte: maxPrice }
                }
            };
        }

        if (location) {
            // Используем aggregation для сортировки по расстоянию
            return await this.collection.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [location.lng, location.lat]
                        },
                        distanceField: 'distance',
                        query: query,
                        spherical: true,
                        maxDistance: radius
                    }
                },
                {
                    $addFields: {
                        // Добавляем оценку для сортировки
                        matchScore: {
                            $add: [
                                { $multiply: ['$rating.overall.score', 1000] },
                                { $multiply: ['$rating.reliability.score', 10] },
                                { $divide: [1, { $add: ['$distance', 1] }] }
                            ]
                        }
                    }
                },
                { $sort: { matchScore: -1 } },
                { $limit: 20 }
            ]).toArray();
        }

        return await this.collection
            .find(query)
            .sort({ 'rating.overall.score': -1 })
            .limit(20)
            .toArray();
    }

    // Обновление мастера
    async update(id, updateData) {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    // Обновление онлайн статуса
    async updateOnlineStatus(masterId, status) {
        const updateData = {
            onlineStatus: status,
            lastActiveAt: new Date()
        };

        // Если переходит в онлайн, начинаем смену
        if (status === ONLINE_STATUS.ONLINE) {
            updateData['currentState.shift.startedAt'] = new Date();
        }

        // Если переходит в офлайн, завершаем смену
        if (status === ONLINE_STATUS.OFFLINE) {
            const master = await this.findById(masterId);
            if (master?.currentState?.shift?.startedAt) {
                const shiftDuration = Date.now() - master.currentState.shift.startedAt.getTime();
                updateData['$inc'] = {
                    'statistics.current.today.onlineHours': shiftDuration / 3600000
                };
            }
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: updateData,
                ...updateData.$inc && { $inc: updateData.$inc }
            },
            { returnDocument: 'after' }
        );
    }

    // Обновление локации
    async updateLocation(masterId, locationData) {
        const location = {
            coordinates: {
                type: 'Point',
                coordinates: [locationData.lng, locationData.lat]
            },
            accuracy: locationData.accuracy,
            heading: locationData.heading,
            speed: locationData.speed,
            updatedAt: new Date(),
            source: locationData.source || 'gps'
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.location': location,
                    lastActiveAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Обновление статистики после заказа
    async updateOrderStatistics(masterId, orderData) {
        const {
            status,
            totalAmount,
            commission,
            distance,
            duration,
            serviceType,
            rating,
            customerId
        } = orderData;

        const updateQuery = {
            $inc: {
                'statistics.lifetime.totalOrders': 1,
                'statistics.current.today.orders': 1,
                'statistics.current.thisWeek.orders': 1,
                'statistics.current.thisMonth.orders': 1
            }
        };

        if (status === 'completed') {
            const earnings = totalAmount - commission;

            updateQuery.$inc['statistics.lifetime.completedOrders'] = 1;
            updateQuery.$inc['statistics.lifetime.totalEarnings'] = earnings;
            updateQuery.$inc['statistics.current.today.earnings'] = earnings;
            updateQuery.$inc['statistics.current.thisWeek.earnings'] = earnings;
            updateQuery.$inc['statistics.current.thisMonth.earnings'] = earnings;
            updateQuery.$inc['finance.stats.totalEarned'] = earnings;
            updateQuery.$inc['finance.stats.thisMonth.earned'] = earnings;
            updateQuery.$inc['finance.stats.thisMonth.orders'] = 1;
            updateQuery.$inc['finance.stats.thisMonth.commission'] = commission;

            if (distance) {
                updateQuery.$inc['statistics.lifetime.totalDistance'] = distance;
                updateQuery.$inc['statistics.current.today.distance'] = distance;
            }

            if (duration) {
                updateQuery.$inc['statistics.lifetime.totalHours'] = duration / 3600;
            }

            // Обновление статистики по услугам
            updateQuery.$push = {
                'statistics.byService': {
                    $each: [{
                        serviceType,
                        count: 1,
                        totalEarnings: earnings,
                        avgTime: duration,
                        avgRating: rating || 0
                    }],
                    $slice: -50
                }
            };

        } else if (status === 'cancelled') {
            updateQuery.$inc['statistics.lifetime.cancelledOrders'] = 1;
        }

        // Обновление паттернов
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();

        updateQuery.$inc[`statistics.trends.hourlyPattern.${hour}`] = 1;
        updateQuery.$inc[`statistics.trends.weeklyPattern.${dayOfWeek}`] = 1;

        updateQuery.$set = {
            'statistics.lifetime.lastOrderAt': new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );

        // Пересчет средних показателей
        if (result && status === 'completed') {
            await this.recalculateAverages(masterId);
        }

        return result;
    }

    // Пересчет средних показателей
    async recalculateAverages(masterId) {
        const master = await this.findById(masterId);
        if (!master) return;

        const stats = master.statistics.lifetime;
        const updateQuery = { $set: {} };

        if (stats.totalOrders > 0) {
            updateQuery.$set['statistics.performance.avgEarningsPerOrder'] =
                stats.totalEarnings / stats.completedOrders;

            updateQuery.$set['statistics.current.thisMonth.completionRate'] =
                (stats.completedOrders / stats.totalOrders) * 100;
        }

        // Расчет среднего количества заказов в день
        const daysSinceJoined = Math.max(1,
            (Date.now() - stats.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        updateQuery.$set['statistics.performance.avgOrdersPerDay'] =
            stats.totalOrders / daysSinceJoined;

        // Обновление индекса надежности
        const reliability = this.calculateReliabilityScore(master);
        updateQuery.$set['rating.reliability.score'] = reliability.score;
        updateQuery.$set['rating.reliability.factors'] = reliability.factors;

        await this.collection.updateOne(
            { _id: new ObjectId(masterId) },
            updateQuery
        );
    }

    // Расчет индекса надежности
    calculateReliabilityScore(master) {
        const stats = master.statistics.lifetime;
        const factors = master.rating.reliability.factors;
        const weights = factors.weights;

        // Расчет факторов
        const completionRate = stats.totalOrders > 0
            ? (stats.completedOrders / stats.totalOrders) * 100
            : 100;

        const cancellationRate = stats.totalOrders > 0
            ? (stats.cancelledOrders / stats.totalOrders) * 100
            : 0;

        // Здесь должны быть реальные данные из заказов
        const onTimeRate = factors.onTimeRate || 100;
        const responseRate = factors.responseRate || 100;

        // Взвешенный расчет
        const score =
            (completionRate * weights.completion) +
            (onTimeRate * weights.onTime) +
            (responseRate * weights.response) +
            ((100 - cancellationRate) * weights.cancellation);

        // Учет штрафных баллов
        const activePenalties = master.rating.reliability.penalties
            .filter(p => !p.expiresAt || p.expiresAt > new Date())
            .reduce((sum, p) => sum + p.points, 0);

        return {
            score: Math.max(0, Math.min(100, score - activePenalties)),
            factors: {
                completionRate,
                onTimeRate,
                responseRate,
                cancellationRate,
                weights
            }
        };
    }

    // Обновление рейтинга
    async updateRating(masterId, ratingData) {
        const {
            orderId,
            rating,
            comment,
            categories,
            customerId,
            customerName,
            serviceType
        } = ratingData;

        const master = await this.findById(masterId);
        if (!master) return null;

        const updateQuery = {
            $inc: {
                [`rating.overall.distribution.${rating}`]: 1,
                'rating.overall.count': 1
            },
            $push: {
                'rating.recentReviews': {
                    $each: [{
                        orderId,
                        rating,
                        comment,
                        categories,
                        customerId,
                        customerName,
                        createdAt: new Date()
                    }],
                    $slice: -20 // Храним последние 20 отзывов
                }
            }
        };

        // Пересчет среднего рейтинга
        const distribution = master.rating.overall.distribution;
        distribution[rating] = (distribution[rating] || 0) + 1;

        let totalScore = 0;
        let totalCount = 0;

        Object.entries(distribution).forEach(([score, count]) => {
            totalScore += parseInt(score) * count;
            totalCount += count;
        });

        updateQuery.$set = {
            'rating.overall.score': totalCount > 0 ? totalScore / totalCount : 0,
            'statistics.current.thisMonth.avgRating': totalCount > 0 ? totalScore / totalCount : 0
        };

        // Обновление рейтинга по категориям
        if (categories) {
            Object.entries(categories).forEach(([category, score]) => {
                if (master.rating.categories[category] !== undefined) {
                    const current = master.rating.categories[category];
                    const count = master.rating.overall.count;
                    const newAvg = (current * count + score) / (count + 1);
                    updateQuery.$set[`rating.categories.${category}`] = newAvg;
                }
            });
        }

        // Обновление рейтинга по услуге
        const serviceRatingIndex = master.rating.byService
            .findIndex(s => s.serviceType === serviceType);

        if (serviceRatingIndex >= 0) {
            const serviceRating = master.rating.byService[serviceRatingIndex];
            const newAvg = (serviceRating.avgRating * serviceRating.count + rating) /
                (serviceRating.count + 1);

            updateQuery.$set[`rating.byService.${serviceRatingIndex}.avgRating`] = newAvg;
            updateQuery.$inc[`rating.byService.${serviceRatingIndex}.count`] = 1;
        } else {
            updateQuery.$push['rating.byService'] = {
                serviceType,
                avgRating: rating,
                count: 1
            };
        }

        updateQuery.$set.updatedAt = new Date();

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Добавление достижения
    async addAchievement(masterId, achievement) {
        const newAchievement = {
            ...achievement,
            earnedAt: new Date()
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $push: { 'rating.achievements': newAchievement },
                $inc: { 'gamification.level.experience': achievement.expReward || 0 },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );
    }

    // Обновление финансов
    async updateFinance(masterId, transaction) {
        const updateQuery = {
            $inc: {},
            $set: { updatedAt: new Date() }
        };

        switch (transaction.type) {
            case 'earning':
                updateQuery.$inc['finance.stats.currentBalance'] = transaction.amount;
                updateQuery.$inc['finance.stats.pendingPayments'] = -transaction.amount;
                break;

            case 'withdrawal':
                updateQuery.$inc['finance.stats.currentBalance'] = -transaction.amount;
                updateQuery.$push = {
                    'finance.stats.withdrawalHistory': {
                        $each: [{
                            ...transaction,
                            requestedAt: new Date(),
                            status: 'pending'
                        }],
                        $slice: -50
                    }
                };
                break;

            case 'bonus':
                updateQuery.$inc['finance.stats.currentBalance'] = transaction.amount;
                updateQuery.$inc['finance.stats.thisMonth.bonuses'] = transaction.amount;
                break;

            case 'penalty':
                updateQuery.$inc['finance.stats.currentBalance'] = -transaction.amount;
                updateQuery.$inc['finance.stats.thisMonth.penalties'] = transaction.amount;
                break;
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Верификация мастера
    async verify(masterId, verificationData) {
        const verification = {
            status: MASTER_STATUS.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: verificationData.verifiedBy,

            documents: verificationData.documents,

            'security.backgroundCheck': {
                completed: true,
                date: new Date(),
                result: 'passed',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 год
            }
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    ...verification,
                    status: MASTER_STATUS.ACTIVE,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Добавление инцидента
    async addIncident(masterId, incident) {
        const newIncident = {
            ...incident,
            date: new Date(),
            resolved: false
        };

        // Расчет влияния на trust score
        const penaltyPoints = {
            low: 5,
            medium: 10,
            high: 20,
            critical: 50
        };

        const updateQuery = {
            $push: { 'security.incidents': newIncident },
            $inc: {
                'security.trustScore': -(penaltyPoints[incident.severity] || 10)
            },
            $set: { updatedAt: new Date() }
        };

        // Добавление штрафа в надежность
        if (incident.severity !== 'low') {
            updateQuery.$push['rating.reliability.penalties'] = {
                reason: incident.type,
                points: penaltyPoints[incident.severity],
                date: new Date(),
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 дней
            };
        }

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Обновление прогресса квеста
    async updateQuestProgress(masterId, questId, progress) {
        const master = await this.findById(masterId);
        if (!master) return null;

        const questIndex = master.gamification.quests
            .findIndex(q => q.id === questId);

        if (questIndex < 0) return null;

        const quest = master.gamification.quests[questIndex];
        const updateQuery = { $set: {} };

        // Обновление прогресса по требованиям
        progress.forEach(p => {
            const reqIndex = quest.requirements
                .findIndex(r => r.type === p.type);

            if (reqIndex >= 0) {
                updateQuery.$set[`gamification.quests.${questIndex}.requirements.${reqIndex}.current`] = p.current;
            }
        });

        // Проверка выполнения квеста
        const allCompleted = quest.requirements
            .every(r => r.current >= r.target);

        if (allCompleted) {
            updateQuery.$inc = {
                'gamification.level.experience': quest.reward.exp || 0,
                'gamification.rewards.points': quest.reward.bonus || 0
            };

            updateQuery.$pull = { 'gamification.quests': { id: questId } };
        }

        updateQuery.$set.updatedAt = new Date();

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            updateQuery,
            { returnDocument: 'after' }
        );
    }

    // Поиск топ мастеров
    async getTopMasters(limit = 10, criteria = 'rating', filters = {}) {
        const sortOptions = {
            rating: { 'rating.overall.score': -1 },
            orders: { 'statistics.lifetime.completedOrders': -1 },
            earnings: { 'statistics.lifetime.totalEarnings': -1 },
            reliability: { 'rating.reliability.score': -1 }
        };

        const query = {
            status: MASTER_STATUS.ACTIVE,
            ...filters
        };

        return await this.collection
            .find(query)
            .sort(sortOptions[criteria] || sortOptions.rating)
            .limit(limit)
            .toArray();
    }

    // Получение мастеров для заказа
    async findForOrder(orderData) {
        const {
            serviceType,
            location,
            vehicleBrand,
            urgency,
            preferredMasterId,
            excludedMasterIds = []
        } = orderData;

        // Если указан предпочтительный мастер
        if (preferredMasterId) {
            const preferredMaster = await this.findById(preferredMasterId);
            if (preferredMaster &&
                preferredMaster.status === MASTER_STATUS.ACTIVE &&
                preferredMaster.onlineStatus === ONLINE_STATUS.ONLINE) {
                return [preferredMaster];
            }
        }

        // Базовые фильтры
        const filters = {
            _id: { $nin: excludedMasterIds.map(id => new ObjectId(id)) },
            'professional.specializations.serviceType': serviceType,
            'work.capacity.currentLoad.activeOrders': {
                $lt: { $ifNull: ['$work.capacity.maxActiveOrders', 3] }
            }
        };

        // Фильтр по марке автомобиля
        if (vehicleBrand) {
            filters.$or = [
                { 'work.orderPreferences.preferredBrands': vehicleBrand },
                {
                    'work.orderPreferences.preferredBrands': { $size: 0 },
                    'work.orderPreferences.excludedBrands': { $ne: vehicleBrand }
                }
            ];
        }

        // Поиск с учетом расстояния и зон обслуживания
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    distanceField: 'distance',
                    query: {
                        status: MASTER_STATUS.ACTIVE,
                        onlineStatus: ONLINE_STATUS.ONLINE,
                        ...filters
                    },
                    spherical: true,
                    maxDistance: 30000 // 30км максимум
                }
            },
            {
                $match: {
                    $or: [
                        // В основной зоне обслуживания
                        {
                            'work.serviceAreas.primary': {
                                $geoIntersects: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [location.lng, location.lat]
                                    }
                                }
                            }
                        },
                        // В расширенной зоне
                        {
                            'work.serviceAreas.extended': {
                                $geoIntersects: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [location.lng, location.lat]
                                    }
                                }
                            }
                        },
                        // Или в пределах мобильности
                        {
                            distance: { $lte: { $ifNull: ['$work.baseLocation.mobility.maxDistance', 10000] } }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    // Расчет оценки для сортировки
                    matchScore: {
                        $add: [
                            // Рейтинг (0-5000)
                            { $multiply: ['$rating.overall.score', 1000] },

                            // Надежность (0-1000)
                            { $multiply: ['$rating.reliability.score', 10] },

                            // Близость (0-100)
                            { $multiply: [
                                    { $divide: [
                                            { $subtract: [30000, '$distance'] },
                                            300
                                        ]},
                                    1
                                ]},

                            // Опыт с услугой (0-500)
                            {
                                $multiply: [
                                    {
                                        $ifNull: [
                                            {
                                                $arrayElemAt: [
                                                    '$statistics.byService.count',
                                                    {
                                                        $indexOfArray: [
                                                            '$statistics.byService.serviceType',
                                                            serviceType
                                                        ]
                                                    }
                                                ]
                                            },
                                            0
                                        ]
                                    },
                                    5
                                ]
                            },

                            // Бонус за предпочтительную марку (0-200)
                            {
                                $cond: [
                                    { $in: [vehicleBrand, '$work.orderPreferences.preferredBrands'] },
                                    200,
                                    0
                                ]
                            },

                            // Штраф за высокую загрузку (-200-0)
                            {
                                $multiply: [
                                    '$work.capacity.currentLoad.activeOrders',
                                    -100
                                ]
                            }
                        ]
                    },

                    // Проверка автоакцепта
                    willAutoAccept: {
                        $and: [
                            '$work.orderPreferences.autoAccept.enabled',
                            { $in: [serviceType, '$work.orderPreferences.autoAccept.services'] },
                            { $lte: ['$distance', '$work.orderPreferences.autoAccept.radius'] }
                        ]
                    }
                }
            },
            { $sort: { willAutoAccept: -1, matchScore: -1 } },
            { $limit: urgency === 'high' ? 5 : 10 }
        ];

        return await this.collection.aggregate(pipeline).toArray();
    }

    // Проверка доступности мастера
    async checkAvailability(masterId, dateTime = new Date()) {
        const master = await this.findById(masterId);
        if (!master) {
            return { available: false, reason: 'master_not_found' };
        }

        if (master.status !== MASTER_STATUS.ACTIVE) {
            return { available: false, reason: 'master_not_active' };
        }

        if (master.onlineStatus === ONLINE_STATUS.OFFLINE) {
            return { available: false, reason: 'master_offline' };
        }

        if (master.onlineStatus === ONLINE_STATUS.BREAK) {
            return { available: false, reason: 'master_on_break' };
        }

        // Проверка загруженности
        const currentLoad = master.work.capacity.currentLoad;
        if (currentLoad.activeOrders >= (master.work.capacity.maxActiveOrders || 3)) {
            return { available: false, reason: 'master_busy' };
        }

        // Проверка расписания
        const dayOfWeek = dateTime.getDay();
        const timeStr = dateTime.toTimeString().slice(0, 5);

        const schedule = master.work.schedule.regular.find(s =>
            s.dayOfWeek === dayOfWeek && s.enabled
        );

        if (!schedule) {
            return { available: false, reason: 'not_working_today' };
        }

        const isInWorkingTime = schedule.periods.some(period => {
            return period.type === 'working' &&
                timeStr >= period.startTime &&
                timeStr <= period.endTime;
        });

        if (!isInWorkingTime) {
            return { available: false, reason: 'outside_working_hours' };
        }

        // Проверка отпусков
        const isOnVacation = master.work.schedule.vacations.some(vacation => {
            return vacation.approved &&
                dateTime >= vacation.startDate &&
                dateTime <= vacation.endDate;
        });

        if (isOnVacation) {
            return { available: false, reason: 'on_vacation' };
        }

        // Проверка слотов времени
        const busySlot = currentLoad.busySlots.find(slot => {
            return dateTime >= slot.startTime && dateTime <= slot.endTime;
        });

        if (busySlot) {
            return {
                available: false,
                reason: 'time_slot_busy',
                busyUntil: busySlot.endTime
            };
        }

        return { available: true };
    }

    // Назначение заказа мастеру
    async assignOrder(masterId, orderData) {
        const {
            orderId,
            estimatedDuration,
            scheduledTime
        } = orderData;

        const busySlot = {
            startTime: scheduledTime || new Date(),
            endTime: new Date((scheduledTime || new Date()).getTime() + estimatedDuration * 60000),
            orderId
        };

        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.activeOrder': {
                        orderId,
                        status: 'assigned',
                        startedAt: new Date(),
                        customer: orderData.customer
                    },
                    onlineStatus: ONLINE_STATUS.BUSY,
                    updatedAt: new Date()
                },
                $inc: {
                    'work.capacity.currentLoad.activeOrders': 1,
                    'work.capacity.currentLoad.todayOrders': 1
                },
                $push: {
                    'work.capacity.currentLoad.busySlots': busySlot
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Завершение заказа
    async completeOrder(masterId, orderId) {
        return await this.collection.findOneAndUpdate(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    'currentState.activeOrder': null,
                    onlineStatus: ONLINE_STATUS.ONLINE,
                    updatedAt: new Date()
                },
                $inc: {
                    'work.capacity.currentLoad.activeOrders': -1,
                    'currentState.shift.summary.ordersCompleted': 1
                },
                $pull: {
                    'work.capacity.currentLoad.busySlots': { orderId }
                }
            },
            { returnDocument: 'after' }
        );
    }

    // Мягкое удаление
    async softDelete(masterId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(masterId) },
            {
                $set: {
                    status: MASTER_STATUS.DELETED,
                    onlineStatus: ONLINE_STATUS.OFFLINE,
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}

// Экспортируем
module.exports = {
    MasterModel,
    MASTER_STATUS,
    MASTER_TYPES,
    SKILL_LEVELS,
    ONLINE_STATUS,
    masterSchema
};