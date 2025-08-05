document.addEventListener('DOMContentLoaded', () => {
    // Элементы для модуля типа
    const addModuleTypeBtn = document.getElementById('add-module-type-btn');
    const moduleTypeModal = document.getElementById('add-edit-module-type-modal');
    const closeModalTypeBtn = moduleTypeModal.querySelector('.close-button');
    const moduleTypeForm = document.getElementById('module-type-form');
    const moduleTypesTableBody = document.querySelector('#module-types-table tbody');

    // Элементы для фото
    const modulePhotoInput = document.getElementById('module-type-photo');
    const photoPreview = document.getElementById('photo-type-preview');

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
            const photoHtml = type.photoURL
                ? `<img src="${type.photoURL}" alt="Фото модуля" style="width: 100px; height: auto; cursor: pointer;" onclick="window.open('${type.photoURL}')">`
                : 'Нет фото';

            row.innerHTML = `
                <td>${type.pixel || ''}</td>
                <td>${type.manufacturer || ''}</td>
                <td>${type.chipDecoder || ''}</td>
                <td>${type.fullName || ''}</td>
                <td>${photoHtml}</td>
                <td>
                    <button class="edit-module-type-btn" data-id="${type.id}">Редактировать</button>
                    <button class="delete-module-type-btn" data-id="${type.id}" data-photo-url="${type.photoURL || ''}">Удалить</button>
                </td>
            `;
        });
    }

    // --- Обработчики событий ---

    // Предпросмотр изображения при выборе файла
    modulePhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.src = '#';
            photoPreview.style.display = 'none';
        }
    });

    addModuleTypeBtn.addEventListener('click', () => {
        moduleTypeModal.style.display = 'block';
        moduleTypeForm.reset();
        editingModuleTypeId = null;
        photoPreview.src = '#';
        photoPreview.style.display = 'none';
        modulePhotoInput.value = '';
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

        const file = modulePhotoInput.files[0];
        let photoURL = document.getElementById('photo-type-preview').src;

        if (file) {
            const filePath = `module_type_photos/${Date.now()}_${file.name}`;
            const fileRef = storage.ref().child(filePath);
            await fileRef.put(file);
            photoURL = await fileRef.getDownloadURL();

            if (editingModuleTypeId) {
                const doc = await db.collection('module_types').doc(editingModuleTypeId).get();
                const oldPhotoURL = doc.data().photoURL;
                if (oldPhotoURL) {
                    try {
                        const oldPhotoRef = storage.refFromURL(oldPhotoURL);
                        await oldPhotoRef.delete();
                    } catch (error) {
                        console.error("Не удалось удалить старое фото: ", error);
                    }
                }
            }
        }

        const moduleTypeData = {
            pixel: document.getElementById('pixel-type').value,
            manufacturer: document.getElementById('manufacturer-type').value,
            chipDecoder: document.getElementById('chip-decoder-type').value,
            fullName: document.getElementById('full-name-type').value,
            photoURL: (photoURL.startsWith('http')) ? photoURL : null
        };

        if (editingModuleTypeId) {
            await db.collection('module_types').doc(editingModuleTypeId).update(moduleTypeData);
        } else {
            await db.collection('module_types').add(moduleTypeData);
        }

        moduleTypeModal.style.display = 'none';
        loadModuleTypes();
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

            if (moduleTypeToEdit.photoURL) {
                photoPreview.src = moduleTypeToEdit.photoURL;
                photoPreview.style.display = 'block';
            } else {
                photoPreview.src = '#';
                photoPreview.style.display = 'none';
            }
            modulePhotoInput.value = '';

            moduleTypeModal.style.display = 'block';
        } else if (event.target.classList.contains('delete-module-type-btn')) {
            const idToDelete = event.target.dataset.id;
            const photoURLToDelete = event.target.dataset.photoUrl;

            if (confirm('Вы уверены, что хотите удалить этот тип модуля?')) {
                await db.collection('module_types').doc(idToDelete).delete();

                if (photoURLToDelete) {
                    try {
                        const photoRef = storage.refFromURL(photoURLToDelete);
                        await photoRef.delete();
                    } catch (error) {
                        console.error("Не удалось удалить фото: ", error);
                    }
                }

                loadModuleTypes();
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