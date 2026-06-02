// auth.js - Authentication system (DEBUG VERSION)

let currentUser = null;

// Initialize users directly (no localStorage check first)
function initAuth() {
    // ALWAYS initialize users on every load to ensure they exist
    const defaultUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', school: null, name: 'Administrateur Général' },
        { id: 2, username: 'l1_admin', password: 'l1pass', role: 'school_admin', school: 'L1', name: 'Admin L1' },
        { id: 3, username: 'l2_admin', password: 'l2pass', role: 'school_admin', school: 'L2', name: 'Admin L2' },
        { id: 4, username: 'l3_admin', password: 'l3pass', role: 'school_admin', school: 'L3', name: 'Admin L3' },
        { id: 5, username: 'l1_teacher', password: 'teacher', role: 'teacher', school: 'L1', name: 'Professeur L1' }
    ];
    
    // Save to localStorage
    localStorage.setItem('app_users', JSON.stringify(defaultUsers));
    
    // Check for existing session
    const savedSession = sessionStorage.getItem('app_session');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            const user = defaultUsers.find(u => u.username === session.username);
            if (user && session.expires > Date.now()) {
                currentUser = user;
                return true;
            }
        } catch(e) {}
    }
    return false;
}

function login(username, password) {
    console.log('Attempting login with:', username, password);
    
    // Get users from localStorage
    const usersJSON = localStorage.getItem('app_users');
    console.log('Users from localStorage:', usersJSON);
    
    let users = [];
    if (usersJSON) {
        users = JSON.parse(usersJSON);
    }
    
    console.log('Parsed users:', users);
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    console.log('Found user:', user);
    
    if (user) {
        currentUser = user;
        // Create session (expires in 8 hours)
        sessionStorage.setItem('app_session', JSON.stringify({
            username: user.username,
            expires: Date.now() + (8 * 60 * 60 * 1000)
        }));
        return { success: true, user: user };
    }
    
    return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('app_session');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    return currentUser;
}

function isLoggedIn() {
    return currentUser !== null;
}

function can(permission) {
    const roles = {
        admin: { canManageOrders: true, canManageStock: true, canManageStudents: true, canManageBooks: true, canManageClasses: true },
        school_admin: { canManageOrders: true, canManageStock: true, canManageStudents: true, canManageBooks: true, canManageClasses: true },
        teacher: { canManageStudents: true, canManageOrders: false, canManageStock: false, canManageBooks: false, canManageClasses: false }
    };
    return roles[currentUser?.role]?.[permission] || false;
}

function getUserSchool() {
    return currentUser?.school;
}

function getUserSchoolName() {
    const schools = {
        'L1': '🏫 École Primaire L1',
        'L2': '🏫 Collège L2',
        'L3': '🏫 Lycée L3'
    };
    if (!currentUser?.school) return 'Toutes les écoles';
    return schools[currentUser.school] || currentUser.school;
}

function getUserClasses() {
    const schoolClasses = {
        'L1': ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        'L2': ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'],
        'L3': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle']
    };
    
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
        return [...new Set([...schoolClasses.L1, ...schoolClasses.L2, ...schoolClasses.L3])];
    }
    return schoolClasses[currentUser.school] || [];
}

function addUser(username, password, role, school, name) {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    if (users.find(u => u.username === username)) {
        return { success: false, error: 'Utilisateur existe déjà' };
    }
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    users.push({ id: newId, username, password, role, school, name });
    localStorage.setItem('app_users', JSON.stringify(users));
    return { success: true };
}

function getAllUsers() {
    return JSON.parse(localStorage.getItem('app_users') || '[]');
}
