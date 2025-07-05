// src/utils/constants/user-roles.js

'use strict';

// Основные роли пользователей
const USER_ROLES = {
    CLIENT: 'client',                   // Обычный клиент
    MASTER: 'master',                   // Мастер/исполнитель
    STO_OWNER: 'sto_owner',            // Владелец СТО
    STO_EMPLOYEE: 'sto_employee',       // Сотрудник СТО
    ADMIN: 'admin',                     // Администратор
    SUPER_ADMIN: 'super_admin'          // Супер администратор
};

// Иерархия ролей (для проверки прав доступа)
const ROLE_HIERARCHY = {
    [USER_ROLES.SUPER_ADMIN]: 100,
    [USER_ROLES.ADMIN]: 90,
    [USER_ROLES.STO_OWNER]: 50,
    [USER_ROLES.STO_EMPLOYEE]: 40,
    [USER_ROLES.MASTER]: 30,
    [USER_ROLES.CLIENT]: 10
};

// Группы ролей для удобства
const ROLE_GROUPS = {
    // Администраторы системы
    SYSTEM_ADMINS: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN
    ],

    // Бизнес пользователи (СТО)
    BUSINESS_USERS: [
        USER_ROLES.STO_OWNER,
        USER_ROLES.STO_EMPLOYEE
    ],

    // Исполнители
    SERVICE_PROVIDERS: [
        USER_ROLES.MASTER,
        USER_ROLES.STO_EMPLOYEE
    ],

    // Все роли с доступом к CRM
    CRM_USERS: [
        USER_ROLES.STO_OWNER,
        USER_ROLES.STO_EMPLOYEE
    ],

    // Все роли с доступом к админке
    ADMIN_PANEL_USERS: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN
    ]
};

// Разрешенные переходы между ролями
const ROLE_TRANSITIONS = {
    [USER_ROLES.CLIENT]: [
        USER_ROLES.MASTER,           // Клиент может стать мастером
        USER_ROLES.STO_OWNER        // Клиент может открыть СТО
    ],

    [USER_ROLES.MASTER]: [
        USER_ROLES.STO_EMPLOYEE,    // Мастер может устроиться в СТО
        USER_ROLES.STO_OWNER        // Мастер может открыть свое СТО
    ],

    [USER_ROLES.STO_EMPLOYEE]: [
        USER_ROLES.MASTER,          // Может вернуться к самостоятельной работе
        USER_ROLES.STO_OWNER        // Может открыть свое СТО
    ],

    [USER_ROLES.STO_OWNER]: [],     // Владелец СТО не может менять роль

    [USER_ROLES.ADMIN]: [
        USER_ROLES.SUPER_ADMIN      // Только повышение
    ],

    [USER_ROLES.SUPER_ADMIN]: []    // Высшая роль
};

// Права доступа по ролям
const ROLE_PERMISSIONS = {
    [USER_ROLES.CLIENT]: [
        'orders.create',
        'orders.view.own',
        'orders.cancel.own',
        'profile.view.own',
        'profile.update.own',
        'vehicles.manage.own',
        'payments.create',
        'payments.view.own',
        'chat.use',
        'notifications.receive'
    ],

    [USER_ROLES.MASTER]: [
        // Наследует права клиента
        ...ROLE_PERMISSIONS[USER_ROLES.CLIENT],

        // Дополнительные права мастера
        'orders.view.assigned',
        'orders.accept',
        'orders.reject',
        'orders.start',
        'orders.complete',
        'location.update',
        'status.update',
        'wallet.view',
        'wallet.withdraw',
        'documents.upload',
        'schedule.manage',
        'zones.manage',
        'statistics.view.own'
    ],

    [USER_ROLES.STO_EMPLOYEE]: [
        // Базовые права клиента
        'profile.view.own',
        'profile.update.own',
        'chat.use',
        'notifications.receive',

        // Права сотрудника СТО
        'orders.view.sto',
        'orders.accept',
        'orders.reject',
        'orders.start',
        'orders.complete',
        'clients.view.sto',
        'schedule.view.sto',
        'reports.view.limited'
    ],

    [USER_ROLES.STO_OWNER]: [
        // Наследует права сотрудника
        ...ROLE_PERMISSIONS[USER_ROLES.STO_EMPLOYEE],

        // Дополнительные права владельца
        'sto.manage',
        'employees.manage',
        'orders.assign',
        'orders.reassign',
        'services.manage',
        'prices.manage',
        'finance.view.full',
        'finance.withdraw',
        'reports.view.full',
        'reports.export',
        'analytics.view.sto',
        'clients.manage.sto',
        'marketing.campaigns'
    ],

    [USER_ROLES.ADMIN]: [
        // Права администратора
        'users.view.all',
        'users.update.all',
        'users.block',
        'users.unblock',
        'orders.view.all',
        'orders.update.all',
        'payments.view.all',
        'payments.refund',
        'masters.verify',
        'masters.suspend',
        'sto.verify',
        'sto.suspend',
        'documents.verify',
        'support.tickets.manage',
        'content.manage',
        'reports.view.system',
        'analytics.view.system',
        'audit.view',
        'monitoring.view'
    ],

    [USER_ROLES.SUPER_ADMIN]: [
        // Все права админа
        ...ROLE_PERMISSIONS[USER_ROLES.ADMIN],

        // Дополнительные права супер-админа
        'system.config',
        'users.delete',
        'roles.manage',
        'permissions.manage',
        'api.keys.manage',
        'webhooks.manage',
        'database.export',
        'database.import',
        'system.maintenance',
        'audit.export',
        'logs.access',
        'monitoring.alerts',
        'financial.controls'
    ]
};

