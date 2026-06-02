// students.js - Student management logic with Google Sheets sync

let currentEditStudentId = null;
let currentFilter = 'all'; // all, paid, unpaid

function renderStudents() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('classFilter')?.value || 'all';
    
    let filtered = getStudents().filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm);
        const matchesClass = classFilter === 'all' || student.class === classFilter;
        const isPaid = (student.remaining === 0 && student.paid > 0);
        const matchesFilter = currentFilter === 'all' || 
                             (currentFilter === 'paid' && isPaid) || 
                             (currentFilter === 'unpaid' && !isPaid);
        return matchesSearch && matchesClass && matchesFilter;
    });
    
    document.getElementById('studentCount').innerHTML = `${filtered.length} élève(s)`;
    
    const tbody = document.getElementById('studentsList');
    const empty = document.getElementById('studentsEmpty');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        tbody.innerHTML = filtered.map((student, idx) => {
            const isPaid = student.remaining === 0 && student.paid > 0;
            const badge = isPaid ? '<span class="badge-paid">Payé</span>' : '<span class="badge-unpaid">En attente</span>';
            const booksReceived = student.books?.length || 0;
            return `<tr>
                <td style="color:var(--muted)">${idx + 1}</td>
                <td style="font-weight:500">${escapeHtml(student.name)}</td>
                <td><span class="class-badge">${escapeHtml(student.class || '—')}</span></td>
                <td>${booksReceived} livre(s)</td>
                <td style="color:var(--green); font-weight:600">${student.paid || 0} DH</td>
                <td style="color:${student.remaining > 0 ? 'var(--red)' : 'var(--muted)'}">${student.remaining || 0} DH</td>
                <td style="font-size:12px">${student.delivery || '—'}</td>
                <td>${student.phone || '—'}</td>
                <td>${badge}</td>
                <td><div class="action-btns">
                    <button class="btn-icon" onclick="editStudent(${student.id})">✏️</button>
                    <button class="btn-icon" onclick="confirmDeleteStudent(${student.id})">🗑️</button>
                </div></td>
            </tr>`;
        }).join('');
    }
    
    // Update class filter dropdown
    updateClassFilters();
}

function openStudentModal(editMode = false) {
    document.getElementById('studentModalTitle').textContent = editMode ? 'Modifier Élève' : 'Ajouter un Élève';
    document.getElementById('studentName').value = '';
    document.getElementById('studentPhone').value = '';
    document.getElementById('studentDelivery').value = '';
    document.getElementById('studentPaid').value = 0;
    document.getElementById('studentRemaining').value = 0;
    document.getElementById('studentRemarks').value = '';
    
    // Populate class dropdown
    const classSelect = document.getElementById('studentClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner une classe --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    // Populate books checklist based on selected class (default: all books)
    populateBooksChecklist('');
    
    document.getElementById('studentModal').classList.add('open');
}

function populateBooksChecklist(className = null) {
    const container = document.getElementById('studentBooksList');
    let booksToShow = getBooks();
    
    if (className) {
        booksToShow = booksToShow.filter(book => book.class === className);
    }
    
    if (booksToShow.length === 0) {
        container.innerHTML = '<div style="color:var(--muted); padding:10px; text-align:center;">Aucun livre disponible pour cette classe</div>';
    } else {
        container.innerHTML = booksToShow.map(book => `
            <label class="checkbox-item">
                <input type="checkbox" value="${escapeHtml(book.title)}" data-book-id="${book.id}">
                ${escapeHtml(book.title)} (${book.class})
            </label>
        `).join('');
    }
}

// Listen to class change to update available books
document.addEventListener('DOMContentLoaded', () => {
    const classSelect = document.getElementById('studentClass');
    if (classSelect) {
        classSelect.addEventListener('change', (e) => {
            populateBooksChecklist(e.target.value);
        });
    }
});

async function saveStudentFromModal() {
    const name = document.getElementById('studentName').value.trim();
    if (!name) { 
        showToast('Le nom est obligatoire'); 
        return; 
    }
    
    const selectedClass = document.getElementById('studentClass').value;
    if (!selectedClass) { 
        showToast('Veuillez sélectionner une classe'); 
        return; 
    }
    
    const selectedBooks = [];
    document.querySelectorAll('#studentBooksList input:checked').forEach(cb => {
        selectedBooks.push(cb.value);
    });
    
    const studentData = {
        name: name,
        class: selectedClass,
        phone: document.getElementById('studentPhone').value,
        delivery: document.getElementById('studentDelivery').value,
        paid: parseFloat(document.getElementById('studentPaid').value) || 0,
        remaining: parseFloat(document.getElementById('studentRemaining').value) || 0,
        remarks: document.getElementById('studentRemarks').value,
        books: selectedBooks
    };
    
    try {
        if (currentEditStudentId) {
            await updateStudent(currentEditStudentId, studentData);
            showToast('Élève modifié et synchronisé ✅');
        } else {
            await addStudent(studentData);
            showToast('Élève ajouté et synchronisé ✅');
        }
        
        closeStudentModal();
        
        // Refresh all displays
        await renderStudents();
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderClasses === 'function') renderClasses();
        
    } catch (error) {
        console.error('Error saving student:', error);
        showToast('Erreur lors de la sauvegarde');
    }
}

async function editStudent(id) {
    const student = getStudents().find(s => s.id === id);
    if (!student) return;
    currentEditStudentId = id;
    
    document.getElementById('studentModalTitle').textContent = 'Modifier Élève';
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentDelivery').value = student.delivery || '';
    document.getElementById('studentPaid').value = student.paid || 0;
    document.getElementById('studentRemaining').value = student.remaining || 0;
    document.getElementById('studentRemarks').value = student.remarks || '';
    
    const classSelect = document.getElementById('studentClass');
    classSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}" ${c.name === student.class ? 'selected' : ''}>${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    populateBooksChecklist(student.class);
    
    // Check the books the student has
    setTimeout(() => {
        document.querySelectorAll('#studentBooksList input').forEach(cb => {
            if (student.books?.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }, 100);
    
    document.getElementById('studentModal').classList.add('open');
}

async function confirmDeleteStudent(id) {
    const student = getStudents().find(s => s.id === id);
    if (!student) return;
    
    if (confirm(`Supprimer définitivement "${student.name}" ?\n\nCette action est irréversible.`)) {
        try {
            await deleteStudent(id);
            await renderStudents();
            if (typeof renderStats === 'function') renderStats();
            if (typeof renderClasses === 'function') renderClasses();
            showToast('Élève supprimé ✅');
        } catch (error) {
            console.error('Error deleting student:', error);
            showToast('Erreur lors de la suppression');
        }
    }
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('open');
    currentEditStudentId = null;
}

// Helper: Get payment summary for a class
function getClassPaymentSummary(className) {
    const students = getStudentsByClass(className);
    const total = students.length;
    const paid = students.filter(s => s.remaining === 0 && s.paid > 0).length;
    const partial = students.filter(s => s.remaining > 0 && s.paid > 0).length;
    const unpaid = students.filter(s => s.paid === 0).length;
    
    return { total, paid, partial, unpaid };
}
