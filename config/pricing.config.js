// config/pricing.config.js

'use strict';

const { SERVICE_TYPES } = require('../src/utils/constants/service-types');

module.exports = {
    // Основные настройки ценообразования
    general: {
        // Валюта
        currency: 'UZS',
        currencySymbol: 'сум',

        // НДС
        vat: {
            enabled: true,
            rate: 0.12,                      // 12%
            included: true                   // Включен в цену
        },

        // Округление
        rounding: {
            enabled: true,
            precision: 1000,                 // Округлять до 1000 сум
            method: 'ceil'                   // ceil, floor, round
        },

        // Обновление цен
        priceUpdateInterval: 86400000,       // 24 часа - обновление базовых цен
        cacheTime: 3600,                     // 1 час - кэш расчетов в Redis

        // Формат отображения
        displayFormat: {
            showCurrency: true,
            thousandSeparator: ' ',
            decimalSeparator: ',',
            decimals: 0
        }
    },

    // Базовые цены услуг (в сумах)
    basePrices: {
        // Экстренные услуги
        [SERVICE_TYPES.TOWING]: {
            base: 150000,                    // Базовая цена
            minimum: 100000,                 // Минимум
            maximum: 1000000,                // Максимум

            // Дополнительные тарифы
            perKm: 5000,                     // За километр
            perHour: 0,                      // За час (включено в базу)

            // Опции
            options: {
                partial_loading: 50000,      // Частичная погрузка
                full_loading: 0,             // Полная погрузка (включено)
                special_equipment: 100000    // Спецоборудование
            }
        },

        [SERVICE_TYPES.ELECTRICIAN]: {
            base: 100000,
            minimum: 70000,
            maximum: 500000,
            perHour: 50000,                  // Почасовая после первого часа

            // Минимальная длительность
            minimumDuration: 45              // Минут
        },

        [SERVICE_TYPES.MECHANIC]: {
            base: 120000,
            minimum: 80000,
            maximum: 600000,
            perHour: 60000,
            minimumDuration: 60
        },

        [SERVICE_TYPES.TIRE_SERVICE]: {
            base: 50000,
            minimum: 30000,
            maximum: 200000,

            options: {
                spare_tire_install: 0,
                tire_repair: 30000,
                new_tire: -1,                // Цена по факту
                balancing: 20000
            }
        },

        [SERVICE_TYPES.LOCKSMITH]: {
            base: 80000,
            minimum: 60000,
            maximum: 300000,

            // Сложность замка
            complexity: {
                simple: 1.0,                 // Обычный замок
                medium: 1.5,                 // Средняя сложность
                complex: 2.0                 // Сложный/электронный
            }
        },

        [SERVICE_TYPES.FUEL_DELIVERY]: {
            base: 40000,                     // Базовая доставка
            minimum: 40000,
            maximum: 200000,

            // Топливо
            fuel: {
                price_per_liter: 15000,      // Наценка за литр
                minimum_liters: 10,
                maximum_liters: 50
            }
        },

        [SERVICE_TYPES.BATTERY_CHARGE]: {
            base: 60000,
            minimum: 40000,
            maximum: 250000,

            options: {
                jump_start: 0,               // Прикурить (включено)
                new_battery: -1,             // Новая батарея по факту
                battery_test: 20000          // Диагностика
            }
        },

        [SERVICE_TYPES.EURO_PROTOCOL]: {
            base: 100000,
            minimum: 80000,
            maximum: 200000,

            // Фиксированная цена
            fixedPrice: true
        },

        [SERVICE_TYPES.CONSULTATION]: {
            base: 50000,
            minimum: 30000,
            maximum: 150000,

            // По типу консультации
            types: {
                phone: 0.5,                  // 50% от базы
                video: 0.8,                  // 80% от базы
                onsite: 1.5                  // 150% от базы
            }
        },

        [SERVICE_TYPES.DIAGNOSTICS]: {
            base: 80000,
            minimum: 60000,
            maximum: 300000,
            perHour: 40000,

            // Тип диагностики
            types: {
                basic: 1.0,
                computer: 1.5,
                complex: 2.0
            }
        }
    },

    // Временные модификаторы цен
    timeModifiers: {
        // Ночная наценка
        night: {
            enabled: true,
            periods: [
                { start: 22, end: 6 }        // 22:00 - 06:00
            ],

            // Множители по услугам
            multipliers: {
                [SERVICE_TYPES.TOWING]: 1.5,
                [SERVICE_TYPES.ELECTRICIAN]: 1.3,
                [SERVICE_TYPES.MECHANIC]: 1.3,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.5,
                [SERVICE_TYPES.LOCKSMITH]: 1.5,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.3,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.4,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.2,
                [SERVICE_TYPES.CONSULTATION]: 1.0,    // Без наценки
                [SERVICE_TYPES.DIAGNOSTICS]: 1.2,

                default: 1.3                          // По умолчанию
            }
        },

        // Выходные
        weekend: {
            enabled: true,
            days: [0, 6],                    // Воскресенье, суббота

            multipliers: {
                [SERVICE_TYPES.TOWING]: 1.2,
                [SERVICE_TYPES.ELECTRICIAN]: 1.15,
                [SERVICE_TYPES.MECHANIC]: 1.2,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.2,
                [SERVICE_TYPES.LOCKSMITH]: 1.3,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.1,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.2,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.1,
                [SERVICE_TYPES.CONSULTATION]: 1.0,
                [SERVICE_TYPES.DIAGNOSTICS]: 1.1,

                default: 1.15
            }
        },

        // Праздники
        holiday: {
            enabled: true,

            multipliers: {
                [SERVICE_TYPES.TOWING]: 2.0,
                [SERVICE_TYPES.ELECTRICIAN]: 1.5,
                [SERVICE_TYPES.MECHANIC]: 1.5,
                [SERVICE_TYPES.TIRE_SERVICE]: 1.8,
                [SERVICE_TYPES.LOCKSMITH]: 2.0,
                [SERVICE_TYPES.FUEL_DELIVERY]: 1.5,
                [SERVICE_TYPES.BATTERY_CHARGE]: 1.5,
                [SERVICE_TYPES.EURO_PROTOCOL]: 1.3,
                [SERVICE_TYPES.CONSULTATION]: 1.0,
                [SERVICE_TYPES.DIAGNOSTICS]: 1.3,

                default: 1.5
            }
        },

        // Часы пик
        peakHours: {
            enabled: true,
            periods: [
                { start: 7, end: 10, multiplier: 1.2 },   // Утро
                { start: 17, end: 20, multiplier: 1.3 }   // Вечер
            ]
        }
    },

    // Дистанционные модификаторы
    distanceModifiers: {
        // Зоны по расстоянию
        zones: [
            { from: 0, to: 5, multiplier: 1.0 },          // 0-5 км
            { from: 5, to: 10, multiplier: 1.1 },         // 5-10 км
            { from: 10, to: 20, multiplier: 1.2 },        // 10-20 км
            { from: 20, to: 30, multiplier: 1.3 },        // 20-30 км
            { from: 30, to: null, multiplier: 1.5 }       // 30+ км
        ],

        // За пределами города
        outsideCity: {
            enabled: true,
            multiplier: 1.5,
            additionalPerKm: 2000
        }
    },

    // Интеграция с surge pricing
    surge: {
        enabled: true,

        // Чувствительность услуг к surge (0-1)
        sensitivity: {
            [SERVICE_TYPES.TOWING]: 0.8,
            [SERVICE_TYPES.ELECTRICIAN]: 0.6,
            [SERVICE_TYPES.MECHANIC]: 0.5,
            [SERVICE_TYPES.TIRE_SERVICE]: 0.4,
            [SERVICE_TYPES.LOCKSMITH]: 0.7,
            [SERVICE_TYPES.FUEL_DELIVERY]: 0.5,
            [SERVICE_TYPES.BATTERY_CHARGE]: 0.6,
            [SERVICE_TYPES.EURO_PROTOCOL]: 0.3,
            [SERVICE_TYPES.CONSULTATION]: 0.1,
            [SERVICE_TYPES.DIAGNOSTICS]: 0.3,

            default: 0.5
        },

        // Максимальные surge множители
        maxMultipliers: {
            [SERVICE_TYPES.TOWING]: 3.0,
            [SERVICE_TYPES.ELECTRICIAN]: 2.5,
            [SERVICE_TYPES.MECHANIC]: 2.0,
            [SERVICE_TYPES.TIRE_SERVICE]: 2.0,
            [SERVICE_TYPES.LOCKSMITH]: 2.5,
            [SERVICE_TYPES.FUEL_DELIVERY]: 2.5,
            [SERVICE_TYPES.BATTERY_CHARGE]: 2.0,
            [SERVICE_TYPES.EURO_PROTOCOL]: 1.5,
            [SERVICE_TYPES.CONSULTATION]: 1.0,     // Без surge
            [SERVICE_TYPES.DIAGNOSTICS]: 1.5,

            default: 2.0
        }
    },

    // Интеграция с комиссиями
    commission: {
        // Кто платит комиссию
        paidBy: {
            platform: 'master',              // master, client, split

            // Исключения
            exceptions: {
                firstOrder: 'platform',      // Первый заказ - платформа
                emergency: 'split'           // Экстренные - пополам
            }
        },

        // Включать в отображаемую цену
        includeInDisplayPrice: false,

        // Прозрачность для клиента
        transparency: {
            showCommission: false,           // Показывать комиссию
            showBreakdown: true             // Показывать разбивку цены
        }
    },

    // Интеграция со скидками
    discounts: {
        // Максимальная суммарная скидка
        maxTotalDiscount: 0.5,              // 50%

        // Приоритет применения
        priority: [
            'COMPENSATION',
            'FIRST_ORDER',
            'CORPORATE',
            'LOYALTY',
            'PROMOCODE',
            'SEASONAL',
            'VOLUME'
        ],

        // Применять к базовой цене или итоговой
        applyTo: 'base',                    // base, total

        // Stackable скидки
        allowStacking: false
    },

    // Методы расчета цены
    calculationMethods: {
        // По умолчанию
        default: 'standard',

        // Доступные методы
        methods: {
            standard: {
                // База + модификаторы + surge + скидки
                formula: 'base * timeModifier * distanceModifier * surge - discount'
            },

            fixed: {
                // Фиксированная цена
                formula: 'base'
            },

            hourly: {
                // Почасовая
                formula: '(base + (hours - 1) * perHour) * modifiers'
            },

            distance: {
                // По расстоянию
                formula: 'base + (distance * perKm) * modifiers'
            },

            custom: {
                // Индивидуальный расчет
                formula: 'custom'
            }
        }
    },

    // Правила и ограничения
    rules: {
        // Минимальная сумма заказа
        minOrderAmount: 20000,

        // Максимальная сумма заказа
        maxOrderAmount: 10000000,

        // Максимальная дистанция
        maxDistance: 100,                    // км

        // Максимальная длительность
        maxDuration: 480,                    // 8 часов

        // Требуется предоплата
        prepayment: {
            required: false,

            // По услугам
            services: {
                [SERVICE_TYPES.TOWING]: {
                    required: true,
                    percent: 0.5             // 50%
                }
            },

            // По сумме
            amounts: [
                { from: 500000, percent: 0.3 },
                { from: 1000000, percent: 0.5 }
            ]
        }
    },

    // Отображение цен
    display: {
        // Показывать диапазон
        showRange: true,

        // Формат диапазона
        rangeFormat: '{min} - {max} {currency}',

        // Показывать "от"
        showFrom: true,
        fromFormat: 'от {min} {currency}',

        // Показывать примерную цену
        showEstimate: true,
        estimateFormat: '≈ {price} {currency}',

        // Показывать surge
        showSurge: true,
        surgeFormat: 'x{multiplier}',

        // Цветовая индикация surge
        surgeColors: {
            none: '#4CAF50',
            low: '#FFC107',
            medium: '#FF9800',
            high: '#FF5722',
            critical: '#F44336'
        }
    },

    // Аналитика ценообразования
    analytics: {
        // Отслеживать метрики
        trackMetrics: true,

        // Метрики
        metrics: [
            'average_price',
            'surge_frequency',
            'discount_usage',
            'price_elasticity',
            'conversion_by_price'
        ],

        // Интервал сбора
        collectionInterval: 300000,          // 5 минут

        // Хранение истории
        historyRetention: 2592000            // 30 дней
    },

    // Экспериментальные функции
    experimental: {
        // Динамическое ценообразование на основе ML
        mlPricing: {
            enabled: false,
            model: 'price_optimizer_v1',
            features: [
                'time_of_day',
                'day_of_week',
                'weather',
                'demand_supply_ratio',
                'competitor_prices'
            ]
        },

        // A/B тестирование цен
        abTesting: {
            enabled: false,
            experiments: []
        }
    }
};