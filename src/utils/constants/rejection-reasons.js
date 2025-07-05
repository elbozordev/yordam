

'use strict';




const REJECTION_REASONS = {
    
    POOR_QUALITY: 'poor_quality',
    BLURRY_IMAGE: 'blurry_image',
    LOW_RESOLUTION: 'low_resolution',
    OVEREXPOSED: 'overexposed',
    UNDEREXPOSED: 'underexposed',
    PARTIAL_DOCUMENT: 'partial_document',
    GLARE_REFLECTION: 'glare_reflection',

    
    INVALID_DOCUMENT: 'invalid_document',
    EXPIRED: 'expired',
    NOT_YET_VALID: 'not_yet_valid',
    SUSPICIOUS_DOCUMENT: 'suspicious_document',
    FAKE_DOCUMENT: 'fake_document',
    DOCUMENT_TAMPERED: 'document_tampered',

    
    INCOMPLETE: 'incomplete',
    MISSING_PAGES: 'missing_pages',
    MISSING_STAMPS: 'missing_stamps',
    MISSING_SIGNATURE: 'missing_signature',
    MISSING_PHOTO: 'missing_photo',

    
    MISMATCH: 'mismatch',
    NAME_MISMATCH: 'name_mismatch',
    PHOTO_MISMATCH: 'photo_mismatch',
    DATE_MISMATCH: 'date_mismatch',
    NUMBER_MISMATCH: 'number_mismatch',

    
    WRONG_DOCUMENT_TYPE: 'wrong_document_type',
    UNSUPPORTED_FORMAT: 'unsupported_format',

    
    WRONG_CATEGORY: 'wrong_category',          
    NO_REQUIRED_CATEGORY: 'no_required_category',
    INVALID_LICENSE_TYPE: 'invalid_license_type',
    BUSINESS_INACTIVE: 'business_inactive',     
    TAX_DEBT: 'tax_debt',

    
    OTHER: 'other'
};


const REJECTION_CATEGORIES = {
    QUALITY: [
        REJECTION_REASONS.POOR_QUALITY,
        REJECTION_REASONS.BLURRY_IMAGE,
        REJECTION_REASONS.LOW_RESOLUTION,
        REJECTION_REASONS.OVEREXPOSED,
        REJECTION_REASONS.UNDEREXPOSED,
        REJECTION_REASONS.PARTIAL_DOCUMENT,
        REJECTION_REASONS.GLARE_REFLECTION
    ],

    VALIDITY: [
        REJECTION_REASONS.INVALID_DOCUMENT,
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.NOT_YET_VALID,
        REJECTION_REASONS.SUSPICIOUS_DOCUMENT,
        REJECTION_REASONS.FAKE_DOCUMENT,
        REJECTION_REASONS.DOCUMENT_TAMPERED
    ],

    COMPLETENESS: [
        REJECTION_REASONS.INCOMPLETE,
        REJECTION_REASONS.MISSING_PAGES,
        REJECTION_REASONS.MISSING_STAMPS,
        REJECTION_REASONS.MISSING_SIGNATURE,
        REJECTION_REASONS.MISSING_PHOTO
    ],

    MATCHING: [
        REJECTION_REASONS.MISMATCH,
        REJECTION_REASONS.NAME_MISMATCH,
        REJECTION_REASONS.PHOTO_MISMATCH,
        REJECTION_REASONS.DATE_MISMATCH,
        REJECTION_REASONS.NUMBER_MISMATCH
    ]
};


