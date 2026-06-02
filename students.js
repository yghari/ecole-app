// students.js - Student management logic

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
                <td>${idx + 1}</td>
                <td style="font-weight:500">${escapeHtml(student.name)}</td>
                <td><span class="class-badge">${escapeHtml(student.class)}</span></td>
                <td>${booksReceived} livre(s)</td>
                <td style="color:var(--green)">${student.paid || 0} DH</td>
                <td style="color:${student.remaining > 0 ? 'var(--red)' : 'var(--muted)'}">${student.remaining || 0} DH</td>
                <td>${student.delivery || '—'}</td>
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
    const uniqueClasses = [...new Set(getStudents().map(s => s.class).filter(c => c))];
    const classSelect = document.getElementById('classFilter');
    if (classSelect) {
        const currentVal = classSelect.value;
        classSelect.innerHTML = '<option value="all">📚 Toutes les classes</option>' + 
            uniqueClasses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        if (uniqueClasses.includes(currentVal)) classSelect.value = currentVal;
    }
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
    classSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
        getClasses().map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.level})</option>`).join('');
    
    // Populate books checklist for the selected class
    populateBooksChecklist();
    
    document.getElementById('studentModal').classList.add('open');
}

function populateBooksChecklist(className = null) {
    const container = document.getElementById('studentBooksList');
    const booksToShow = className ? getBooksByClass(className) : getBooks();
    container.innerHTML = booksToShow.map(book => `
        <label class="checkbox-item">
            <input type="checkbox" value="${escapeHtml(book.title)}" data-book-id="${book.id}">
            ${escapeHtml(book.title)} (${book.class})
        </label>
    `).join('');
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

function saveStudentFromModal() {
    const name = document.getElementById('studentName').value.trim();
    if (!name) { showToast('Le nom est obligatoire'); return; }
    
    const selectedBooks = [];
    document.querySelectorAll('#studentBooksList input:checked').forEach(cb => {
        selectedBooks.push(cb.value);
    });
    
    const studentData = {
        name: name,
        class: document.getElementById('studentClass').value,
        phone: document.getElementById('studentPhone').value,
        delivery: document.getElementById('studentDelivery').value,
        paid: parseFloat(document.getElementById('studentPaid').value) || 0,
        remaining: parseFloat(document.getElementById('studentRemaining').value) || 0,
        remarks: document.getElementById('studentRemarks').value,
        books: selectedBooks
    };
    
    if (currentEditStudentId) {
        updateStudent(currentEditStudentId, studentData);
        showToast('Élève modifié ✅');
    } else {
        addStudent(studentData);
        showToast('Élève ajouté ✅');
    }
    
    closeStudentModal();
    renderStudents();
    renderStats();
    renderClasses();
}

function editStudent(id) {
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
        getClasses().map(c => `<option value="${escapeHtml(c.name)}" ${c.name === student.class ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    
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

function confirmDeleteStudent(id) {
    const student = getStudents().find(s => s.id === id);
    if (confirm(`Supprimer ${student.name} ?`)) {
        deleteStudent(id);
        renderStudents();
        renderStats();
        renderClasses();
        showToast('Élève supprimé');
    }
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('open');
    currentEditStudentId = null;
}
