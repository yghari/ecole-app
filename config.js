// config.js - School configurations

const SCHOOLS = {
    L1: {
        id: 'L1',
        name: '🏫 École Primaire L1',
        levels: ['Primaire'],
        classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        address: '123 Rue de l\'École, Casablanca',
        color: '#4CAF50'
    },
    L2: {
        id: 'L2',
        name: '🏫 Collège L2',
        levels: ['Primaire', 'Collège'],
        classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        address: '456 Avenue des Écoles, Rabat',
        color: '#2196F3'
    },
    L3: {
        id: 'L3',
        name: '🏫 Lycée L3',
        levels: ['Collège', 'Lycée'],
        classes: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'],
        address: '789 Boulevard de l\'Éducation, Tanger',
        color: '#FF9800'
    }
};

// Default users (stored in localStorage)
const DEFAULT_USERS = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', school: null, name: 'Administrateur Général' },
    { id: 2, username: 'l1_admin', password: 'l1pass', role: 'school_admin', school: 'L1', name: 'Admin L1' },
    { id: 3, username: 'l2_admin', password: 'l2pass', role: 'school_admin', school: 'L2', name: 'Admin L2' },
    { id: 4, username: 'l3_admin', password: 'l3pass', role: 'school_admin', school: 'L3', name: 'Admin L3' },
    { id: 5, username: 'l1_teacher', password: 'teacher', role: 'teacher', school: 'L1', name: 'Prof L1' }
];

// Role permissions
const ROLES = {
    admin: {
        canManageUsers: true,
        canManageOrders: true,
        canManageStock: true,
        canManageStudents: true,
        canManageBooks: true,
        canManageClasses: true,
        canViewAllSchools: true
    },
    school_admin: {
        canManageUsers: false,
        canManageOrders: true,
        canManageStock: true,
        canManageStudents: true,
        canManageBooks: true,
        canManageClasses: true,
        canViewAllSchools: false
    },
    teacher: {
        canManageUsers: false,
        canManageOrders: false,
        canManageStock: false,
        canManageStudents: true,
        canManageBooks: false,
        canManageClasses: false,
        canViewAllSchools: false
    }
};

function getSchoolClasses(schoolId) {
    if (!schoolId || !SCHOOLS[schoolId]) return [];
    return SCHOOLS[schoolId].classes;
}

function hasPermission(user, permission) {
    if (!user) return false;
    return ROLES[user.role]?.[permission] || false;
}