// Настройки по ролям
const ROLE_SETTINGS = {
    [USER_ROLES.CLIENT]: {
        maxDevices: 5,
        sessionDuration: 7 * 24 * 60 * 60 * 1000,      // 7 дней
        refreshTokenDuration: 30 * 24 * 60 * 60 * 1000, // 30 дней
        otpAttempts: 5,
        requiresVerification: false,
        canHaveMultipleRoles: false
    },

    [USER_ROLES.MASTER]: {
        maxDevices: 3,
        sessionDuration: 14 * 24 * 60 * 60 * 1000,     // 14 дней
        refreshTokenDuration: 60 * 24 * 60 * 60 * 1000, // 60 дней
        otpAttempts: 5,
        requiresVerification: true,                      // Требует проверки документов
        canHaveMultipleRoles: false,
        requiredDocuments: ['passport', 'license'],
        commissionRate: 0.15                             // 15% комиссия платформы
    },

    [USER_ROLES.STO_EMPLOYEE]: {
        maxDevices: 2,
        sessionDuration: 8 * 60 * 60 * 1000,            // 8 часов (рабочая смена)
        refreshTokenDuration: 30 * 24 * 60 * 60 * 1000, // 30 дней
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false
    },

    [USER_ROLES.STO_OWNER]: {
        maxDevices: 5,
        sessionDuration: 90 * 24 * 60 * 60 * 1000,      // 90 дней
        refreshTokenDuration: 180 * 24 * 60 * 60 * 1000, // 180 дней
        otpAttempts: 3,
        requiresVerification: true,                       // Требует проверки документов
        canHaveMultipleRoles: true,                      // Может быть и мастером
        requiredDocuments: ['passport', 'business_license', 'tax_certificate'],
        commissionRate: 0.10                              // 10% комиссия для СТО
    },

    [USER_ROLES.ADMIN]: {
        maxDevices: 3,
        sessionDuration: 8 * 60 * 60 * 1000,             // 8 часов
        refreshTokenDuration: 7 * 24 * 60 * 60 * 1000,   // 7 дней
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false,
        requires2FA: true                                 // Обязательная двухфакторная аутентификация
    },

    [USER_ROLES.SUPER_ADMIN]: {
        maxDevices: 2,
        sessionDuration: 4 * 60 * 60 * 1000,             // 4 часа
        refreshTokenDuration: 24 * 60 * 60 * 1000,       // 24 часа
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false,
        requires2FA: true,
        requiresIPWhitelist: true                         // Только с разрешенных IP
    }
};

// API endpoints доступные для ролей
const ROLE_API_ACCESS = {
    [USER_ROLES.CLIENT]: {
        prefix: '/client/v1',
        allowedPrefixes: ['/client/v1', '/v1/public']
    },

    [USER_ROLES.MASTER]: {
        prefix: '/pro/v1',
        allowedPrefixes: ['/pro/v1', '/client/v1', '/v1/public']
    },

    [USER_ROLES.STO_EMPLOYEE]: {
        prefix: '/crm/v1',
        allowedPrefixes: ['/crm/v1', '/v1/public']
    },

    [USER_ROLES.STO_OWNER]: {
        prefix: '/crm/v1',
        allowedPrefixes: ['/crm/v1', '/v1/public']
    },

    [USER_ROLES.ADMIN]: {
        prefix: '/arm/v1',
        allowedPrefixes: ['/arm/v1', '/crm/v1', '/pro/v1', '/client/v1', '/v1']
    },

    [USER_ROLES.SUPER_ADMIN]: {
        prefix: '/arm/v1',
        allowedPrefixes: ['*'] // Доступ ко всем endpoints
    }
};

// Вспомогательные функции

/**
 * Проверка, имеет ли роль определенное право
 */
function hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Проверка, может ли одна роль управлять другой
 */
function canManageRole(managerRole, targetRole) {
    const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
    return managerLevel > targetLevel;
}

/**
 * Проверка, может ли роль перейти в другую роль
 */
function canTransitionTo(fromRole, toRole) {
    const allowedTransitions = ROLE_TRANSITIONS[fromRole] || [];
    return allowedTransitions.includes(toRole);
}

/**
 * Получение всех прав для роли (включая наследованные)
 */
function getAllPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Проверка, является ли роль административной
 */
function isAdminRole(role) {
    return ROLE_GROUPS.SYSTEM_ADMINS.includes(role);
}

/**
 * Проверка, является ли роль бизнес-ролью (СТО)
 */
function isBusinessRole(role) {
    return ROLE_GROUPS.BUSINESS_USERS.includes(role);
}

/**
 * Проверка, может ли роль выполнять заказы
 */
function canExecuteOrders(role) {
    return ROLE_GROUPS.SERVICE_PROVIDERS.includes(role);
}

/**
 * Получение настроек для роли
 */
function getRoleSettings(role) {
    return ROLE_SETTINGS[role] || ROLE_SETTINGS[USER_ROLES.CLIENT];
}

/**
 * Валидация роли
 */
function isValidRole(role) {
    return Object.values(USER_ROLES).includes(role);
}

// Экспортируем
module.exports = {
    USER_ROLES,
    ROLE_HIERARCHY,
    ROLE_GROUPS,
    ROLE_TRANSITIONS,
    ROLE_PERMISSIONS,
    ROLE_SETTINGS,
    ROLE_API_ACCESS,

    // Функции
    hasPermission,
    canManageRole,
    canTransitionTo,
    getAllPermissions,
    isAdminRole,
    isBusinessRole,
    canExecuteOrders,
    getRoleSettings,
    isValidRole
};