// config.js - School configurations and class definitions

const SCHOOLS = {
    L1: {
        id: 'L1',
        name: 'École Primaire L1',
        levels: ['Primaire'],
        classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        address: '123 Rue de l\'École, Casablanca',
        phone: '0522XXXXXX'
    },
    L2: {
        id: 'L2',
        name: 'Collège L2',
        levels: ['Primaire', 'Collège'],
        classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        address: '456 Avenue des Écoles, Rabat',
        phone: '0537XXXXXX'
    },
    L3: {
        id: 'L3',
        name: 'Lycée L3',
        levels: ['Collège', 'Lycée'],
        classes: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'],
        address: '789 Boulevard de l\'Éducation, Tanger',
        phone: '0539XXXXXX'
    }
};

// Default admin users (in production, this should be in a database)
const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', school: null, name: 'Administrateur Général' },
    { username: 'l1_admin', password: 'l1pass', role: 'school_admin', school: 'L1', name: 'Admin L1' },
    { username: 'l2_admin', password: 'l2pass', role: 'school_admin', school: 'L2', name: 'Admin L2' },
    { username: 'l3_admin', password: 'l3pass', role: 'school_admin', school: 'L3', name: 'Admin L3' },
    { username: 'l1_teacher', password: 'teacher', role: 'teacher', school: 'L1', name: 'Professeur L1' },
    { username: 'l2_teacher', password: 'teacher', role: 'teacher', school: 'L2', name: 'Professeur L2' },
    { username: 'l3_teacher', password: 'teacher', role: 'teacher', school: 'L3', name: 'Professeur L3' }
];

// Role permissions
const ROLES = {
    admin: {
        canViewAllSchools: true,
        canManageUsers: true,
        canManageOrders: true,
        canManageStock: true,
        canManageStudents: true,
        canManageBooks: true,
        canManageClasses: true,
        canViewStats: true,
        canExport: true
    },
    school_admin: {
        canViewAllSchools: false,
        canManageUsers: false,
        canManageOrders: true,
        canManageStock: true,
        canManageStudents: true,
        canManageBooks: true,
        canManageClasses: true,
        canViewStats: true,
        canExport: true
    },
    teacher: {
        canViewAllSchools: false,
        canManageUsers: false,
        canManageOrders: false,
        canManageStock: false,
        canManageStudents: true,
        canManageBooks: false,
        canManageClasses: false,
        canViewStats: true,
        canExport: true
    }
};

// Get classes for a specific school
function getSchoolClasses(schoolId) {
    if (!schoolId || !SCHOOLS[schoolId]) return [];
    return SCHOOLS[schoolId].classes;
}

// Get schools a user can access
function getUserSchools(user) {
    if (!user) return [];
    if (user.role === 'admin') return Object.keys(SCHOOLS);
    if (user.school) return [user.school];
    return [];
}

// Check if user has permission
function hasPermission(user, permission) {
    if (!user) return false;
    const role = ROLES[user.role];
    if (!role) return false;
    return role[permission] || false;
}
