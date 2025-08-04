document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('add-edit-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const moduleForm = document.getElementById('module-form');
    const modulesTableBody = document.querySelector('#modules-table tbody');

    let editingModuleId = null; // Для хранения ID редактируемого документа Firebase

    // Асинхронная функция для загрузки модулей
    async function loadModules() {
        const snapshot = await db.collection('modules').get();
        const modules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderTable(modules);
        return modules; // Возвращаем для поиска
    }

    function renderTable(data) {
        modulesTableBody.innerHTML = '';
        data.forEach(module => {
            const row = modulesTableBody.insertRow();
            row.innerHTML = `
                <td>${module.date || ''}</td>
                <td>${module.object || ''}</td>
                <td>${module.pixel || ''}</td>
                <td>${module.manufacturer || ''}</td>
                <td>${module.chipDecoder || ''}</td>
                <td>${module.fullName || ''}</td>
                <td>${module.note || ''}</td>
                <td>
                    <button class="edit-btn" data-id="${module.id}">Редактировать</button>
                    <button class="delete-btn" data-id="${module.id}">Удалить</button>
                </td>
            `;
        });
    }

    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        moduleForm.reset();
        editingModuleId = null;
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    moduleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newModuleData = {
            date: document.getElementById('date').value,
            object: document.getElementById('object').value,
            pixel: document.getElementById('pixel').value,
            manufacturer: document.getElementById('manufacturer').value,
            chipDecoder: document.getElementById('chip-decoder').value,
            fullName: document.getElementById('full-name').value,
            note: document.getElementById('note').value
        };

        if (editingModuleId) {
            await db.collection('modules').doc(editingModuleId).update(newModuleData);
        } else {
            await db.collection('modules').add(newModuleData);
        }
        
        modal.style.display = 'none';
        loadModules(); // Перезагружаем данные после сохранения
    });

    modulesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-btn')) {
            editingModuleId = event.target.dataset.id;
            const doc = await db.collection('modules').doc(editingModuleId).get();
            const moduleToEdit = doc.data();

            document.getElementById('date').value = moduleToEdit.date || '';
            document.getElementById('object').value = moduleToEdit.object || '';
            document.getElementById('pixel').value = moduleToEdit.pixel || '';
            document.getElementById('manufacturer').value = moduleToEdit.manufacturer || '';
            document.getElementById('chip-decoder').value = moduleToEdit.chipDecoder || '';
            document.getElementById('full-name').value = moduleToEdit.fullName || '';
            document.getElementById('note').value = moduleToEdit.note || '';

            modal.style.display = 'block';
        } else if (event.target.classList.contains('delete-btn')) {
            const idToDelete = event.target.dataset.id;
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                await db.collection('modules').doc(idToDelete).delete();
                loadModules(); // Перезагружаем данные после удаления
            }
        }
    });

    searchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.toLowerCase();
        const allModules = await loadModules(); // Получаем все модули для поиска
        const filteredModules = allModules.filter(module => {
            for (const key in module) {
                if (key === 'date') {
                    if (module[key].includes(searchTerm)) {
                        return true;
                    }
                    const [year, month, day] = (module[key] || '').split('-');
                    if (searchTerm.length === 7 && searchTerm === `${year}-${month}` || searchTerm.length === 10 && searchTerm === `${year}-${month}-${day}`) {
                        return true;
                    }
                } else if (String(module[key]).toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
            return false;
        });
        renderTable(filteredModules);
    });

    searchInput.addEventListener('keyup', () => {
        if (searchInput.value === '') {
            loadModules(); // Перезагружаем все модули, если строка поиска пуста
        }
    });

    loadModules(); // Начальная загрузка данных при запуске
}); 