const REJECTION_DESCRIPTIONS = {
    
    poor_quality: {
        ru: 'Низкое качество изображения',
        uz: 'Rasm sifati past',
        en: 'Poor image quality'
    },
    blurry_image: {
        ru: 'Изображение размыто',
        uz: 'Rasm loyqa',
        en: 'Blurry image'
    },
    low_resolution: {
        ru: 'Слишком низкое разрешение',
        uz: 'Rasm o\'lchami juda kichik',
        en: 'Resolution too low'
    },
    overexposed: {
        ru: 'Изображение засвечено',
        uz: 'Rasm juda yorug\'',
        en: 'Image overexposed'
    },
    underexposed: {
        ru: 'Изображение слишком темное',
        uz: 'Rasm juda qorong\'i',
        en: 'Image underexposed'
    },
    partial_document: {
        ru: 'Документ виден не полностью',
        uz: 'Hujjat to\'liq ko\'rinmayapti',
        en: 'Document partially visible'
    },
    glare_reflection: {
        ru: 'Блики или отражения на документе',
        uz: 'Hujjatda yorug\'lik aksi bor',
        en: 'Glare or reflections on document'
    },

    
    invalid_document: {
        ru: 'Недействительный документ',
        uz: 'Hujjat haqiqiy emas',
        en: 'Invalid document'
    },
    expired: {
        ru: 'Срок действия документа истек',
        uz: 'Hujjat muddati tugagan',
        en: 'Document has expired'
    },
    not_yet_valid: {
        ru: 'Документ еще не вступил в силу',
        uz: 'Hujjat hali kuchga kirmagan',
        en: 'Document not yet valid'
    },
    suspicious_document: {
        ru: 'Документ вызывает подозрения',
        uz: 'Shubhali hujjat',
        en: 'Suspicious document'
    },
    fake_document: {
        ru: 'Поддельный документ',
        uz: 'Qalbaki hujjat',
        en: 'Fake document'
    },
    document_tampered: {
        ru: 'Документ был изменен',
        uz: 'Hujjat o\'zgartirilgan',
        en: 'Document has been tampered'
    },

    
    incomplete: {
        ru: 'Неполная информация',
        uz: 'To\'liqsiz ma\'lumot',
        en: 'Incomplete information'
    },
    missing_pages: {
        ru: 'Отсутствуют страницы документа',
        uz: 'Hujjat sahifalari yetishmayapti',
        en: 'Missing document pages'
    },
    missing_stamps: {
        ru: 'Отсутствуют необходимые печати',
        uz: 'Kerakli muhrlar yo\'q',
        en: 'Missing required stamps'
    },
    missing_signature: {
        ru: 'Отсутствует подпись',
        uz: 'Imzo yo\'q',
        en: 'Missing signature'
    },
    missing_photo: {
        ru: 'Отсутствует фотография',
        uz: 'Rasm yo\'q',
        en: 'Missing photo'
    },

    
    mismatch: {
        ru: 'Данные не совпадают',
        uz: 'Ma\'lumotlar mos kelmayapti',
        en: 'Data mismatch'
    },
    name_mismatch: {
        ru: 'ФИО не совпадает с профилем',
        uz: 'F.I.O profil bilan mos kelmayapti',
        en: 'Name doesn\'t match profile'
    },
    photo_mismatch: {
        ru: 'Фото не соответствует владельцу',
        uz: 'Rasm egasiga mos kelmayapti',
        en: 'Photo doesn\'t match owner'
    },
    date_mismatch: {
        ru: 'Даты не совпадают',
        uz: 'Sanalar mos kelmayapti',
        en: 'Dates don\'t match'
    },
    number_mismatch: {
        ru: 'Номер документа не совпадает',
        uz: 'Hujjat raqami mos kelmayapti',
        en: 'Document number doesn\'t match'
    },

    
    wrong_document_type: {
        ru: 'Неверный тип документа',
        uz: 'Noto\'g\'ri hujjat turi',
        en: 'Wrong document type'
    },
    unsupported_format: {
        ru: 'Неподдерживаемый формат документа',
        uz: 'Qo\'llab-quvvatlanmaydigan format',
        en: 'Unsupported document format'
    },

    
    wrong_category: {
        ru: 'Неверная категория прав',
        uz: 'Noto\'g\'ri huquq toifasi',
        en: 'Wrong license category'
    },
    no_required_category: {
        ru: 'Отсутствует необходимая категория',
        uz: 'Kerakli toifa yo\'q',
        en: 'Missing required category'
    },
    invalid_license_type: {
        ru: 'Неверный тип лицензии',
        uz: 'Noto\'g\'ri litsenziya turi',
        en: 'Invalid license type'
    },
    business_inactive: {
        ru: 'Бизнес неактивен',
        uz: 'Biznes faol emas',
        en: 'Business inactive'
    },
    tax_debt: {
        ru: 'Имеется налоговая задолженность',
        uz: 'Soliq qarzi mavjud',
        en: 'Tax debt exists'
    },

    other: {
        ru: 'Другая причина',
        uz: 'Boshqa sabab',
        en: 'Other reason'
    }
};


