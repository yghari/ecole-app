// auth.js - Authentication and session management

let currentUser = null;

// Initialize authentication
function initAuth() {
    // Load users from localStorage or use defaults
    let users = localStorage.getItem('app_users');
    if (!users) {
        localStorage.setItem('app_users', JSON.stringify(DEFAULT_USERS));
        users = DEFAULT_USERS;
    } else {
        users = JSON.parse(users);
    }
    
    // Check for existing session
    const savedSession = sessionStorage.getItem('app_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const user = users.find(u => u.username === session.username);
        if (user && session.expires > Date.now()) {
            currentUser = user;
            return true;
        }
    }
    return false;
}

// Login function
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
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

// Logout function
function logout() {
    currentUser = null;
    sessionStorage.removeItem('app_session');
    window.location.href = 'index.html';
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Check permission
function can(permission) {
    return hasPermission(currentUser, permission);
}

// Get user's school
function getUserSchool() {
    return currentUser?.school;
}

// Get available classes for user's school
function getUserClasses() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
        // Admin sees all classes from all schools
        return [...new Set(Object.values(SCHOOLS).flatMap(s => s.classes))];
    }
    return getSchoolClasses(currentUser.school);
}

// Get available schools for user
function getUserSchoolsList() {
    return getUserSchools(currentUser);
}

// Change user password (admin only or self)
function changePassword(username, oldPassword, newPassword) {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) return { success: false, error: 'Utilisateur non trouvé' };
    
    // If not admin, verify old password
    if (currentUser?.role !== 'admin' && users[userIndex].password !== oldPassword) {
        return { success: false, error: 'Ancien mot de passe incorrect' };
    }
    
    users[userIndex].password = newPassword;
    localStorage.setItem('app_users', JSON.stringify(users));
    return { success: true };
}

// Add new user (admin only)
function addUser(username, password, role, school, name) {
    if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Permission refusée' };
    }
    
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    if (users.find(u => u.username === username)) {
        return { success: false, error: 'Utilisateur existe déjà' };
    }
    
    users.push({ username, password, role, school, name });
    localStorage.setItem('app_users', JSON.stringify(users));
    return { success: true };
}

// Delete user (admin only)
function deleteUser(username) {
    if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Permission refusée' };
    }
    if (username === currentUser.username) {
        return { success: false, error: 'Vous ne pouvez pas vous supprimer vous-même' };
    }
    
    let users = JSON.parse(localStorage.getItem('app_users') || '[]');
    users = users.filter(u => u.username !== username);
    localStorage.setItem('app_users', JSON.stringify(users));
    return { success: true };
}

// Get all users (admin only)
function getAllUsers() {
    if (!currentUser || currentUser.role !== 'admin') return [];
    return JSON.parse(localStorage.getItem('app_users') || '[]');
}
