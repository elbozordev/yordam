

'use strict';



module.exports = {
    
    general: {
        
        enabled: process.env.HOLIDAYS_ENABLED !== 'false',

        
        timezone: 'Asia/Tashkent',

        
        cacheTime: 86400, 

        
        updateInterval: 604800000 
    },

    
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

            
            impact: {
                surge: 2.0,
                masterAvailability: 0.5,
                demandMultiplier: 1.5,
                radiusExtension: 1.5,
                priceMultiplier: 2.0
            },

            
            peakWindows: [
                { start: '22:00', end: '02:00', dayOffset: -1 }, 
                { start: '10:00', end: '14:00', dayOffset: 0 }  
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
                { start: '17:00', end: '20:00', dayOffset: -1 }, 
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
                { start: '08:00', end: '20:00', dayOffset: 0 } 
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
                { start: '20:00', end: '23:00', dayOffset: 0 } 
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

    
    dynamic: {
        
        ramadan: {
            id: 'ramadan',
            name: {
                ru: 'Рамадан',
                uz: 'Ramazon',
                en: 'Ramadan'
            },
            type: 'religious',
            duration: 30, 

            
            baseImpact: {
                surge: 1.3,
                masterAvailability: 0.8,
                demandMultiplier: 1.2,
                radiusExtension: 1.1,
                priceMultiplier: 1.3
            },

            
            specialPeriods: {
                
                iftar: {
                    timeBeforeSunset: 30, 
                    duration: 120, 

                    impact: {
                        surge: 1.5,
                        demandMultiplier: 0.7, 
                        masterAvailability: 0.5
                    }
                },

                
                suhoor: {
                    timeBeforeSunrise: 90, 
                    duration: 60, 

                    impact: {
                        surge: 1.2,
                        demandMultiplier: 1.1,
                        masterAvailability: 0.7
                    }
                }
            }
        },

        
        eid_al_fitr: {
            id: 'eid_al_fitr',
            name: {
                ru: 'Ураза-байрам',
                uz: 'Ramazon hayit',
                en: 'Eid al-Fitr'
            },
            type: 'religious',
            nonWorking: true,
            duration: 3, 

            impact: {
                surge: 1.8,
                masterAvailability: 0.6,
                demandMultiplier: 1.5,
                radiusExtension: 1.3,
                priceMultiplier: 1.8
            },

            peakWindows: [
                { start: '08:00', end: '11:00', dayOffset: 0 }, 
                { start: '12:00', end: '20:00', dayOffset: 0 }  
            ]
        },

        
        eid_al_adha: {
            id: 'eid_al_adha',
            name: {
                ru: 'Курбан-байрам',
                uz: 'Qurbon hayit',
                en: 'Eid al-Adha'
            },
            type: 'religious',
            nonWorking: true,
            duration: 3, 

            impact: {
                surge: 1.8,
                masterAvailability: 0.6,
                demandMultiplier: 1.5,
                radiusExtension: 1.3,
                priceMultiplier: 1.8
            },

            peakWindows: [
                { start: '07:00', end: '10:00', dayOffset: 0 }, 
                { start: '11:00', end: '20:00', dayOffset: 0 }  
            ]
        }
    },

    
    specialEvents: {
        
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

        
        majorEvents: {
            
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

    
    calculationRules: {
        
        combination: {
            method: 'multiplicative', 

            
            maxValues: {
                surge: 3.0,
                priceMultiplier: 3.0,
                radiusExtension: 2.0
            }
        },

        
        priority: {
            official: 100,
            religious: 90,
            cultural: 80,
            special: 70
        },

        
        bufferPeriods: {
            
            preDays: {
                official: 0,    
                religious: 1,   
                major: 2        
            },

            
            postDays: {
                official: 0,
                religious: 0,
                major: 1
            }
        }
    },

    
    serviceOverrides: {
        
        emergency: {
            applyHolidayMultiplier: false,
            customMultiplier: 1.0
        },

        
        towing: {
            demandMultiplier: 1.5,
            surgeMultiplier: 1.2
        },

        
        consultation: {
            availabilityMultiplier: 0.3
        }
    },

    
    notifications: {
        enabled: true,

        
        advance: {
            clients: 86400000,    
            masters: 172800000    
        },

        
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

    
    integration: {
        
        surge: {
            autoApply: true,
            priorityOverRegular: true
        },

        
        matching: {
            extendSearchRadius: true,
            relaxTimeConstraints: true,
            prioritizeMastersOnline: true
        },

        
        analytics: {
            trackHolidayMetrics: true,
            compareWithRegularDays: true
        }
    },

    
    api: {
        
        lunarCalendar: {
            enabled: true,
            provider: 'local', 
            updateFrequency: 2592000000 
        },

        
        external: {
            enabled: false,
            sources: []
        }
    }
};