const REJECTION_RECOMMENDATIONS = {
    
    poor_quality: {
        ru: 'Сделайте новое фото в хорошем освещении',
        uz: 'Yaxshi yoritilgan joyda yangi rasm oling',
        en: 'Take a new photo in good lighting'
    },
    blurry_image: {
        ru: 'Держите камеру неподвижно и убедитесь в фокусировке',
        uz: 'Kamerani qimirlatmang va fokusga e\'tibor bering',
        en: 'Hold camera steady and ensure focus'
    },
    low_resolution: {
        ru: 'Используйте камеру с более высоким разрешением',
        uz: 'Yuqori sifatli kameradan foydalaning',
        en: 'Use a higher resolution camera'
    },
    overexposed: {
        ru: 'Избегайте прямого солнечного света или яркого освещения',
        uz: 'To\'g\'ridan-to\'g\'ri quyosh nuri yoki yorug\' nurdan saqlaning',
        en: 'Avoid direct sunlight or bright lighting'
    },
    underexposed: {
        ru: 'Сделайте фото в более освещенном месте',
        uz: 'Yorug\'roq joyda rasm oling',
        en: 'Take photo in a brighter location'
    },
    partial_document: {
        ru: 'Убедитесь, что весь документ помещается в кадр',
        uz: 'Hujjat to\'liq kadrga tushganiga ishonch hosil qiling',
        en: 'Ensure entire document fits in frame'
    },
    glare_reflection: {
        ru: 'Измените угол съемки, чтобы избежать бликов',
        uz: 'Yorug\'lik aksini oldini olish uchun burchakni o\'zgartiring',
        en: 'Change angle to avoid reflections'
    },

    
    expired: {
        ru: 'Обновите документ и загрузите новый',
        uz: 'Hujjatni yangilang va yangisini yuklang',
        en: 'Renew document and upload new one'
    },
    not_yet_valid: {
        ru: 'Дождитесь даты начала действия документа',
        uz: 'Hujjat kuchga kirish sanasini kuting',
        en: 'Wait for document validity date'
    },
    suspicious_document: {
        ru: 'Предоставьте оригинал документа для проверки',
        uz: 'Tekshirish uchun hujjat aslini taqdim eting',
        en: 'Provide original document for verification'
    },

    
    missing_pages: {
        ru: 'Загрузите все страницы документа',
        uz: 'Hujjatning barcha sahifalarini yuklang',
        en: 'Upload all document pages'
    },
    missing_stamps: {
        ru: 'Убедитесь в наличии всех необходимых печатей',
        uz: 'Barcha kerakli muhrlar borligiga ishonch hosil qiling',
        en: 'Ensure all required stamps are present'
    },
    missing_signature: {
        ru: 'Документ должен быть подписан',
        uz: 'Hujjat imzolangan bo\'lishi kerak',
        en: 'Document must be signed'
    },
    missing_photo: {
        ru: 'Загрузите документ с фотографией',
        uz: 'Rasmli hujjatni yuklang',
        en: 'Upload document with photo'
    },

    
    name_mismatch: {
        ru: 'Проверьте правильность ФИО в профиле',
        uz: 'Profildagi F.I.O to\'g\'riligini tekshiring',
        en: 'Check name correctness in profile'
    },
    photo_mismatch: {
        ru: 'Загрузите документ с вашей фотографией',
        uz: 'O\'z rasmingiz bilan hujjat yuklang',
        en: 'Upload document with your photo'
    },

    
    wrong_document_type: {
        ru: 'Загрузите документ требуемого типа',
        uz: 'Talab qilingan turdagi hujjatni yuklang',
        en: 'Upload required document type'
    },

    
    wrong_category: {
        ru: 'Необходима категория B для работы водителем',
        uz: 'Haydovchi bo\'lish uchun B toifasi kerak',
        en: 'Category B required for driver work'
    },
    business_inactive: {
        ru: 'Активируйте бизнес в налоговой службе',
        uz: 'Biznesni soliq xizmatida faollashtiring',
        en: 'Activate business in tax service'
    },

    
    other: {
        ru: 'Свяжитесь с поддержкой для уточнения',
        uz: 'Aniqlashtirish uchun qo\'llab-quvvatlash xizmatiga murojaat qiling',
        en: 'Contact support for clarification'
    }
};


