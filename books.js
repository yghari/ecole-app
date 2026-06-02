// books.js - Book management logic with Google Sheets sync

let currentEditBookId = null;

function renderBooks() {
    const searchTerm = document.getElementById('bookSearch')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('bookClassFilter')?.value || 'all';
    
    let filtered = getBooks().filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm);
        const matchesClass = classFilter === 'all' || book.class === classFilter;
        return matchesSearch && matchesClass;
    });
    
    document.getElementById('bookCount').innerHTML = `${filtered.length} livre(s)`;
    
    const tbody = document.getElementById('booksList');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucun livre</td></tr>';
    } else {
        tbody.innerHTML = filtered.map((book, idx) => {
            const isLowStock = (book.available || 0) < 5;
            const stockColor = isLowStock ? 'var(--red)' : 'var(--green)';
            return `<tr>
                <td style="color:var(--muted)">${idx + 1}</td>
                <td style="font-weight:500">${escapeHtml(book.title)}</td>
                <td><span class="class-badge">${escapeHtml(book.class)}</span></td>
                <td>${escapeHtml(book.type)}</td>
                <td>${book.quantity || 0}</td>
                <td style="color:${stockColor}; font-weight:${isLowStock ? 'bold' : 'normal'}">${book.available || 0}</td>
                <td><div class="action-btns">
                    <button class="btn-icon" onclick="editBook(${book.id})">✏️</button>
                    <button class="btn-icon" onclick="confirmDeleteBook(${book.id})">🗑️</button>
                </div></td>
            </tr>`;
        }).join('');
    }
    
    // Update class filter dropdown for books
    const uniqueClasses = [...new Set(getBooks().map(b => b.class).filter(c => c))];
    const classSelect = document.getElementById('bookClassFilter');
    if (classSelect) {
        const currentVal = classSelect.value;
        classSelect.innerHTML = '<option value="all">📚 Toutes les classes</option>' + 
            uniqueClasses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        if (uniqueClasses.includes(currentVal)) classSelect.value = currentVal;
    }
}

function openBookModal(editMode = false) {
    document.getElementById('bookModalTitle').textContent = editMode ? 'Modifier Livre' : 'Ajouter un Livre';
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookQuantity').value = 0;
    document.getElementById('bookType').value = 'Manuel';
    
    // Populate class dropdown
    const classSelect = document.getElementById('bookClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner une classe --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    document.getElementById('bookModal').classList.add('open');
}

async function saveBookFromModal() {
    const title = document.getElementById('bookTitle').value.trim();
    if (!title) { 
        showToast('Le titre est obligatoire'); 
        return; 
    }
    
    const selectedClass = document.getElementById('bookClass').value;
    if (!selectedClass) { 
        showToast('Veuillez sélectionner une classe'); 
        return; 
    }
    
    const quantity = parseInt(document.getElementById('bookQuantity').value) || 0;
    
    const bookData = {
        title: title,
        class: selectedClass,
        type: document.getElementById('bookType').value,
        quantity: quantity,
        available: quantity  // When adding new book, available = quantity
    };
    
    try {
        if (currentEditBookId) {
            await updateBook(currentEditBookId, bookData);
            showToast('Livre modifié et synchronisé ✅');
        } else {
            await addBook(bookData);
            showToast('Livre ajouté et synchronisé ✅');
        }
        
        closeBookModal();
        await renderBooks();
        await renderClasses();
        
        // Refresh stats display
        if (typeof renderStats === 'function') renderStats();
        
    } catch (error) {
        console.error('Error saving book:', error);
        showToast('Erreur lors de la sauvegarde');
    }
}

async function editBook(id) {
    const book = getBooks().find(b => b.id === id);
    if (!book) return;
    currentEditBookId = id;
    
    document.getElementById('bookModalTitle').textContent = 'Modifier Livre';
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookQuantity').value = book.quantity || 0;
    document.getElementById('bookType').value = book.type || 'Manuel';
    
    const classSelect = document.getElementById('bookClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}" ${c.name === book.class ? 'selected' : ''}>${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    document.getElementById('bookModal').classList.add('open');
}

async function confirmDeleteBook(id) {
    const book = getBooks().find(b => b.id === id);
    if (!book) return;
    
    // Check if any students have this book
    const studentsWithBook = getStudents().filter(s => 
        s.books && s.books.includes(book.title)
    );
    
    let warningMsg = `Supprimer "${book.title}" ?`;
    if (studentsWithBook.length > 0) {
        warningMsg = `⚠️ Attention: ${studentsWithBook.length} élève(s) ont reçu ce livre.\n\n${warningMsg}`;
    }
    
    if (confirm(warningMsg)) {
        try {
            await deleteBook(id);
            await renderBooks();
            await renderClasses();
            showToast('Livre supprimé ✅');
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast('Erreur lors de la suppression');
        }
    }
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('open');
    currentEditBookId = null;
}

// Helper function to update book stock when assigned to students
async function updateBookStock(bookTitle, quantityChange) {
    const book = getBooks().find(b => b.title === bookTitle);
    if (book) {
        const newAvailable = (book.available || 0) + quantityChange;
        if (newAvailable >= 0) {
            await updateBook(book.id, { available: newAvailable });
        }
    }
}

// Get low stock books (for notifications)
function getLowStockBooks(threshold = 5) {
    return getBooks().filter(book => (book.available || 0) < threshold);
}
