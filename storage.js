// storage.js - Handles all data persistence

const STORAGE_KEYS = {
    STUDENTS: 'centre_app_students',
    BOOKS: 'centre_app_books',
    CLASSES: 'centre_app_classes'
};

let appData = {
    students: [],
    books: [],
    classes: []
};

// Load all data from localStorage
function loadData() {
    appData.students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    appData.books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || '[]');
    appData.classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    
    // If no data, load default data
    if (appData.classes.length === 0) {
        loadDefaultData();
    }
}

// Save all data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appData.students));
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appData.books));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(appData.classes));
    updateSyncStatus();
}

// Get data (exposed globally)
function getStudents() { return appData.students; }
function getBooks() { return appData.books; }
function getClasses() { return appData.classes; }

// Add/Update/Delete helpers
function addStudent(student) {
    student.id = Date.now();
    appData.students.push(student);
    saveData();
    return student;
}

function updateStudent(id, updatedData) {
    const index = appData.students.findIndex(s => s.id === id);
    if (index !== -1) {
        appData.students[index] = { ...appData.students[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

function deleteStudent(id) {
    appData.students = appData.students.filter(s => s.id !== id);
    saveData();
}

function addBook(book) {
    book.id = Date.now();
    appData.books.push(book);
    saveData();
    return book;
}

function updateBook(id, updatedData) {
    const index = appData.books.findIndex(b => b.id === id);
    if (index !== -1) {
        appData.books[index] = { ...appData.books[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

function deleteBook(id) {
    appData.books = appData.books.filter(b => b.id !== id);
    saveData();
}

function addClass(newClass) {
    newClass.id = Date.now();
    appData.classes.push(newClass);
    saveData();
    return newClass;
}

function updateClass(id, updatedData) {
    const index = appData.classes.findIndex(c => c.id === id);
    if (index !== -1) {
        appData.classes[index] = { ...appData.classes[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

function deleteClass(id) {
    appData.classes = appData.classes.filter(c => c.id !== id);
    saveData();
}

// Get books for a specific class
function getBooksByClass(className) {
    return appData.books.filter(book => book.class === className);
}

// Get students for a specific class
function getStudentsByClass(className) {
    return appData.students.filter(student => student.class === className);
}

function updateSyncStatus() {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.innerHTML = '💾 Sauvegardé localement';
        setTimeout(() => {
            statusEl.innerHTML = '📊 Mode Démo - Données locales';
        }, 2000);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
