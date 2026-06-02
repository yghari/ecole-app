// app.js - Main application controller (Async version)

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
    
    document.getElementById('statsBar').innerHTML = `
        <div class="stat-card"><div class="label">Total Élèves</div><div class="value">${total}</div></div>
        <div class="stat-card"><div class="label">Montant Reçu</div><div class="value green">${totalPaid} DH</div></div>
        <div class="stat-card"><div class="label">Reste à Percevoir</div><div class="value red">${totalRemaining} DH</div></div>
        <div class="stat-card"><div class="label">Paiement Complet</div><div class="value">${fullPaid}</div></div>
        <div class="stat-card"><div class="label">Total Livres</div><div class="value">${totalBooks}</div></div>
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
    
    if (tabName === 'students') renderStudents();
    if (tabName === 'books') renderBooks();
    if (tabName === 'classes') renderClasses();
}

function setFilter(filter) {
    currentFilter = filter;
    renderStudents();
}

async function init() {
    // Show loading state
    document.getElementById('syncStatus').innerHTML = '⏳ Connexion à Google Sheets...';
    
    // Load data from cloud
    await loadData();
    
    // Set up event listeners
    document.getElementById('addStudentBtn').onclick = () => openStudentModal(false);
    document.getElementById('addBookBtn').onclick = () => openBookModal(false);
    document.getElementById('addClassBtn').onclick = () => openClassModal(false);
    document.getElementById('exportBtn').onclick = exportToExcel;
    
    document.getElementById('saveStudentBtn').onclick = async () => {
        await saveStudentFromModal();
        renderStats();
        renderStudents();
        renderClasses();
    };
    document.getElementById('saveBookBtn').onclick = async () => {
        await saveBookFromModal();
        renderBooks();
        renderClasses();
    };
    document.getElementById('saveClassBtn').onclick = async () => {
        await saveClassFromModal();
        renderClasses();
        renderStudents();
        renderBooks();
    };
    
    document.getElementById('closeStudentModal').onclick = closeStudentModal;
    document.getElementById('closeBookModal').onclick = closeBookModal;
    document.getElementById('closeClassModal').onclick = closeClassModal;
    
    document.getElementById('filterAllBtn').onclick = () => setFilter('all');
    document.getElementById('filterPaidBtn').onclick = () => setFilter('paid');
    document.getElementById('filterUnpaidBtn').onclick = () => setFilter('unpaid');
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = () => switchTab(tab.dataset.tab);
    });
    
    document.getElementById('searchInput').oninput = renderStudents;
    document.getElementById('bookSearch').oninput = renderBooks;
    document.getElementById('classFilter').onchange = renderStudents;
    document.getElementById('bookClassFilter').onchange = renderBooks;
    
    // Initial render
    renderStats();
    renderStudents();
    renderBooks();
    renderClasses();
}

// Start the app
init();
