document.addEventListener('DOMContentLoaded', () => {
    // Основные элементы интерфейса
    const mainMenu = document.getElementById('main-menu');
    const openAccountingBtn = document.getElementById('open-accounting-btn');
    const openModuleTypeFormBtn = document.getElementById('open-module-type-form-btn');
    const accountingSection = document.getElementById('accounting-section');

    // Элементы для модуля установки (старый 'module-form')
    const addInstanceBtn = document.getElementById('add-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const moduleInstanceModal = document.getElementById('add-edit-module-instance-modal');
    const closeModalInstanceBtn = moduleInstanceModal.querySelector('.close-button');
    const moduleInstanceForm = document.getElementById('module-instance-form');
    const modulesTableBody = document.querySelector('#modules-table tbody');
    const moduleTypeSelect = document.getElementById('module-type-select');
    const selectedModuleTypeInfo = document.getElementById('selected-module-type-info');
    const infoPixel = document.getElementById('info-pixel');
    const infoManufacturer = document.getElementById('info-manufacturer');
    const infoChipDecoder = document.getElementById('info-chip-decoder');
    const infoFullName = document.getElementById('info-full-name');

    // Элементы для модуля типа (новая форма)
    const moduleTypeModal = document.getElementById('add-edit-module-type-modal');
    const closeModalTypeBtn = moduleTypeModal.querySelector('.close-button-type');
    const moduleTypeForm = document.getElementById('module-type-form');

    let editingModuleInstanceId = null; // Для редактирования установки модуля
    let editingModuleTypeId = null; // Для редактирования типа модуля
    let moduleTypes = []; // Для хранения загруженных типов модулей

    // --- Функции для взаимодействия с Firestore ---

    // Загрузка типов модулей
    async function loadModuleTypes() {
        const snapshot = await db.collection('module_types').get();
        moduleTypes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        populateModuleTypeSelect();
    }

    // Заполнение выпадающего списка типов модулей
    function populateModuleTypeSelect() {
        moduleTypeSelect.innerHTML = '<option value="">Выберите тип модуля</option>';
        moduleTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.fullName || `${type.manufacturer} ${type.pixel}`; // Отображаем полное название или комбинацию
            moduleTypeSelect.appendChild(option);
        });
    }

    // Отображение информации о выбранном типе модуля
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

    // Загрузка установок модулей
    async function loadModules() {
        const snapshot = await db.collection('modules').get();
        // Загружаем все типы модулей для сопоставления
        await loadModuleTypes(); 

        const modules = snapshot.docs.map(doc => {
            const data = doc.data();
            const moduleType = moduleTypes.find(type => type.id === data.moduleTypeId);
            return {
                id: doc.id,
                ...data,
                moduleType: moduleType || {} // Добавляем данные типа модуля или пустой объект
            };
        });
        renderTable(modules);
        return modules; // Возвращаем для поиска
    }

    // Рендеринг таблицы установок модулей
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

    // --- Обработчики событий для нового меню ---

    openAccountingBtn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        accountingSection.classList.remove('hidden');
        loadModules(); // Загружаем данные учета при открытии раздела
    });

    openModuleTypeFormBtn.addEventListener('click', () => {
        moduleTypeModal.style.display = 'block';
        moduleTypeForm.reset();
        editingModuleTypeId = null;
    });

    // --- Обработчики событий для модального окна ТИПА модуля ---

    closeModalTypeBtn.addEventListener('click', () => {
        moduleTypeModal.style.display = 'none';
        // Здесь можно добавить обновление списка типов модулей, если он нужен в другом месте
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
        // Если мы находимся в разделе учета, также обновим таблицу, т.к. новые типы могут быть использованы
        if (!accountingSection.classList.contains('hidden')) {
            loadModules();
        }
    });

    // --- Обработчики событий для модального окна УСТАНОВКИ модуля ---

    // Обновление списка типов при открытии модалки установки
    addInstanceBtn.addEventListener('click', () => {
        moduleInstanceModal.style.display = 'block';
        moduleInstanceForm.reset();
        editingModuleInstanceId = null;
        populateModuleTypeSelect(); // Убедимся, что список типов актуален
        displaySelectedModuleTypeInfo(null); // Очищаем информацию о типе при открытии новой формы
    });

    closeModalInstanceBtn.addEventListener('click', () => {
        moduleInstanceModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == moduleInstanceModal) {
            moduleInstanceModal.style.display = 'none';
        } else if (event.target == moduleTypeModal) {
            moduleTypeModal.style.display = 'none';
        }
    });

    moduleInstanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newModuleInstanceData = {
            date: document.getElementById('date').value,
            object: document.getElementById('object').value,
            moduleTypeId: document.getElementById('module-type-select').value, // Сохраняем только ID типа
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
        loadModules(); // Перезагружаем данные после сохранения
    });

    // Делегирование событий для кнопок редактирования/удаления в таблице установок
    modulesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-instance-btn')) {
            editingModuleInstanceId = event.target.dataset.id;
            const doc = await db.collection('modules').doc(editingModuleInstanceId).get();
            const moduleToEdit = doc.data();

            document.getElementById('date').value = moduleToEdit.date || '';
            document.getElementById('object').value = moduleToEdit.object || '';
            document.getElementById('module-type-select').value = moduleToEdit.moduleTypeId || '';
            document.getElementById('screen-size').value = moduleToEdit.screenSize || '';
            document.getElementById('order-manager').value = moduleToEdit.orderManager || '';
            document.getElementById('maps').value = moduleToEdit.maps || '';
            document.getElementById('note').value = moduleToEdit.note || '';

            moduleInstanceModal.style.display = 'block';
            populateModuleTypeSelect(); // Обновляем список типов при открытии модалки
            displaySelectedModuleTypeInfo(moduleToEdit.moduleTypeId); // Отображаем информацию о типе

        } else if (event.target.classList.contains('delete-instance-btn')) {
            const idToDelete = event.target.dataset.id;
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                await db.collection('modules').doc(idToDelete).delete();
                loadModules(); // Перезагружаем данные после удаления
            }
        }
    });

    // Логика поиска (будет искать по всем полям, включая поля типа модуля)
    searchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.toLowerCase();
        const allModules = await loadModules(); // Получаем все модули для поиска
        const filteredModules = allModules.filter(module => {
            // Поиск по полям установки
            for (const key of ['date', 'object', 'screenSize', 'orderManager', 'maps', 'note']) {
                if (String(module[key] || '').toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
            // Поиск по полям типа модуля
            if (module.moduleType) {
                for (const key of ['pixel', 'manufacturer', 'chipDecoder', 'fullName']) {
                    if (String(module.moduleType[key] || '').toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }
            // Поиск по дате (месяц/день)
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
            loadModules(); // Перезагружаем все модули, если строка поиска пуста
        }
    });

    // Слушатель для изменения выбранного типа модуля
    moduleTypeSelect.addEventListener('change', (event) => {
        displaySelectedModuleTypeInfo(event.target.value);
    });

    // Инициализация при загрузке страницы: загружаем типы модулей
    loadModuleTypes();
}); 