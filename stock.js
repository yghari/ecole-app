// stock.js - Stock and Order Management

let currentEditOrderId = null;

// Stock data structure
let stockOrders = [];
let stockHistory = [];

// Load stock data from storage
function loadStockData() {
    const savedOrders = localStorage.getItem('centre_app_orders');
    const savedHistory = localStorage.getItem('centre_app_stock_history');
    
    if (savedOrders) stockOrders = JSON.parse(savedOrders);
    if (savedHistory) stockHistory = JSON.parse(savedHistory);
    
    // Initialize with sample data if empty
    if (stockOrders.length === 0) {
        initializeSampleOrders();
    }
}

function initializeSampleOrders() {
    stockOrders = [
        { id: 1, bookTitle: "Manuel de lecture", class: "CP", quantity: 50, orderDate: "2024-01-10", status: "livré", receivedDate: "2024-01-15" },
        { id: 2, bookTitle: "Cahier d'écriture", class: "CP", quantity: 50, orderDate: "2024-01-10", status: "livré", receivedDate: "2024-01-15" },
        { id: 3, bookTitle: "Manuel de lecture", class: "CE1", quantity: 30, orderDate: "2024-01-20", status: "en_attente" }
    ];
    saveStockData();
}

function saveStockData() {
    localStorage.setItem('centre_app_orders', JSON.stringify(stockOrders));
    localStorage.setItem('centre_app_stock_history', JSON.stringify(stockHistory));
}

// Add stock movement to history
function addToHistory(bookTitle, action, quantity, studentName = null, reason = null) {
    const historyEntry = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        bookTitle: bookTitle,
        action: action, // 'commande', 'livraison', 'attribution', 'retour'
        quantity: quantity,
        studentName: studentName,
        reason: reason
    };
    stockHistory.unshift(historyEntry); // Add to beginning
    saveStockData();
}

// Render Stock Panel
function renderStockPanel() {
    renderOrdersTable();
    renderStockHistory();
    renderStockSummary();
    checkLowStockAlert();
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersList');
    if (!tbody) return;
    
    if (stockOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucune commande. Cliquez sur "+ Nouvelle Commande"</td><tr>';
        return;
    }
    
    tbody.innerHTML = stockOrders.map((order, idx) => {
        let statusText = '';
        let statusClass = '';
        
        switch(order.status) {
            case 'en_attente':
                statusText = '⏳ En attente';
                statusClass = 'status-warning';
                break;
            case 'livré':
                statusText = '✅ Livré';
                statusClass = 'status-success';
                break;
            case 'annulé':
                statusText = '❌ Annulé';
                statusClass = 'status-danger';
                break;
        }
        
        return `<tr>
            <td>${idx + 1}</td>
            <td style="font-weight:500">${escapeHtml(order.bookTitle)}</td>
            <td><span class="class-badge">${escapeHtml(order.class)}</span></td>
            <td>${order.quantity}</td>
            <td>${order.orderDate || '—'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-btns">
                    ${order.status === 'en_attente' ? `<button class="btn-icon" onclick="markOrderAsReceived(${order.id})">📦 Marquer reçu</button>` : ''}
                    <button class="btn-icon" onclick="editOrder(${order.id})">✏️</button>
                    <button class="btn-icon" onclick="deleteOrder(${order.id})">🗑️</button>
                </div>
            </td>
        </table>`;
    }).join('');
}

function renderStockHistory() {
    const tbody = document.getElementById('stockHistoryList');
    if (!tbody) return;
    
    if (stockHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucun historique</td><tr>';
        return;
    }
    
    // Show last 50 entries
    const recentHistory = stockHistory.slice(0, 50);
    
    tbody.innerHTML = recentHistory.map((entry, idx) => {
        let actionIcon = '';
        switch(entry.action) {
            case 'commande': actionIcon = '🛒'; break;
            case 'livraison': actionIcon = '📦'; break;
            case 'attribution': actionIcon = '👨‍🎓'; break;
            case 'retour': actionIcon = '🔄'; break;
            default: actionIcon = '📝';
        }
        
        return `<tr>
            <td>${idx + 1}</td>
            <td style="font-size:12px">${entry.date}</td>
            <td>${escapeHtml(entry.bookTitle)}</td>
            <td>${actionIcon} ${escapeHtml(entry.action)}</td>
            <td>${entry.quantity > 0 ? '+' : ''}${entry.quantity}</td>
            <td>${entry.studentName ? escapeHtml(entry.studentName) : '—'}</td>
            <td style="font-size:11px; color:var(--muted)">${entry.reason || '—'}</td>
        </tr>`;
    }).join('');
}

function renderStockSummary() {
    const container = document.getElementById('stockSummary');
    if (!container) return;
    
    const totalOrders = stockOrders.reduce((sum, o) => sum + o.quantity, 0);
    const pendingOrders = stockOrders.filter(o => o.status === 'en_attente').reduce((sum, o) => sum + o.quantity, 0);
    const receivedOrders = stockOrders.filter(o => o.status === 'livré').reduce((sum, o) => sum + o.quantity, 0);
    
    container.innerHTML = `
        <div class="stat-card"><div class="label">Total commandé</div><div class="value">${totalOrders}</div></div>
        <div class="stat-card"><div class="label">En attente</div><div class="value red">${pendingOrders}</div></div>
        <div class="stat-card"><div class="label">Reçu</div><div class="value green">${receivedOrders}</div></div>
        <div class="stat-card"><div class="label">Mouvements</div><div class="value">${stockHistory.length}</div></div>
    `;
}

