// storage.js - Multi-school version (REPLACE your existing file)

// Get storage key based on current school
function getSchoolPrefix() {
    const user = getCurrentUser();
    if (!user || user.role === 'admin') return 'global_';
    return `${user.school}_`;
}

let appData = {
    students: [],
    books: [],
    classes: [],
    orders: [],
    stockHistory: []
};

// Load data for current user's school
async function loadData() {
    const prefix = getSchoolPrefix();
    
    const savedStudents = localStorage.getItem(`${prefix}students`);
    const savedBooks = localStorage.getItem(`${prefix}books`);
    const savedClasses = localStorage.getItem(`${prefix}classes`);
    const savedOrders = localStorage.getItem(`${prefix}orders`);
    const savedHistory = localStorage.getItem(`${prefix}stock_history`);
    
    if (savedStudents) appData.students = JSON.parse(savedStudents);
    if (savedBooks) appData.books = JSON.parse(savedBooks);
    if (savedClasses) appData.classes = JSON.parse(savedClasses);
    if (savedOrders) appData.orders = JSON.parse(savedOrders);
    if (savedHistory) appData.stockHistory = JSON.parse(savedHistory);
    
    // Initialize with school-specific data if empty
    if (appData.classes.length === 0) {
        initializeSchoolData();
    }
}

function initializeSchoolData() {
    const user = getCurrentUser();
    let schoolClasses = [];
    
    if (user.role === 'admin') {
        schoolClasses = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];
    } else {
        schoolClasses = getSchoolClasses(user.school);
    }
    
    appData.classes = schoolClasses.map((name, index) => ({
        id: index + 1,
        name: name,
        level: getLevelForClass(name)
    }));
    
    appData.books = [];
    schoolClasses.forEach((className, idx) => {
        appData.books.push({
            id: idx * 10 + 1,
            title: "Manuel principal",
            class: className,
            type: "Manuel",
            quantity: 30,
            available: 30
        });
    });
    
    appData.students = [];
    appData.orders = [];
    appData.stockHistory = [];
    
    saveData();
}

function getLevelForClass(className) {
    const primary = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
    const college = ['6ème', '5ème', '4ème', '3ème'];
    const lycee = ['2nde', '1ère', 'Tle'];
    
    if (primary.includes(className)) return 'Primaire';
    if (college.includes(className)) return 'Collège';
    if (lycee.includes(className)) return 'Lycée';
    return 'Autre';
}

function saveData() {
    const prefix = getSchoolPrefix();
    
    localStorage.setItem(`${prefix}students`, JSON.stringify(appData.students));
    localStorage.setItem(`${prefix}books`, JSON.stringify(appData.books));
    localStorage.setItem(`${prefix}classes`, JSON.stringify(appData.classes));
    localStorage.setItem(`${prefix}orders`, JSON.stringify(appData.orders));
    localStorage.setItem(`${prefix}stock_history`, JSON.stringify(appData.stockHistory));
    
    // Update UI
    if (typeof renderStats === 'function') renderStats();
}

// Public API (same as before, but school-aware)
function getStudents() { return appData.students; }
function getBooks() { return appData.books; }
function getClasses() { return appData.classes; }
function getOrders() { return appData.orders || []; }
function getStockHistory() { return appData.stockHistory || []; }

async function addStudent(student) {
    student.id = Date.now();
    appData.students.push(student);
    saveData();
    return student;
}

async function updateStudent(id, updatedData) {
    const index = appData.students.findIndex(s => s.id === id);
    if (index !== -1) {
        appData.students[index] = { ...appData.students[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

async function deleteStudent(id) {
    appData.students = appData.students.filter(s => s.id !== id);
    saveData();
}

async function addBook(book) {
    book.id = Date.now();
    appData.books.push(book);
    saveData();
    return book;
}

async function updateBook(id, updatedData) {
    const index = appData.books.findIndex(b => b.id === id);
    if (index !== -1) {
        appData.books[index] = { ...appData.books[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

async function deleteBook(id) {
    appData.books = appData.books.filter(b => b.id !== id);
    saveData();
}

async function addClass(newClass) {
    newClass.id = Date.now();
    appData.classes.push(newClass);
    saveData();
    return newClass;
}

async function updateClass(id, updatedData) {
    const index = appData.classes.findIndex(c => c.id === id);
    if (index !== -1) {
        appData.classes[index] = { ...appData.classes[index], ...updatedData };
        saveData();
        return true;
    }
    return false;
}

async function deleteClass(id) {
    appData.classes = appData.classes.filter(c => c.id !== id);
    saveData();
}

function getBooksByClass(className) {
    return appData.books.filter(book => book.class === className);
}

function getStudentsByClass(className) {
    return appData.students.filter(student => student.class === className);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}
