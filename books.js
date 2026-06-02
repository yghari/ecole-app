// books.js - Book management logic

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
        tbody.innerHTML = filtered.map((book, idx) => `<tr>
            <td>${idx + 1}</td>
            <td style="font-weight:500">${escapeHtml(book.title)}</td>
            <td><span class="class-badge">${escapeHtml(book.class)}</span></td>
            <td>${escapeHtml(book.type)}</td>
            <td>${book.quantity || 0}</td>
            <td style="color:var(--green)">${book.available || 0}</td>
            <td><div class="action-btns">
                <button class="btn-icon" onclick="editBook(${book.id})">✏️</button>
                <button class="btn-icon" onclick="confirmDeleteBook(${book.id})">🗑️</button>
            </div></td>
        </tr>`).join('');
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
    
    // Populate class dropdown
    const classSelect = document.getElementById('bookClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner une classe --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    document.getElementById('bookModal').classList.add('open');
}

function saveBookFromModal() {
    const title = document.getElementById('bookTitle').value.trim();
    if (!title) { showToast('Le titre est obligatoire'); return; }
    
    const bookData = {
        title: title,
        class: document.getElementById('bookClass').value,
        type: document.getElementById('bookType').value,
        quantity: parseInt(document.getElementById('bookQuantity').value) || 0,
        available: parseInt(document.getElementById('bookQuantity').value) || 0
    };
    
    if (currentEditBookId) {
        updateBook(currentEditBookId, bookData);
        showToast('Livre modifié ✅');
    } else {
        addBook(bookData);
        showToast('Livre ajouté ✅');
    }
    
    closeBookModal();
    renderBooks();
    renderClasses();
}

function editBook(id) {
    const book = getBooks().find(b => b.id === id);
    if (!book) return;
    currentEditBookId = id;
    
    document.getElementById('bookModalTitle').textContent = 'Modifier Livre';
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookQuantity').value = book.quantity || 0;
    document.getElementById('bookType').value = book.type || 'Manuel';
    
    const classSelect = document.getElementById('bookClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}" ${c.name === book.class ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    
    document.getElementById('bookModal').classList.add('open');
}

function confirmDeleteBook(id) {
    const book = getBooks().find(b => b.id === id);
    if (confirm(`Supprimer ${book.title} ?`)) {
        deleteBook(id);
        renderBooks();
        showToast('Livre supprimé');
    }
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('open');
    currentEditBookId = null;
}