const DOCUMENT_SPECIFIC_REASONS = {
    
    passport: [
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.PHOTO_MISMATCH,
        REJECTION_REASONS.NAME_MISMATCH,
        REJECTION_REASONS.MISSING_PAGES,
        REJECTION_REASONS.POOR_QUALITY
    ],

    
    driver_license: [
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.WRONG_CATEGORY,
        REJECTION_REASONS.NO_REQUIRED_CATEGORY,
        REJECTION_REASONS.PHOTO_MISMATCH,
        REJECTION_REASONS.POOR_QUALITY
    ],

    
    business_license: [
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.BUSINESS_INACTIVE,
        REJECTION_REASONS.INVALID_LICENSE_TYPE,
        REJECTION_REASONS.MISSING_STAMPS,
        REJECTION_REASONS.NAME_MISMATCH
    ],

    
    tax_certificate: [
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.TAX_DEBT,
        REJECTION_REASONS.BUSINESS_INACTIVE,
        REJECTION_REASONS.MISSING_STAMPS
    ],

    
    professional_license: [
        REJECTION_REASONS.EXPIRED,
        REJECTION_REASONS.INVALID_LICENSE_TYPE,
        REJECTION_REASONS.MISSING_STAMPS,
        REJECTION_REASONS.MISSING_SIGNATURE
    ]
};


const REJECTION_PRIORITY = {
    [REJECTION_REASONS.FAKE_DOCUMENT]: 1,
    [REJECTION_REASONS.DOCUMENT_TAMPERED]: 2,
    [REJECTION_REASONS.EXPIRED]: 3,
    [REJECTION_REASONS.INVALID_DOCUMENT]: 4,
    [REJECTION_REASONS.WRONG_DOCUMENT_TYPE]: 5,
    [REJECTION_REASONS.NAME_MISMATCH]: 6,
    [REJECTION_REASONS.PHOTO_MISMATCH]: 7,
    [REJECTION_REASONS.MISSING_PAGES]: 8,
    [REJECTION_REASONS.POOR_QUALITY]: 9,
    [REJECTION_REASONS.OTHER]: 10
};




function getRejectionDescription(reason, lang = 'ru') {
    const descriptions = REJECTION_DESCRIPTIONS[reason];
    if (!descriptions) return reason;

    return descriptions[lang] || descriptions.ru || reason;
}


function getRejectionRecommendation(reason, lang = 'ru') {
    const recommendations = REJECTION_RECOMMENDATIONS[reason];
    if (!recommendations) {
        return REJECTION_RECOMMENDATIONS.other[lang] || REJECTION_RECOMMENDATIONS.other.ru;
    }

    return recommendations[lang] || recommendations.ru || '';
}


function getRejectionInfo(reason, lang = 'ru') {
    return {
        code: reason,
        description: getRejectionDescription(reason, lang),
        recommendation: getRejectionRecommendation(reason, lang),
        priority: REJECTION_PRIORITY[reason] || 99
    };
}


function getReasonsForDocumentType(documentType) {
    const specificReasons = DOCUMENT_SPECIFIC_REASONS[documentType] || [];
    const commonReasons = Object.values(REJECTION_REASONS);

    
    return [...new Set([...specificReasons, ...commonReasons])];
}


function isCriticalRejection(reason) {
    const criticalReasons = [
        REJECTION_REASONS.FAKE_DOCUMENT,
        REJECTION_REASONS.DOCUMENT_TAMPERED,
        REJECTION_REASONS.SUSPICIOUS_DOCUMENT
    ];

    return criticalReasons.includes(reason);
}


function getRejectionCategory(reason) {
    for (const [category, reasons] of Object.entries(REJECTION_CATEGORIES)) {
        if (reasons.includes(reason)) {
            return category;
        }
    }
    return 'OTHER';
}


function formatRejectionResponse(reasons, lang = 'ru') {
    if (!Array.isArray(reasons)) {
        reasons = [reasons];
    }

    return reasons
        .map(reason => getRejectionInfo(reason, lang))
        .sort((a, b) => a.priority - b.priority);
}


function isValidRejectionReason(reason) {
    return Object.values(REJECTION_REASONS).includes(reason);
}


module.exports = {
    
    REJECTION_REASONS,
    REJECTION_CATEGORIES,
    REJECTION_DESCRIPTIONS,
    REJECTION_RECOMMENDATIONS,
    DOCUMENT_SPECIFIC_REASONS,
    REJECTION_PRIORITY,

    
    getRejectionDescription,
    getRejectionRecommendation,
    getRejectionInfo,
    getReasonsForDocumentType,
    isCriticalRejection,
    getRejectionCategory,
    formatRejectionResponse,
    isValidRejectionReason
};