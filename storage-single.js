// storage.js - Google Sheets Sync Version
// ALL users see and modify the SAME data

// ============================================================
// YOUR CONFIGURATION - UPDATED WITH NEW SCRIPT URL
// ============================================================
const GOOGLE_SHEET_ID = "1nb2dBVD-FSf7AMurmnQp_2GCbxCBQtPManWxqFB1GKc";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4XYiXrYCvweiIj10xX3mKPAQruA-Sbxn5DAI1LTvtHRJjPGz00nccJ4k_rKHaEEth/exec";

// Sheet names
const SHEETS = {
    STUDENTS: 'Students',
    BOOKS: 'Books',
    CLASSES: 'Classes'
};

// Cache for data
let appData = {
    students: [],
    books: [],
    classes: []
};

let syncInProgress = false;
let lastSyncTime = 0;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function parseCSV(csvText) {
    const rows = [];
    const lines = csvText.split(/\r?\n/);
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        const row = [];
        let inQuotes = false;
        let currentCell = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        row.push(currentCell.trim());
        
        if (row.length > 0 && row.some(cell => cell !== '')) {
            rows.push(row);
        }
    }
    
    return rows;
}

function sheetRowsToObjects(rows, headers) {
    if (!rows || rows.length < 2) return [];
    const dataRows = rows.slice(1);
    return dataRows.map(row => {
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = row[idx] || '';
        });
        return obj;
    });
}

async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return [];
    }
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadDataFromSheets() {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.innerHTML = '⏳ Synchronisation...';
        statusEl.style.color = '#f5a623';
    }
    
    try {
        const [studentsRows, booksRows, classesRows] = await Promise.all([
            fetchSheetData(SHEETS.STUDENTS),
            fetchSheetData(SHEETS.BOOKS),
            fetchSheetData(SHEETS.CLASSES)
        ]);
        
        // Parse Students
        if (studentsRows.length > 1) {
            const headers = studentsRows[0];
            appData.students = sheetRowsToObjects(studentsRows, headers).map(s => ({
                ...s,
                id: parseInt(s.id) || Date.now(),
                paid: parseFloat(s.paid) || 0,
                remaining: parseFloat(s.remaining) || 0,
                books: s.books ? s.books.split('|') : []
            }));
        }
        
        // Parse Books
        if (booksRows.length > 1) {
            const headers = booksRows[0];
            appData.books = sheetRowsToObjects(booksRows, headers).map(b => ({
                ...b,
                id: parseInt(b.id) || Date.now(),
                quantity: parseInt(b.quantity) || 0,
                available: parseInt(b.available) || 0
            }));
        }
        
        // Parse Classes
        if (classesRows.length > 1) {
            const headers = classesRows[0];
            appData.classes = sheetRowsToObjects(classesRows, headers).map(c => ({
                ...c,
                id: parseInt(c.id) || Date.now()
            }));
        }
        
        // If no data exists, initialize with default data
        if (appData.classes.length === 0 && appData.students.length === 0) {
            await initializeDefaultData();
        }
        
        if (statusEl) {
            statusEl.innerHTML = '✅ Cloud Sync';
            statusEl.style.color = '#2ecc71';
        }
        
        lastSyncTime = Date.now();
        return true;
        
    } catch (error) {
        console.error('Sync error:', error);
        if (statusEl) {
            statusEl.innerHTML = '⚠️ Hors-Ligne';
            statusEl.style.color = '#e74c3c';
        }
        loadFallbackData();
        return false;
    }
}

function loadFallbackData() {
    const savedStudents = localStorage.getItem('centre_app_students_backup');
    const savedBooks = localStorage.getItem('centre_app_books_backup');
    const savedClasses = localStorage.getItem('centre_app_classes_backup');
    
    if (savedStudents) appData.students = JSON.parse(savedStudents);
    if (savedBooks) appData.books = JSON.parse(savedBooks);
    if (savedClasses) appData.classes = JSON.parse(savedClasses);
}

// ============================================================
// DATA SAVING TO GOOGLE SHEETS
// ============================================================

async function saveDataToSheets() {
    if (!SCRIPT_URL) {
        console.log('No script URL - saving to localStorage only');
        saveToLocalStorage();
        return;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                students: appData.students,
                books: appData.books,
                classes: appData.classes
            })
        });
        
        console.log('Data saved to Google Sheets');
        saveToLocalStorage();
        return true;
        
    } catch (error) {
        console.error('Save error:', error);
        saveToLocalStorage();
        return false;
    }
}

