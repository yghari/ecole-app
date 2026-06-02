async function saveStudentFromModal() {
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
        await updateStudent(currentEditStudentId, studentData);
        showToast('Élève modifié ✅');
    } else {
        await addStudent(studentData);
        showToast('Élève ajouté ✅');
    }
    
    closeStudentModal();
    renderStudents();
    renderStats();
    renderClasses();
}
