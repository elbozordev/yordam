// config/holidays.config.js

'use strict';

/**
 * Конфигурация праздничных дней для Yordam24
 * Управляет праздниками Узбекистана и их влиянием на систему
 */

module.exports = {
    // Основные настройки
    general: {
        // Включение праздничных коэффициентов
        enabled: process.env.HOLIDAYS_ENABLED !== 'false',

        // Часовой пояс для расчета праздников
        timezone: 'Asia/Tashkent',

        // Кэширование праздников (секунды)
        cacheTime: 86400, // 24 часа

        // Обновление динамических праздников
        updateInterval: 604800000 // 7 дней
    },

    // Фиксированные государственные праздники Узбекистана
    fixed: [
        {
            id: 'new_year',
            date: '01-01',
            name: {
                ru: 'Новый год',
                uz: 'Yangi yil',
                en: 'New Year'
            },
            type: 'official',
            nonWorking: true,

            // Влияние на систему
            impact: {
                surge: 2.0,
                masterAvailability: 0.5,
                demandMultiplier: 1.5,
                radiusExtension: 1.5,
                priceMultiplier: 2.0
            },

            // Временные окна с повышенной активностью
            peakWindows: [
                { start: '22:00', end: '02:00', dayOffset: -1 }, // Канун
                { start: '10:00', end: '14:00', dayOffset: 0 }  // День
            ]
        },

        {
            id: 'defenders_day',
            date: '01-14',
            name: {
                ru: 'День защитников Родины',
                uz: 'Vatan himoyachilari kuni',
                en: 'Defenders of the Homeland Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.3,
                masterAvailability: 0.7,
                demandMultiplier: 1.2,
                radiusExtension: 1.1,
                priceMultiplier: 1.3
            }
        },

        {
            id: 'womens_day',
            date: '03-08',
            name: {
                ru: 'Международный женский день',
                uz: 'Xalqaro xotin-qizlar kuni',
                en: 'International Women\'s Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.5,
                masterAvailability: 0.7,
                demandMultiplier: 1.3,
                radiusExtension: 1.2,
                priceMultiplier: 1.5
            },

            peakWindows: [
                { start: '17:00', end: '20:00', dayOffset: -1 }, // Канун
                { start: '10:00', end: '14:00', dayOffset: 0 }
            ]
        },

        {
            id: 'navruz',
            date: '03-21',
            name: {
                ru: 'Навруз',
                uz: 'Navro\'z bayrami',
                en: 'Navruz'
            },
            type: 'official',
            nonWorking: true,
            cultural: true,

            impact: {
                surge: 1.8,
                masterAvailability: 0.6,
                demandMultiplier: 1.4,
                radiusExtension: 1.3,
                priceMultiplier: 1.8
            },

            peakWindows: [
                { start: '08:00', end: '20:00', dayOffset: 0 } // Весь день
            ]
        },

        {
            id: 'labor_day',
            date: '05-01',
            name: {
                ru: 'День труда',
                uz: 'Mehnat bayrami',
                en: 'Labor Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.3,
                masterAvailability: 0.7,
                demandMultiplier: 1.1,
                radiusExtension: 1.1,
                priceMultiplier: 1.3
            }
        },

        {
            id: 'memory_day',
            date: '05-09',
            name: {
                ru: 'День памяти и почестей',
                uz: 'Xotira va qadrlash kuni',
                en: 'Day of Memory and Honors'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.3,
                masterAvailability: 0.8,
                demandMultiplier: 1.1,
                radiusExtension: 1.0,
                priceMultiplier: 1.3
            }
        },

        {
            id: 'independence_day',
            date: '09-01',
            name: {
                ru: 'День независимости',
                uz: 'Mustaqillik kuni',
                en: 'Independence Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.5,
                masterAvailability: 0.7,
                demandMultiplier: 1.3,
                radiusExtension: 1.2,
                priceMultiplier: 1.5
            },

            peakWindows: [
                { start: '20:00', end: '23:00', dayOffset: 0 } // Салют
            ]
        },

        {
            id: 'teachers_day',
            date: '10-01',
            name: {
                ru: 'День учителя и наставника',
                uz: 'O\'qituvchi va murabbiylar kuni',
                en: 'Teacher\'s Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.2,
                masterAvailability: 0.8,
                demandMultiplier: 1.1,
                radiusExtension: 1.0,
                priceMultiplier: 1.2
            }
        },

        {
            id: 'constitution_day',
            date: '12-08',
            name: {
                ru: 'День Конституции',
                uz: 'Konstitutsiya kuni',
                en: 'Constitution Day'
            },
            type: 'official',
            nonWorking: true,

            impact: {
                surge: 1.4,
                masterAvailability: 0.7,
                demandMultiplier: 1.2,
                radiusExtension: 1.1,
                priceMultiplier: 1.4
            }
        }
    ],

    // Динамические религиозные праздники
    dynamic: {
        // Рамадан
        ramadan: {
            id: 'ramadan',
            name: {
                ru: 'Рамадан',
                uz: 'Ramazon',
                en: 'Ramadan'
            },
            type: 'religious',
            duration: 30, // дней

            // Базовое влияние
            baseImpact: {
                surge: 1.3,
                masterAvailability: 0.8,
                demandMultiplier: 1.2,
                radiusExtension: 1.1,
                priceMultiplier: 1.3
            },

            // Особые периоды внутри Рамадана
            specialPeriods: {
                // Время ифтара (разговения)
                iftar: {
                    timeBeforeSunset: 30, // минут до заката
                    duration: 120, // минут

                    impact: {
                        surge: 1.5,
                        demandMultiplier: 0.7, // Меньше заказов во время ифтара
                        masterAvailability: 0.5
                    }
                },

                // Сухур (предрассветная трапеза)
                suhoor: {
                    timeBeforeSunrise: 90, // минут до рассвета
                    duration: 60, // минут

                    impact: {
                        surge: 1.2,
                        demandMultiplier: 1.1,
                        masterAvailability: 0.7
                    }
                }
            }
        },

        // Ураза-байрам
        eid_al_fitr: {
            id: 'eid_al_fitr',
            name: {
                ru: 'Ураза-байрам',
                uz: 'Ramazon hayit',
                en: 'Eid al-Fitr'
            },
            type: 'religious',
            nonWorking: true,
            duration: 3, // дней

            impact: {
                surge: 1.8,
                masterAvailability: 0.6,
                demandMultiplier: 1.5,
                radiusExtension: 1.3,
                priceMultiplier: 1.8
            },

            peakWindows: [
                { start: '08:00', end: '11:00', dayOffset: 0 }, // Праздничная молитва
                { start: '12:00', end: '20:00', dayOffset: 0 }  // Визиты к родственникам
            ]
        },

        // Курбан-байрам
        eid_al_adha: {
            id: 'eid_al_adha',
            name: {
                ru: 'Курбан-байрам',
                uz: 'Qurbon hayit',
                en: 'Eid al-Adha'
            },
            type: 'religious',
            nonWorking: true,
            duration: 3, // дней

            impact: {
                surge: 1.8,
                masterAvailability: 0.6,
                demandMultiplier: 1.5,
                radiusExtension: 1.3,
                priceMultiplier: 1.8
            },

            peakWindows: [
                { start: '07:00', end: '10:00', dayOffset: 0 }, // Праздничная молитва
                { start: '11:00', end: '20:00', dayOffset: 0 }  // Празднование
            ]
        }
    },

    // Специальные события и периоды
    specialEvents: {
        // Школьные каникулы
        schoolHolidays: {
            winter: {
                name: { ru: 'Зимние каникулы', uz: 'Qishki ta\'til', en: 'Winter holidays' },
                period: { start: '12-25', end: '01-10' },
                impact: {
                    surge: 1.1,
                    demandMultiplier: 0.9,
                    masterAvailability: 0.9
                }
            },

            spring: {
                name: { ru: 'Весенние каникулы', uz: 'Bahorgi ta\'til', en: 'Spring holidays' },
                period: { start: '03-21', end: '03-29' },
                impact: {
                    surge: 1.1,
                    demandMultiplier: 1.1,
                    masterAvailability: 0.9
                }
            },

            summer: {
                name: { ru: 'Летние каникулы', uz: 'Yozgi ta\'til', en: 'Summer holidays' },
                period: { start: '06-01', end: '08-31' },
                impact: {
                    surge: 1.0,
                    demandMultiplier: 0.8,
                    masterAvailability: 0.7
                }
            }
        },

        // Массовые мероприятия
        majorEvents: {
            // Можно добавлять динамически через API
            examples: [
                {
                    name: 'Международный музыкальный фестиваль',
                    date: '08-26',
                    duration: 3,
                    zones: ['city_center', 'registan'],
                    impact: {
                        surge: 1.5,
                        demandMultiplier: 1.3,
                        radiusExtension: 1.0
                    }
                }
            ]
        }
    },

    // Правила расчета влияния
    calculationRules: {
        // Комбинирование множителей
        combination: {
            method: 'multiplicative', // multiplicative | additive | max

            // Максимальные значения
            maxValues: {
                surge: 3.0,
                priceMultiplier: 3.0,
                radiusExtension: 2.0
            }
        },

        // Приоритеты при пересечении
        priority: {
            official: 100,
            religious: 90,
            cultural: 80,
            special: 70
        },

        // Буферные периоды
        bufferPeriods: {
            // За сколько дней начинать применять коэффициенты
            preDays: {
                official: 0,    // В день праздника
                religious: 1,   // За день до религиозных
                major: 2        // За 2 дня до крупных
            },

            // Сколько дней после праздника
            postDays: {
                official: 0,
                religious: 0,
                major: 1
            }
        }
    },

    // Настройки для разных типов услуг
    serviceOverrides: {
        // Экстренные услуги имеют особые правила
        emergency: {
            applyHolidayMultiplier: false,
            customMultiplier: 1.0
        },

        // Эвакуатор всегда востребован в праздники
        towing: {
            demandMultiplier: 1.5,
            surgeMultiplier: 1.2
        },

        // Консультации могут быть недоступны
        consultation: {
            availabilityMultiplier: 0.3
        }
    },

    // Уведомления о праздниках
    notifications: {
        enabled: true,

        // За сколько уведомлять
        advance: {
            clients: 86400000,    // 24 часа
            masters: 172800000    // 48 часов
        },

        // Шаблоны сообщений
        templates: {
            upcoming: {
                ru: 'Завтра праздник {holiday}. Ожидается повышенный спрос на услуги.',
                uz: 'Ertaga {holiday} bayrami. Xizmatlar uchun yuqori talab kutilmoqda.',
                en: 'Tomorrow is {holiday}. High demand for services expected.'
            },

            active: {
                ru: 'Сегодня {holiday}. Действуют праздничные тарифы.',
                uz: 'Bugun {holiday}. Bayram tariflari amal qiladi.',
                en: 'Today is {holiday}. Holiday rates apply.'
            }
        }
    },

    // Интеграция с другими системами
    integration: {
        // Синхронизация с surge pricing
        surge: {
            autoApply: true,
            priorityOverRegular: true
        },

        // Влияние на matching алгоритм
        matching: {
            extendSearchRadius: true,
            relaxTimeConstraints: true,
            prioritizeMastersOnline: true
        },

        // Аналитика
        analytics: {
            trackHolidayMetrics: true,
            compareWithRegularDays: true
        }
    },

    // API для динамических праздников
    api: {
        // Источник данных о лунном календаре
        lunarCalendar: {
            enabled: true,
            provider: 'local', // local | external
            updateFrequency: 2592000000 // 30 дней
        },

        // Внешние источники праздников
        external: {
            enabled: false,
            sources: []
        }
    }
};