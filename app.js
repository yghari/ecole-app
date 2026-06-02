// app.js - Main application controller (Async version with Stock Management)

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function renderStats() {
    const students = getStudents();
    const total = students.length;
    const totalPaid = students.reduce((a, s) => a + (s.paid || 0), 0);
    const totalRemaining = students.reduce((a, s) => a + (s.remaining || 0), 0);
    const fullPaid = students.filter(s => s.remaining === 0 && s.paid > 0).length;
    const totalBooks = getBooks().reduce((a, b) => a + (b.quantity || 0), 0);
    const lowStockCount = getBooks().filter(b => (b.available || 0) < 10).length;
    
    document.getElementById('statsBar').innerHTML = `
        <div class="stat-card"><div class="label">Total Élèves</div><div class="value">${total}</div></div>
        <div class="stat-card"><div class="label">Montant Reçu</div><div class="value green">${totalPaid} DH</div></div>
        <div class="stat-card"><div class="label">Reste à Percevoir</div><div class="value red">${totalRemaining} DH</div></div>
        <div class="stat-card"><div class="label">Paiement Complet</div><div class="value">${fullPaid}</div></div>
        <div class="stat-card"><div class="label">Total Livres</div><div class="value">${totalBooks}</div></div>
        <div class="stat-card"><div class="label">Stock Faible</div><div class="value ${lowStockCount > 0 ? 'red' : 'green'}">${lowStockCount}</div></div>
    `;
}

async function exportToExcel() {
    const students = getStudents();
    const headers = ['Nom', 'Classe', 'Téléphone', 'Date Livraison', 'Payé (DH)', 'Reste (DH)', 'Livres reçus', 'Remarques'];
    const rows = students.map(s => [
        s.name, s.class, s.phone, s.delivery, s.paid, s.remaining,
        (s.books || []).join(', '), s.remarks
    ]);
    
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves');
    XLSX.writeFile(wb, `eleves_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Export Excel réussi!');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${tabName}Panel`).classList.add('active');
    
    // Refresh the active panel
    if (tabName === 'students') renderStudents();
    if (tabName === 'books') renderBooks();
    if (tabName === 'classes') renderClasses();
    if (tabName === 'stock') {
        if (typeof loadStockData === 'function') loadStockData();
        if (typeof renderStockPanel === 'function') renderStockPanel();
    }
}

function setFilter(filter) {
    currentFilter = filter;
    renderStudents();
}

async function init() {
    // Show loading state
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) syncStatus.innerHTML = '⏳ Connexion à Google Sheets...';
    
    // Load data from cloud
    await loadData();
    
    // Load stock data if available
    if (typeof loadStockData === 'function') loadStockData();
    
    // Set up event listeners
    // Student buttons
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) addStudentBtn.onclick = () => openStudentModal(false);
    
    // Book buttons
    const addBookBtn = document.getElementById('addBookBtn');
    if (addBookBtn) addBookBtn.onclick = () => openBookModal(false);
    
    // Class buttons
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) addClassBtn.onclick = () => openClassModal(false);
    
    // Stock buttons
    const addOrderBtn = document.getElementById('addOrderBtn');
    if (addOrderBtn) addOrderBtn.onclick = () => openOrderModal(false);
    
    const refreshStockBtn = document.getElementById('refreshStockBtn');
    if (refreshStockBtn) refreshStockBtn.onclick = () => {
        if (typeof loadStockData === 'function') loadStockData();
        if (typeof renderStockPanel === 'function') renderStockPanel();
        showToast('Stock actualisé');
    };
    
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) saveOrderBtn.onclick = () => {
        if (typeof saveOrderFromModal === 'function') saveOrderFromModal();
    };
    
    const closeOrderModalBtn = document.getElementById('closeOrderModal');
    if (closeOrderModalBtn) closeOrderModalBtn.onclick = () => {
        if (typeof closeOrderModal === 'function') closeOrderModal();
    };
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.onclick = exportToExcel;
    
    // Save buttons for modals
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    if (saveStudentBtn) saveStudentBtn.onclick = async () => {
        await saveStudentFromModal();
        renderStats();
        renderStudents();
        renderClasses();
        if (typeof renderBooks === 'function') renderBooks();
        if (typeof renderStockPanel === 'function') renderStockPanel();
    };
    
    const saveBookBtn = document.getElementById('saveBookBtn');
    if (saveBookBtn) saveBookBtn.onclick = async () => {
        await saveBookFromModal();
        renderBooks();
        renderClasses();
        renderStats();
    };
    
    const saveClassBtn = document.getElementById('saveClassBtn');
    if (saveClassBtn) saveClassBtn.onclick = async () => {
        await saveClassFromModal();
        renderClasses();
        renderStudents();
        renderBooks();
        renderStats();
    };
    
    // Close buttons for modals
    const closeStudentModalBtn = document.getElementById('closeStudentModal');
    if (closeStudentModalBtn) closeStudentModalBtn.onclick = () => {
        if (typeof closeStudentModal === 'function') closeStudentModal();
    };
    
    const closeBookModalBtn = document.getElementById('closeBookModal');
    if (closeBookModalBtn) closeBookModalBtn.onclick = () => {
        if (typeof closeBookModal === 'function') closeBookModal();
    };
    
    const closeClassModalBtn = document.getElementById('closeClassModal');
    if (closeClassModalBtn) closeClassModalBtn.onclick = () => {
        if (typeof closeClassModal === 'function') closeClassModal();
    };
    
    // Filter buttons
    const filterAllBtn = document.getElementById('filterAllBtn');
    if (filterAllBtn) filterAllBtn.onclick = () => setFilter('all');
    
    const filterPaidBtn = document.getElementById('filterPaidBtn');
    if (filterPaidBtn) filterPaidBtn.onclick = () => setFilter('paid');
    
    const filterUnpaidBtn = document.getElementById('filterUnpaidBtn');
    if (filterUnpaidBtn) filterUnpaidBtn.onclick = () => setFilter('unpaid');
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = () => switchTab(tab.dataset.tab);
    });
    
    // Search and filter inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.oninput = renderStudents;
    
    const bookSearch = document.getElementById('bookSearch');
    if (bookSearch) bookSearch.oninput = renderBooks;
    
    const classFilter = document.getElementById('classFilter');
    if (classFilter) classFilter.onchange = renderStudents;
    
    const bookClassFilter = document.getElementById('bookClassFilter');
    if (bookClassFilter) bookClassFilter.onchange = renderBooks;
    
    // Initial render
    renderStats();
    renderStudents();
    renderBooks();
    renderClasses();
    
    // Initial stock panel render if data exists
    if (typeof renderStockPanel === 'function') renderStockPanel();
    
    // Update sync status
    if (syncStatus) {
        syncStatus.innerHTML = '☁️ Cloud Sync';
        syncStatus.style.color = '#2ecc71';
    }
    
    console.log('Application initialized successfully');
}

// Start the app
init();
