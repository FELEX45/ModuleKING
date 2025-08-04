document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('add-edit-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const moduleForm = document.getElementById('module-form');
    const modulesTableBody = document.querySelector('#modules-table tbody');

    let modules = JSON.parse(localStorage.getItem('modules')) || [];
    let editingIndex = -1;

    function renderTable(data) {
        modulesTableBody.innerHTML = '';
        data.forEach((module, index) => {
            const row = modulesTableBody.insertRow();
            row.innerHTML = `
                <td>${module.date}</td>
                <td>${module.object}</td>
                <td>${module.pixel}</td>
                <td>${module.manufacturer}</td>
                <td>${module.chipDecoder}</td>
                <td>${module.fullName}</td>
                <td>${module.note}</td>
                <td>
                    <button class="edit-btn" data-index="${index}">Редактировать</button>
                    <button class="delete-btn" data-index="${index}">Удалить</button>
                </td>
            `;
        });
    }

    function saveModules() {
        localStorage.setItem('modules', JSON.stringify(modules));
    }

    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        moduleForm.reset();
        editingIndex = -1;
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    moduleForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newModule = {
            date: document.getElementById('date').value,
            object: document.getElementById('object').value,
            pixel: document.getElementById('pixel').value,
            manufacturer: document.getElementById('manufacturer').value,
            chipDecoder: document.getElementById('chip-decoder').value,
            fullName: document.getElementById('full-name').value,
            note: document.getElementById('note').value
        };

        if (editingIndex === -1) {
            modules.push(newModule);
        } else {
            modules[editingIndex] = newModule;
        }

        saveModules();
        renderTable(modules);
        modal.style.display = 'none';
    });

    modulesTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-btn')) {
            editingIndex = parseInt(event.target.dataset.index);
            const moduleToEdit = modules[editingIndex];

            document.getElementById('date').value = moduleToEdit.date;
            document.getElementById('object').value = moduleToEdit.object;
            document.getElementById('pixel').value = moduleToEdit.pixel;
            document.getElementById('manufacturer').value = moduleToEdit.manufacturer;
            document.getElementById('chip-decoder').value = moduleToEdit.chipDecoder;
            document.getElementById('full-name').value = moduleToEdit.fullName;
            document.getElementById('note').value = moduleToEdit.note;

            modal.style.display = 'block';
        } else if (event.target.classList.contains('delete-btn')) {
            const indexToDelete = parseInt(event.target.dataset.index);
            if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                modules.splice(indexToDelete, 1);
                saveModules();
                renderTable(modules);
            }
        }
    });

    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredModules = modules.filter(module => {
            for (const key in module) {
                if (key === 'date') {
                    if (module[key].includes(searchTerm)) {
                        return true;
                    }
                    const [year, month, day] = module[key].split('-');
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
            renderTable(modules);
        }
    });

    renderTable(modules);
}); 