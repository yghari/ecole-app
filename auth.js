// auth.js - Authentication system

let currentUser = null;

function initAuth() {
    // Initialize users in localStorage if not exists
    let users = localStorage.getItem('app_users');
    if (!users) {
        localStorage.setItem('app_users', JSON.stringify(DEFAULT_USERS));
    }
    
    // Check for existing session
    const savedSession = sessionStorage.getItem('app_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        const usersList = JSON.parse(localStorage.getItem('app_users'));
        const user = usersList.find(u => u.username === session.username);
        if (user && session.expires > Date.now()) {
            currentUser = user;
            return true;
        }
    }
    return false;
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
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
    return hasPermission(currentUser, permission);
}

function getUserSchool() {
    return currentUser?.school;
}

function getUserSchoolName() {
    const schoolId = currentUser?.school;
    if (!schoolId) return 'Toutes les écoles';
    return SCHOOLS[schoolId]?.name || schoolId;
}

function getUserClasses() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
        return [...new Set(Object.values(SCHOOLS).flatMap(s => s.classes))];
    }
    return getSchoolClasses(currentUser.school);
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

function deleteUser(userId) {
    let users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.username === currentUser?.username) {
        return { success: false, error: 'Vous ne pouvez pas vous supprimer vous-même' };
    }
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('app_users', JSON.stringify(users));
    return { success: true };
}

function getAllUsers() {
    return JSON.parse(localStorage.getItem('app_users') || '[]');
}
