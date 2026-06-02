// classes.js - Class management logic

let currentEditClassId = null;

function renderClasses() {
    const classesData = getClasses().map(cls => ({
        ...cls,
        studentCount: getStudentsByClass(cls.name).length,
        bookCount: getBooksByClass(cls.name).length
    }));
    
    document.getElementById('classCount').innerHTML = `${classesData.length} classe(s)`;
    
    const tbody = document.getElementById('classesList');
    if (classesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune classe. Cliquez sur "+ Ajouter Classe" pour commencer!</td></tr>';
    } else {
        tbody.innerHTML = classesData.map((cls, idx) => `<tr>
            <td>${idx + 1}</td>
            <td style="font-weight:500">${escapeHtml(cls.name)}</td>
            <td>${escapeHtml(cls.level)}</td>
            <td>${cls.studentCount} élève(s)</td>
            <td>${cls.bookCount} livre(s)</td>
            <td><div class="action-btns">
                <button class="btn-icon" onclick="editClass(${cls.id})">✏️</button>
                <button class="btn-icon" onclick="confirmDeleteClass(${cls.id})">🗑️</button>
            </div></td>
        </tr>`).join('');
    }
}

function openClassModal(editMode = false) {
    document.getElementById('classModalTitle').textContent = editMode ? 'Modifier Classe' : 'Ajouter une Classe';
    document.getElementById('className').value = '';
    document.getElementById('classLevel').value = 'Primaire';
    document.getElementById('classModal').classList.add('open');
}

function saveClassFromModal() {
    const name = document.getElementById('className').value.trim();
    if (!name) { showToast('Le nom de la classe est obligatoire'); return; }
    
    const classData = {
        name: name,
        level: document.getElementById('classLevel').value
    };
    
    if (currentEditClassId) {
        // Check if students are in this class
        const oldClass = getClasses().find(c => c.id === currentEditClassId);
        const studentsInClass = getStudentsByClass(oldClass.name);
        if (studentsInClass.length > 0 && oldClass.name !== name) {
            if (!confirm(`${studentsInClass.length} élève(s) sont dans cette classe. Changer le nom affectera ces élèves. Continuer ?`)) {
                return;
            }
            // Update students' class reference
            studentsInClass.forEach(student => {
                updateStudent(student.id, { class: name });
            });
        }
        updateClass(currentEditClassId, classData);
        showToast('Classe modifiée ✅');
    } else {
        addClass(classData);
        showToast('Classe ajoutée ✅');
    }
    
    closeClassModal();
    renderClasses();
    renderStudents(); // Update student display
    renderBooks(); // Update book display
}

function editClass(id) {
    const cls = getClasses().find(c => c.id === id);
    if (!cls) return;
    currentEditClassId = id;
    
    document.getElementById('classModalTitle').textContent = 'Modifier Classe';
    document.getElementById('className').value = cls.name;
    document.getElementById('classLevel').value = cls.level;
    document.getElementById('classModal').classList.add('open');
}

function confirmDeleteClass(id) {
    const cls = getClasses().find(c => c.id === id);
    const studentsInClass = getStudentsByClass(cls.name);
    
    if (studentsInClass.length > 0) {
        alert(`Impossible de supprimer la classe "${cls.name}" car ${studentsInClass.length} élève(s) y sont inscrits.`);
        return;
    }
    
    if (confirm(`Supprimer la classe ${cls.name} ?`)) {
        deleteClass(id);
        renderClasses();
        showToast('Classe supprimée');
    }
}

function closeClassModal() {
    document.getElementById('classModal').classList.remove('open');
    currentEditClassId = null;
}
