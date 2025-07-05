

'use strict';


const USER_ROLES = {
    CLIENT: 'client',                   
    MASTER: 'master',                   
    STO_OWNER: 'sto_owner',            
    STO_EMPLOYEE: 'sto_employee',       
    ADMIN: 'admin',                     
    SUPER_ADMIN: 'super_admin'          
};


const ROLE_HIERARCHY = {
    [USER_ROLES.SUPER_ADMIN]: 100,
    [USER_ROLES.ADMIN]: 90,
    [USER_ROLES.STO_OWNER]: 50,
    [USER_ROLES.STO_EMPLOYEE]: 40,
    [USER_ROLES.MASTER]: 30,
    [USER_ROLES.CLIENT]: 10
};


const ROLE_GROUPS = {
    
    SYSTEM_ADMINS: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN
    ],

    
    BUSINESS_USERS: [
        USER_ROLES.STO_OWNER,
        USER_ROLES.STO_EMPLOYEE
    ],

    
    SERVICE_PROVIDERS: [
        USER_ROLES.MASTER,
        USER_ROLES.STO_EMPLOYEE
    ],

    
    CRM_USERS: [
        USER_ROLES.STO_OWNER,
        USER_ROLES.STO_EMPLOYEE
    ],

    
    ADMIN_PANEL_USERS: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN
    ]
};


const ROLE_TRANSITIONS = {
    [USER_ROLES.CLIENT]: [
        USER_ROLES.MASTER,           
        USER_ROLES.STO_OWNER        
    ],

    [USER_ROLES.MASTER]: [
        USER_ROLES.STO_EMPLOYEE,    
        USER_ROLES.STO_OWNER        
    ],

    [USER_ROLES.STO_EMPLOYEE]: [
        USER_ROLES.MASTER,          
        USER_ROLES.STO_OWNER        
    ],

    [USER_ROLES.STO_OWNER]: [],     

    [USER_ROLES.ADMIN]: [
        USER_ROLES.SUPER_ADMIN      
    ],

    [USER_ROLES.SUPER_ADMIN]: []    
};


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
        
        ...ROLE_PERMISSIONS[USER_ROLES.CLIENT],

        
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
        
        'profile.view.own',
        'profile.update.own',
        'chat.use',
        'notifications.receive',

        
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
        
        ...ROLE_PERMISSIONS[USER_ROLES.STO_EMPLOYEE],

        
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
        
        ...ROLE_PERMISSIONS[USER_ROLES.ADMIN],

        
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


const ROLE_SETTINGS = {
    [USER_ROLES.CLIENT]: {
        maxDevices: 5,
        sessionDuration: 7 * 24 * 60 * 60 * 1000,      
        refreshTokenDuration: 30 * 24 * 60 * 60 * 1000, 
        otpAttempts: 5,
        requiresVerification: false,
        canHaveMultipleRoles: false
    },

    [USER_ROLES.MASTER]: {
        maxDevices: 3,
        sessionDuration: 14 * 24 * 60 * 60 * 1000,     
        refreshTokenDuration: 60 * 24 * 60 * 60 * 1000, 
        otpAttempts: 5,
        requiresVerification: true,                      
        canHaveMultipleRoles: false,
        requiredDocuments: ['passport', 'license'],
        commissionRate: 0.15                             
    },

    [USER_ROLES.STO_EMPLOYEE]: {
        maxDevices: 2,
        sessionDuration: 8 * 60 * 60 * 1000,            
        refreshTokenDuration: 30 * 24 * 60 * 60 * 1000, 
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false
    },

    [USER_ROLES.STO_OWNER]: {
        maxDevices: 5,
        sessionDuration: 90 * 24 * 60 * 60 * 1000,      
        refreshTokenDuration: 180 * 24 * 60 * 60 * 1000, 
        otpAttempts: 3,
        requiresVerification: true,                       
        canHaveMultipleRoles: true,                      
        requiredDocuments: ['passport', 'business_license', 'tax_certificate'],
        commissionRate: 0.10                              
    },

    [USER_ROLES.ADMIN]: {
        maxDevices: 3,
        sessionDuration: 8 * 60 * 60 * 1000,             
        refreshTokenDuration: 7 * 24 * 60 * 60 * 1000,   
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false,
        requires2FA: true                                 
    },

    [USER_ROLES.SUPER_ADMIN]: {
        maxDevices: 2,
        sessionDuration: 4 * 60 * 60 * 1000,             
        refreshTokenDuration: 24 * 60 * 60 * 1000,       
        otpAttempts: 3,
        requiresVerification: false,
        canHaveMultipleRoles: false,
        requires2FA: true,
        requiresIPWhitelist: true                         
    }
};


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
        allowedPrefixes: ['*'] 
    }
};




function hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission) || permissions.includes('*');
}


function canManageRole(managerRole, targetRole) {
    const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
    return managerLevel > targetLevel;
}


function canTransitionTo(fromRole, toRole) {
    const allowedTransitions = ROLE_TRANSITIONS[fromRole] || [];
    return allowedTransitions.includes(toRole);
}


function getAllPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}


function isAdminRole(role) {
    return ROLE_GROUPS.SYSTEM_ADMINS.includes(role);
}


function isBusinessRole(role) {
    return ROLE_GROUPS.BUSINESS_USERS.includes(role);
}


function canExecuteOrders(role) {
    return ROLE_GROUPS.SERVICE_PROVIDERS.includes(role);
}


function getRoleSettings(role) {
    return ROLE_SETTINGS[role] || ROLE_SETTINGS[USER_ROLES.CLIENT];
}


function isValidRole(role) {
    return Object.values(USER_ROLES).includes(role);
}


module.exports = {
    USER_ROLES,
    ROLE_HIERARCHY,
    ROLE_GROUPS,
    ROLE_TRANSITIONS,
    ROLE_PERMISSIONS,
    ROLE_SETTINGS,
    ROLE_API_ACCESS,

    
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