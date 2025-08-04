document.addEventListener('DOMContentLoaded', () => {
    // Элементы для модуля установки (старый 'module-form')
    const addInstanceBtn = document.getElementById('add-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const moduleInstanceModal = document.getElementById('add-edit-module-instance-modal');
    const closeModalInstanceBtn = moduleInstanceModal.querySelector('.close-button');
    const moduleInstanceForm = document.getElementById('module-instance-form');
    const modulesTableBody = document.querySelector('#modules-table tbody');

    // Новые элементы для выбора типа модуля
    const selectedModuleTypeDisplay = document.getElementById('selected-module-type-display');
    const selectedModuleTypeId = document.getElementById('selected-module-type-id');
    const selectModuleTypeBtn = document.getElementById('select-module-type-btn');
    const selectModuleTypeModal = document.getElementById('select-module-type-modal');
    const closeModalSelectTypeBtn = selectModuleTypeModal.querySelector('.close-button');
    const selectModuleTypesTableBody = document.querySelector('#select-module-types-table tbody');

    // Элементы для отображения информации о выбранном типе
    const selectedModuleTypeInfo = document.getElementById('selected-module-type-info');
    const infoPixel = document.getElementById('info-pixel');
    const infoManufacturer = document.getElementById('info-manufacturer');
    const infoChipDecoder = document.getElementById('info-chip-decoder');
    const infoFullName = document.getElementById('info-full-name');

    let editingModuleInstanceId = null; // Для редактирования установки модуля
    let moduleTypes = []; // Для хранения загруженных типов модулей

    // --- Функции для взаимодействия с Firestore ---

    // Загрузка типов модулей (для заполнения таблицы выбора)
    async function loadModuleTypes() {
        const snapshot = await db.collection('module_types').get();
        moduleTypes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderSelectModuleTypesTable(moduleTypes); // Рендерим в модалке выбора
    }

    // Рендеринг таблицы типов модулей для выбора
    function renderSelectModuleTypesTable(data) {
        selectModuleTypesTableBody.innerHTML = '';
        data.forEach(type => {
            const row = selectModuleTypesTableBody.insertRow();
            row.innerHTML = `
                <td>${type.pixel || ''}</td>
                <td>${type.manufacturer || ''}</td>
                <td>${type.chipDecoder || ''}</td>
                <td>${type.fullName || ''}</td>
                <td>
                    <button class="select-type-btn" data-id="${type.id}" 
                            data-pixel="${type.pixel || ''}"
                            data-manufacturer="${type.manufacturer || ''}"
                            data-chip-decoder="${type.chipDecoder || ''}"
                            data-full-name="${type.fullName || ''}">
                        Выбрать
                    </button>
                </td>
            `;
        });
    }

    // Отображение информации о выбранном типе модуля в форме установки
    function displaySelectedModuleTypeInfo(moduleTypeId) {
        const selectedType = moduleTypes.find(type => type.id === moduleTypeId);
        if (selectedType) {
            infoPixel.textContent = selectedType.pixel || '';
            infoManufacturer.textContent = selectedType.manufacturer || '';
            infoChipDecoder.textContent = selectedType.chipDecoder || '';
            infoFullName.textContent = selectedType.fullName || '';
            selectedModuleTypeInfo.style.display = 'block';
        } else {
            infoPixel.textContent = '';
            infoManufacturer.textContent = '';
            infoChipDecoder.textContent = '';
            infoFullName.textContent = '';
            selectedModuleTypeInfo.style.display = 'none';
        }
    }

    // Загрузка установок модулей (остается без изменений, использует moduleTypes)
    async function loadModules() {
        const snapshot = await db.collection('modules').get();
        await loadModuleTypes(); // Всегда загружаем типы, чтобы они были актуальны

        const modules = snapshot.docs.map(doc => {
            const data = doc.data();
            const moduleType = moduleTypes.find(type => type.id === data.moduleTypeId);
            return {
                id: doc.id,
                ...data,
                moduleType: moduleType || {} 
            };
        });
        renderTable(modules);
        return modules;
    }

    // Рендеринг таблицы установок модулей (без изменений)
    function renderTable(data) {
        modulesTableBody.innerHTML = '';
        data.forEach(module => {
            const row = modulesTableBody.insertRow();
            row.innerHTML = `
                <td>${module.date || ''}</td>
                <td>${module.object || ''}</td>
                <td>${module.moduleType.pixel || ''}</td>
                <td>${module.moduleType.manufacturer || ''}</td>
                <td>${module.moduleType.chipDecoder || ''}</td>
                <td>${module.moduleType.fullName || ''}</td>
                <td>${module.maps || ''}</td>
                <td>${module.screenSize || ''}</td>
                <td>${module.orderManager || ''}</td>
                <td>${module.note || ''}</td>
                <td>
                    <button class="edit-instance-btn" data-id="${module.id}">Редактировать</button>
                    <button class="delete-instance-btn" data-id="${module.id}">Удалить</button>
                </td>
            `;
        });
    }

    // --- Обработчики событий --- 

    // Открытие модального окна установки
    addInstanceBtn.addEventListener('click', () => {
        moduleInstanceModal.style.display = 'block';
        moduleInstanceForm.reset();
        editingModuleInstanceId = null;
        selectedModuleTypeDisplay.value = ''; // Очищаем отображение
        selectedModuleTypeId.value = ''; // Очищаем ID
        displaySelectedModuleTypeInfo(null); // Скрываем информацию о типе
        loadModuleTypes(); // Загружаем типы для модалки выбора
    });

    // Закрытие модального окна установки
    closeModalInstanceBtn.addEventListener('click', () => {
        moduleInstanceModal.style.display = 'none';
    });

    // Открытие модального окна выбора типа модуля
    selectModuleTypeBtn.addEventListener('click', () => {
        selectModuleTypeModal.style.display = 'block';
        loadModuleTypes(); // Убедимся, что таблица выбора типов актуальна
    });

    // Закрытие модального окна выбора типа модуля
    closeModalSelectTypeBtn.addEventListener('click', () => {
        selectModuleTypeModal.style.display = 'none';
    });

    // Закрытие модальных окон по клику вне их
    window.addEventListener('click', (event) => {
        if (event.target == moduleInstanceModal) {
            moduleInstanceModal.style.display = 'none';
        } else if (event.target == selectModuleTypeModal) {
            selectModuleTypeModal.style.display = 'none';
        }
    });

    // Обработка выбора типа модуля из таблицы в модальном окне
    selectModuleTypesTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('select-type-btn')) {
            const btn = event.target;
            const typeId = btn.dataset.id;
            const typeFullName = btn.dataset.fullName || `${btn.dataset.manufacturer} ${btn.dataset.pixel}`;

            selectedModuleTypeId.value = typeId;
            selectedModuleTypeDisplay.value = typeFullName;

            displaySelectedModuleTypeInfo(typeId); // Отображаем детальную информацию
            selectModuleTypeModal.style.display = 'none'; // Закрываем модальное окно выбора
        }
    });

    // Отправка формы установки модуля
    moduleInstanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newModuleInstanceData = {
            date: document.getElementById('date').value,
            object: document.getElementById('object').value,
            moduleTypeId: selectedModuleTypeId.value, // Берем ID из скрытого поля
            screenSize: document.getElementById('screen-size').value,
            orderManager: document.getElementById('order-manager').value,
            maps: document.getElementById('maps').value,
            note: document.getElementById('note').value
        };

        if (editingModuleInstanceId) {
            await db.collection('modules').doc(editingModuleInstanceId).update(newModuleInstanceData);
        } else {
            await db.collection('modules').add(newModuleInstanceData);
        }
        
        moduleInstanceModal.style.display = 'none';
        loadModules(); 
    });

    // Делегирование событий для кнопок редактирования/удаления в таблице установок
    modulesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-instance-btn')) {
            editingModuleInstanceId = event.target.dataset.id;
            const doc = await db.collection('modules').doc(editingModuleInstanceId).get();
            const moduleToEdit = doc.data();

            document.getElementById('date').value = moduleToEdit.date || '';
            document.getElementById('object').value = moduleToEdit.object || '';
            selectedModuleTypeId.value = moduleToEdit.moduleTypeId || ''; // Устанавливаем ID

            // Находим выбранный тип модуля для отображения его названия
            const selectedType = moduleTypes.find(type => type.id === moduleToEdit.moduleTypeId);
            if (selectedType) {
                selectedModuleTypeDisplay.value = selectedType.fullName || `${selectedType.manufacturer} ${selectedType.pixel}`;
            } else {
                selectedModuleTypeDisplay.value = '';
            }
            
            document.getElementById('screen-size').value = moduleToEdit.screenSize || '';
            document.getElementById('order-manager').value = moduleToEdit.orderManager || '';
            document.getElementById('maps').value = moduleToEdit.maps || '';
            document.getElementById('note').value = moduleToEdit.note || '';

            moduleInstanceModal.style.display = 'block';
            displaySelectedModuleTypeInfo(moduleToEdit.moduleTypeId); // Отображаем информацию о типе

        } else if (event.target.classList.contains('delete-instance-btn')) {
            const idToDelete = event.target.dataset.id;
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                await db.collection('modules').doc(idToDelete).delete();
                loadModules(); 
            }
        }
    });

    // Логика поиска (будет искать по всем полям, включая поля типа модуля)
    searchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.toLowerCase();
        const allModules = await loadModules();
        const filteredModules = allModules.filter(module => {
            for (const key of ['date', 'object', 'screenSize', 'orderManager', 'maps', 'note']) {
                if (String(module[key] || '').toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
            if (module.moduleType) {
                for (const key of ['pixel', 'manufacturer', 'chipDecoder', 'fullName']) {
                    if (String(module.moduleType[key] || '').toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }
            if (module.date) {
                if (module.date.includes(searchTerm)) {
                    return true;
                }
                const [year, month, day] = (module.date || '').split('-');
                if (searchTerm.length === 7 && searchTerm === `${year}-${month}` || searchTerm.length === 10 && searchTerm === `${year}-${month}-${day}`) {
                    return true;
                }
            }
            return false;
        });
        renderTable(filteredModules);
    });

    searchInput.addEventListener('keyup', () => {
        if (searchInput.value === '') {
            loadModules(); 
        }
    });

    // Кнопка "Главное меню"
    const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
    if (backToMainMenuBtn) {
        backToMainMenuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    loadModules(); // Начальная загрузка данных при запуске
}); 