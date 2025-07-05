// config/discount.config.js

'use strict';

module.exports = {
    // Общие настройки системы скидок
    general: {
        // Разрешить применение нескольких скидок к одному заказу
        allowMultipleDiscounts: false,

        // Максимальная суммарная скидка на заказ (в процентах)
        maxTotalDiscountPercent: 50,

        // Минимальная сумма заказа для применения скидок
        minOrderAmount: 10000, // 10,000 сум

        // Время кэширования скидок в Redis (секунды)
        cacheTime: 300, // 5 минут

        // Включить логирование всех применений скидок
        enableUsageLogging: true
    },

    // Настройки по типам скидок
    types: {
        // Процентные скидки
        percentage: {
            min: 1,        // Минимум 1%
            max: 50,       // Максимум 50%
            allowDecimal: true
        },

        // Фиксированные скидки
        fixedAmount: {
            min: 1000,     // Минимум 1,000 сум
            max: 100000,   // Максимум 100,000 сум
            // Максимальный процент от суммы заказа
            maxPercentOfOrder: 30
        },

        // Скидка на первый заказ
        firstOrder: {
            defaultPercent: 10,
            maxPercent: 20,
            // Время жизни после регистрации (дни)
            validityDays: 30
        },

        // Промокоды
        promocode: {
            minLength: 4,
            maxLength: 20,
            // Разрешенные символы
            allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            // Автогенерация
            autoGenerate: {
                prefix: 'ROAD',
                length: 8
            }
        },

        // Программа лояльности
        loyalty: {
            // Уровни и скидки
            levels: {
                bronze: { ordersCount: 5, discount: 3 },
                silver: { ordersCount: 15, discount: 5 },
                gold: { ordersCount: 30, discount: 7 },
                platinum: { ordersCount: 50, discount: 10 }
            }
        },

        // Реферальные скидки
        referral: {
            // Скидка для приглашающего
            referrerDiscount: 5,
            // Скидка для приглашенного
            refereeDiscount: 10,
            // Максимум рефералов на пользователя
            maxReferralsPerUser: 10
        },

        // Объемные скидки
        volume: {
            // Пороги и скидки
            thresholds: [
                { minAmount: 50000, discount: 3 },
                { minAmount: 100000, discount: 5 },
                { minAmount: 200000, discount: 7 },
                { minAmount: 500000, discount: 10 }
            ]
        }
    },

    // Ограничения использования
    usage: {
        // Максимум использований одной скидки на пользователя
        maxUsagesPerUser: 1,

        // Максимум использований скидки всего
        defaultMaxUsages: 1000,

        // Минимальный интервал между использованиями (минуты)
        minUsageInterval: 0,

        // Блокировать скидку при подозрительной активности
        blockOnSuspiciousActivity: true,

        // Порог подозрительной активности (попыток за час)
        suspiciousThreshold: 10
    },

    // Временные ограничения
    validity: {
        // Максимальный срок действия скидки (дни)
        maxValidityDays: 365,

        // Срок действия по умолчанию (дни)
        defaultValidityDays: 30,

        // Разрешить скидки без срока действия
        allowPermanent: false,

        // Часовой пояс для расчета времени
        timezone: 'Asia/Tashkent'
    },

    // Правила комбинирования
    combination: {
        // Приоритет применения (по убыванию)
        priority: [
            'COMPENSATION',
            'FIRST_ORDER',
            'CORPORATE',
            'LOYALTY',
            'PROMOCODE',
            'SEASONAL',
            'STO_DISCOUNT',
            'VOLUME',
            'REFERRAL',
            'SERVICE_SPECIFIC'
        ],

        // Запрещенные комбинации
        blacklist: [
            ['FIRST_ORDER', 'LOYALTY'],
            ['COMPENSATION', 'PROMOCODE']
        ]
    },

    // Настройки уведомлений
    notifications: {
        // Уведомлять о новых скидках
        notifyOnNew: true,

        // Уведомлять за N дней до истечения
        notifyBeforeExpiry: [7, 3, 1],

        // Уведомлять об использовании
        notifyOnUsage: true
    },

    // Настройки для СТО
    sto: {
        // Разрешить СТО создавать свои скидки
        allowCustomDiscounts: true,

        // Максимальная скидка от СТО
        maxDiscountPercent: 30,

        // СТО оплачивает скидку сам
        stoPaysFull: false,

        // Распределение оплаты скидки (%)
        paymentSplit: {
            platform: 30,  // Платформа оплачивает 30%
            sto: 70        // СТО оплачивает 70%
        }
    },

    // Валидация
    validation: {
        // Проверять баланс кошелька для фиксированных скидок
        checkWalletBalance: true,

        // Проверять историю заказов для loyalty
        checkOrderHistory: true,

        // Строгая проверка условий
        strictMode: true
    }
};