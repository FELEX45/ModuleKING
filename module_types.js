document.addEventListener('DOMContentLoaded', () => {
    // Элементы для модуля типа
    const addModuleTypeBtn = document.getElementById('add-module-type-btn');
    const moduleTypeModal = document.getElementById('add-edit-module-type-modal');
    const closeModalTypeBtn = moduleTypeModal.querySelector('.close-button');
    const moduleTypeForm = document.getElementById('module-type-form');
    const moduleTypesTableBody = document.querySelector('#module-types-table tbody');

    let editingModuleTypeId = null; // Для редактирования типа модуля

    // --- Функции для взаимодействия с Firestore ---

    // Загрузка типов модулей
    async function loadModuleTypes() {
        const snapshot = await db.collection('module_types').get();
        const moduleTypes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderModuleTypesTable(moduleTypes);
        return moduleTypes; // Возвращаем для использования в других местах
    }

    // Рендеринг таблицы типов модулей
    function renderModuleTypesTable(data) {
        moduleTypesTableBody.innerHTML = '';
        data.forEach(type => {
            const row = moduleTypesTableBody.insertRow();
            row.innerHTML = `
                <td>${type.pixel || ''}</td>
                <td>${type.manufacturer || ''}</td>
                <td>${type.chipDecoder || ''}</td>
                <td>${type.fullName || ''}</td>
                <td>
                    <button class="edit-module-type-btn" data-id="${type.id}">Редактировать</button>
                    <button class="delete-module-type-btn" data-id="${type.id}">Удалить</button>
                </td>
            `;
        });
    }

    // --- Обработчики событий ---

    addModuleTypeBtn.addEventListener('click', () => {
        moduleTypeModal.style.display = 'block';
        moduleTypeForm.reset();
        editingModuleTypeId = null;
    });

    closeModalTypeBtn.addEventListener('click', () => {
        moduleTypeModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == moduleTypeModal) {
            moduleTypeModal.style.display = 'none';
        }
    });

    moduleTypeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newModuleTypeData = {
            pixel: document.getElementById('pixel-type').value,
            manufacturer: document.getElementById('manufacturer-type').value,
            chipDecoder: document.getElementById('chip-decoder-type').value,
            fullName: document.getElementById('full-name-type').value
        };

        if (editingModuleTypeId) {
            await db.collection('module_types').doc(editingModuleTypeId).update(newModuleTypeData);
        } else {
            await db.collection('module_types').add(newModuleTypeData);
        }

        moduleTypeModal.style.display = 'none';
        loadModuleTypes(); // Перезагружаем типы после сохранения
    });

    moduleTypesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-module-type-btn')) {
            editingModuleTypeId = event.target.dataset.id;
            const doc = await db.collection('module_types').doc(editingModuleTypeId).get();
            const moduleTypeToEdit = doc.data();

            document.getElementById('pixel-type').value = moduleTypeToEdit.pixel || '';
            document.getElementById('manufacturer-type').value = moduleTypeToEdit.manufacturer || '';
            document.getElementById('chip-decoder-type').value = moduleTypeToEdit.chipDecoder || '';
            document.getElementById('full-name-type').value = moduleTypeToEdit.fullName || '';

            moduleTypeModal.style.display = 'block';
        } else if (event.target.classList.contains('delete-module-type-btn')) {
            const idToDelete = event.target.dataset.id;
            if (confirm('Вы уверены, что хотите удалить этот тип модуля?')) {
                await db.collection('module_types').doc(idToDelete).delete();
                loadModuleTypes(); // Перезагружаем типы после удаления
            }
        }
    });

    // Кнопка "Главное меню"
    const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
    if (backToMainMenuBtn) {
        backToMainMenuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    loadModuleTypes(); // Начальная загрузка типов модулей при запуске страницы
}); 