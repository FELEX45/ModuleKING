document.addEventListener('DOMContentLoaded', () => {
    const openAccountingBtn = document.getElementById('open-accounting-btn');
    const openModuleTypeFormBtn = document.getElementById('open-module-type-form-btn');

    if (openAccountingBtn) {
        openAccountingBtn.addEventListener('click', () => {
            window.location.href = 'accounting.html';
        });
    }

    if (openModuleTypeFormBtn) {
        openModuleTypeFormBtn.addEventListener('click', () => {
            window.location.href = 'module_types.html';
        });
    }
}); 