function checkLowStockAlert() {
    const container = document.getElementById('lowStockAlert');
    if (!container) return;
    
    const books = getBooks();
    const lowStockBooks = books.filter(book => (book.available || 0) < 10);
    
    if (lowStockBooks.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div style="background: #3a1a1a; border-left: 4px solid #e74c3c; padding: 12px 16px; border-radius: 8px;">
            <strong>⚠️ Stock faible !</strong><br>
            ${lowStockBooks.map(book => 
                `• ${escapeHtml(book.title)} (${book.class}) : ${book.available} restant(s)`
            ).join('<br>')}
        </div>
    `;
}

// Order Management
function openOrderModal(editMode = false) {
    document.getElementById('orderModalTitle').textContent = editMode ? 'Modifier Commande' : 'Nouvelle Commande';
    document.getElementById('orderBook').value = '';
    document.getElementById('orderClass').value = '';
    document.getElementById('orderQuantity').value = 0;
    document.getElementById('orderDate').value = new Date().toISOString().slice(0, 10);
    
    // Populate book dropdown
    const bookSelect = document.getElementById('orderBook');
    const books = getBooks();
    bookSelect.innerHTML = '<option value="">-- Sélectionner un livre --</option>' + 
        books.map(b => `<option value="${escapeHtml(b.title)}" data-class="${escapeHtml(b.class)}">${escapeHtml(b.title)} (${b.class})</option>`).join('');
    
    // Auto-fill class when book is selected
    bookSelect.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        const bookClass = selectedOption.getAttribute('data-class');
        if (bookClass) {
            document.getElementById('orderClass').value = bookClass;
        }
    };
    
    // Populate class dropdown
    const classSelect = document.getElementById('orderClass');
    const classes = getClasses();
    classSelect.innerHTML = '<option value="">-- Sélectionner une classe --</option>' + 
        classes.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
    
    document.getElementById('orderModal').classList.add('open');
}

function saveOrderFromModal() {
    const bookTitle = document.getElementById('orderBook').value;
    const className = document.getElementById('orderClass').value;
    const quantity = parseInt(document.getElementById('orderQuantity').value) || 0;
    const orderDate = document.getElementById('orderDate').value;
    
    if (!bookTitle || !className || quantity <= 0) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    if (currentEditOrderId) {
        // Update existing order
        const index = stockOrders.findIndex(o => o.id === currentEditOrderId);
        if (index !== -1) {
            const oldOrder = stockOrders[index];
            stockOrders[index] = {
                ...stockOrders[index],
                bookTitle, class: className, quantity, orderDate
            };
            addToHistory(bookTitle, 'commande_modifiée', quantity, null, `Modification de commande`);
            showToast('Commande modifiée ✅');
        }
    } else {
        // New order
        const newOrder = {
            id: Date.now(),
            bookTitle,
            class: className,
            quantity,
            orderDate,
            status: 'en_attente'
        };
        stockOrders.push(newOrder);
        addToHistory(bookTitle, 'commande', quantity, null, `Nouvelle commande passée`);
        showToast('Commande ajoutée ✅');
    }
    
    saveStockData();
    closeOrderModal();
    renderStockPanel();
}

function editOrder(id) {
    const order = stockOrders.find(o => o.id === id);
    if (!order) return;
    currentEditOrderId = id;
    
    document.getElementById('orderModalTitle').textContent = 'Modifier Commande';
    document.getElementById('orderBook').value = order.bookTitle;
    document.getElementById('orderClass').value = order.class;
    document.getElementById('orderQuantity').value = order.quantity;
    document.getElementById('orderDate').value = order.orderDate || '';
    
    document.getElementById('orderModal').classList.add('open');
}

async function markOrderAsReceived(orderId) {
    const order = stockOrders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!confirm(`Marquer la commande de ${order.quantity} "${order.bookTitle}" comme reçue ?`)) return;
    
    // Update order status
    order.status = 'livré';
    order.receivedDate = new Date().toISOString().slice(0, 10);
    
    // Update book stock
    const book = getBooks().find(b => b.title === order.bookTitle && b.class === order.class);
    if (book) {
        const newQuantity = (book.quantity || 0) + order.quantity;
        const newAvailable = (book.available || 0) + order.quantity;
        await updateBook(book.id, { 
            quantity: newQuantity, 
            available: newAvailable 
        });
        addToHistory(order.bookTitle, 'livraison', order.quantity, null, `Livraison reçue - Commande #${order.id}`);
        showToast(`Stock mis à jour: +${order.quantity} ${order.bookTitle}`);
    }
    
    saveStockData();
    renderStockPanel();
    
    // Refresh books display
    if (typeof renderBooks === 'function') renderBooks();
}

function deleteOrder(id) {
    const order = stockOrders.find(o => o.id === id);
    if (!confirm(`Supprimer la commande de "${order.bookTitle}" ?`)) return;
    
    stockOrders = stockOrders.filter(o => o.id !== id);
    addToHistory(order.bookTitle, 'commande_annulée', order.quantity, null, `Commande annulée`);
    saveStockData();
    renderStockPanel();
    showToast('Commande supprimée');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('open');
    currentEditOrderId = null;
}

// Override the existing assignBookToStudent function to track stock
async function assignBookToStudent(bookTitle, className, studentName) {
    const book = getBooks().find(b => b.title === bookTitle && b.class === className);
    if (book && (book.available || 0) > 0) {
        const newAvailable = (book.available || 0) - 1;
        await updateBook(book.id, { available: newAvailable });
        addToHistory(bookTitle, 'attribution', -1, studentName, `Attribution à l'élève`);
        return true;
    } else {
        showToast(`Stock insuffisant pour "${bookTitle}"`);
        return false;
    }
}
