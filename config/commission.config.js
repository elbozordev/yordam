// config/commission.config.js

'use strict';

module.exports = {
    // Базовые ставки комиссии платформы (в процентах)
    rates: {
        // Стандартные ставки по типу исполнителя
        master: {
            individual: 20,      // Физлицо мастер - 20%
            entrepreneur: 18,    // ИП мастер - 18%
            employee: 15         // Сотрудник СТО - 15%
        },

        // Ставки для СТО (организаций)
        sto: {
            standard: 15,        // Стандартная СТО - 15%
            premium: 12,         // Премиум партнер - 12%
            exclusive: 10        // Эксклюзивный партнер - 10%
        },

        // Минимальная и максимальная комиссия
        limits: {
            min: 5,              // Минимум 5%
            max: 30              // Максимум 30%
        }
    },

    // Фиксированные суммы комиссии (в сумах)
    fixed: {
        // Минимальная комиссия с заказа
        minAmount: 5000,         // Минимум 5,000 сум с заказа

        // Максимальная комиссия с заказа
        maxAmount: 500000,       // Максимум 500,000 сум с заказа

        // Сервисный сбор для клиента (добавляется к стоимости)
        serviceFee: 3000         // 3,000 сум фиксированный сбор
    },

    // Правила по типам услуг
    serviceRules: {
        // Категории услуг с особыми ставками
        emergency: {
            rate: 25,            // Экстренные услуги - 25%
            services: ['evacuator', 'emergency_repair']
        },

        standard: {
            rate: 20,            // Стандартные услуги - 20%
            services: ['tire_service', 'battery_charge', 'fuel_delivery']
        },

        consultation: {
            rate: 15,            // Консультации - 15%
            services: ['consultation', 'euro_protocol', 'insurance_help']
        },

        diagnostic: {
            rate: 18,            // Диагностика - 18%
            services: ['computer_diagnostic', 'electrician']
        }
    },

    // Surge pricing (повышенный спрос)
    surge: {
        enabled: true,

        // Множители комиссии при высоком спросе
        multipliers: {
            low: 1.0,            // Обычный спрос
            medium: 1.2,         // Средний спрос +20%
            high: 1.5,           // Высокий спрос +50%
            extreme: 2.0         // Критический спрос +100%
        },

        // Время действия surge (часы)
        peakHours: {
            morning: { start: 7, end: 10 },      // Утренний час пик
            evening: { start: 17, end: 20 },     // Вечерний час пик
            night: { start: 22, end: 6 }         // Ночное время
        },

        // Погодные условия
        weatherMultiplier: {
            rain: 1.3,           // Дождь +30%
            snow: 1.5,           // Снег +50%
            storm: 2.0           // Шторм +100%
        }
    },

    // Бонусы и скидки
    incentives: {
        // Скидка за объем для мастеров
        volumeDiscount: {
            enabled: true,
            tiers: [
                { orders: 50, discount: 2 },      // 50+ заказов = -2%
                { orders: 100, discount: 3 },     // 100+ заказов = -3%
                { orders: 200, discount: 5 }      // 200+ заказов = -5%
            ]
        },

        // Скидка для новых мастеров (первый месяц)
        newMasterDiscount: {
            enabled: true,
            rate: 10,            // -10% на первый месяц
            durationDays: 30
        },

        // Штрафы
        penalties: {
            cancellation: {
                rate: 5,         // +5% за высокий процент отмен
                threshold: 15    // Если отмен больше 15%
            },

            lowRating: {
                rate: 3,         // +3% за низкий рейтинг
                threshold: 4.0   // Если рейтинг ниже 4.0
            }
        }
    },

    // Специальные правила
    special: {
        // Корпоративные клиенты
        corporate: {
            rate: 10,            // 10% для B2B
            minOrders: 20        // Минимум 20 заказов в месяц
        },

        // Промо периоды
        promo: {
            enabled: false,
            rate: 15,            // Промо ставка 15%
            startDate: null,
            endDate: null
        },

        // Первый заказ
        firstOrder: {
            masterRate: 10,      // 10% с мастера на первом заказе
            clientFee: 0         // 0 сум сервисный сбор для клиента
        }
    },

    // Настройки расчета
    calculation: {
        // Округление
        rounding: {
            enabled: true,
            precision: 1000      // Округлять до 1000 сум
        },

        // Включать НДС
        vat: {
            enabled: true,
            rate: 12             // НДС 12%
        },

        // Валюта
        currency: 'UZS',

        // Периодичность выплат мастерам
        settlementPeriod: 'daily' // daily, weekly, monthly
    },

    // Лимиты транзакций
    transactionLimits: {
        // Минимальная сумма для вывода
        minWithdrawal: 50000,    // 50,000 сум

        // Максимальная сумма за транзакцию
        maxTransaction: 10000000, // 10,000,000 сум

        // Лимит транзакций в день
        dailyLimit: 50000000     // 50,000,000 сум
    },

    // Время удержания средств (в часах)
    holdPeriod: {
        standard: 24,            // 24 часа стандарт
        newMaster: 72,           // 72 часа для новых мастеров
        disputed: 168            // 7 дней при спорах
    }
};