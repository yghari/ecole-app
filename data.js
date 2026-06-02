// data.js - Default data for first run

function loadDefaultData() {
    // Default classes
    const defaultClasses = [
        { id: 1, name: "CP", level: "Primaire" },
        { id: 2, name: "CE1", level: "Primaire" },
        { id: 3, name: "CE2", level: "Primaire" },
        { id: 4, name: "CM1", level: "Primaire" },
        { id: 5, name: "CM2", level: "Primaire" },
        { id: 6, name: "6ème", level: "Collège" }
    ];
    
    // Default books by class
    const defaultBooks = [
        { id: 1, title: "Manuel de lecture", class: "CP", type: "Manuel", quantity: 30, available: 30 },
        { id: 2, title: "Cahier d'écriture", class: "CP", type: "Cahier", quantity: 30, available: 30 },
        { id: 3, title: "Manuel de lecture", class: "CE1", type: "Manuel", quantity: 25, available: 25 },
        { id: 4, title: "Cahier d'exercices", class: "CE1", type: "Exercice", quantity: 25, available: 25 },
        { id: 5, title: "Manuel de français", class: "6ème", type: "Manuel", quantity: 20, available: 20 }
    ];
    
    // Default students
    const defaultStudents = [
        { id: 1, name: "AMINA HOSNI", class: "CP", phone: "0612345678", delivery: "2024-01-15", paid: 200, remaining: 0, remarks: "", books: ["Manuel de lecture", "Cahier d'écriture"] },
        { id: 2, name: "AYOUB BEQIOUI", class: "CE1", phone: "0612345679", delivery: "2024-01-16", paid: 0, remaining: 150, remarks: "", books: [] },
        { id: 3, name: "CHAHD HMIMSSA", class: "CP", phone: "0612345680", delivery: "2024-01-17", paid: 100, remaining: 100, remarks: "", books: ["Manuel de lecture"] }
    ];
    
    appData.classes = defaultClasses;
    appData.books = defaultBooks;
    appData.students = defaultStudents;
    
    saveData();
}