function saveToLocalStorage() {
    localStorage.setItem('centre_app_students_backup', JSON.stringify(appData.students));
    localStorage.setItem('centre_app_books_backup', JSON.stringify(appData.books));
    localStorage.setItem('centre_app_classes_backup', JSON.stringify(appData.classes));
}

// ============================================================
// INITIALIZE DEFAULT DATA
// ============================================================

async function initializeDefaultData() {
    const defaultClasses = [
        { id: 1, name: "CP", level: "Primaire" },
        { id: 2, name: "CE1", level: "Primaire" },
        { id: 3, name: "CE2", level: "Primaire" },
        { id: 4, name: "CM1", level: "Primaire" },
        { id: 5, name: "CM2", level: "Primaire" },
        { id: 6, name: "6ème", level: "Collège" }
    ];
    
    const defaultBooks = [
        { id: 1, title: "Manuel de lecture", class: "CP", type: "Manuel", quantity: 30, available: 30 },
        { id: 2, title: "Cahier d'écriture", class: "CP", type: "Cahier", quantity: 30, available: 30 },
        { id: 3, title: "Manuel de lecture", class: "CE1", type: "Manuel", quantity: 25, available: 25 },
        { id: 4, title: "Cahier d'exercices", class: "CE1", type: "Exercice", quantity: 25, available: 25 },
        { id: 5, title: "Manuel de français", class: "6ème", type: "Manuel", quantity: 20, available: 20 }
    ];
    
    const defaultStudents = [
        { id: 1, name: "AMINA HOSNI", class: "CP", phone: "0612345678", delivery: "2024-01-15", paid: 200, remaining: 0, remarks: "", books: ["Manuel de lecture", "Cahier d'écriture"] },
        { id: 2, name: "AYOUB BEQIQUI", class: "CE1", phone: "0612345679", delivery: "2024-01-16", paid: 0, remaining: 150, remarks: "", books: [] },
        { id: 3, name: "CHAHD HIMISSA", class: "CP", phone: "0612345680", delivery: "2024-01-17", paid: 100, remaining: 100, remarks: "", books: ["Manuel de lecture"] }
    ];
    
    appData.classes = defaultClasses;
    appData.books = defaultBooks;
    appData.students = defaultStudents;
    
    await saveDataToSheets();
}

// ============================================================
// PUBLIC API
// ============================================================

function getStudents() { return appData.students; }
function getBooks() { return appData.books; }
function getClasses() { return appData.classes; }

async function addStudent(student) {
    student.id = Date.now();
    appData.students.push(student);
    await saveDataToSheets();
    return student;
}

async function updateStudent(id, updatedData) {
    const index = appData.students.findIndex(s => s.id === id);
    if (index !== -1) {
        appData.students[index] = { ...appData.students[index], ...updatedData };
        await saveDataToSheets();
        return true;
    }
    return false;
}

async function deleteStudent(id) {
    appData.students = appData.students.filter(s => s.id !== id);
    await saveDataToSheets();
}

async function addBook(book) {
    book.id = Date.now();
    appData.books.push(book);
    await saveDataToSheets();
    return book;
}

async function updateBook(id, updatedData) {
    const index = appData.books.findIndex(b => b.id === id);
    if (index !== -1) {
        appData.books[index] = { ...appData.books[index], ...updatedData };
        await saveDataToSheets();
        return true;
    }
    return false;
}

async function deleteBook(id) {
    appData.books = appData.books.filter(b => b.id !== id);
    await saveDataToSheets();
}

async function addClass(newClass) {
    newClass.id = Date.now();
    appData.classes.push(newClass);
    await saveDataToSheets();
    return newClass;
}

async function updateClass(id, updatedData) {
    const index = appData.classes.findIndex(c => c.id === id);
    if (index !== -1) {
        appData.classes[index] = { ...appData.classes[index], ...updatedData };
        await saveDataToSheets();
        return true;
    }
    return false;
}

async function deleteClass(id) {
    appData.classes = appData.classes.filter(c => c.id !== id);
    await saveDataToSheets();
}

function getBooksByClass(className) {
    return appData.books.filter(book => book.class === className);
}

function getStudentsByClass(className) {
    return appData.students.filter(student => student.class === className);
}

async function loadData() {
    const success = await loadDataFromSheets();
    if (!success && appData.students.length === 0) {
        loadFallbackData();
    }
    if (appData.classes.length === 0 && appData.students.length === 0) {
        await initializeDefaultData();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}
