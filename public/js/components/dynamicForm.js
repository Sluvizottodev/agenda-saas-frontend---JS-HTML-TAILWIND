import { showToast } from '../utils/toast.js';

// Componente de formulário dinâmico
export class DynamicForm {
    constructor(container, config = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.config = {
            fields: [],
            title: '',
            submitLabel: 'Salvar',
            cancelLabel: 'Cancelar',
            showCancel: true,
            onSubmit: null,
            onCancel: null,
            validationRules: {},
            ...config
        };
        
        this.data = {};
        this.errors = {};
        
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="dynamic-form bg-white rounded-lg shadow-md p-6">
                ${this.config.title ? `<h2 class="text-xl font-semibold mb-6 text-gray-800">${this.config.title}</h2>` : ''}
                <form id="dynamic-form" novalidate>
                    ${this.renderFields()}
                    <div class="flex justify-end space-x-3 mt-6">
                        ${this.config.showCancel ? `
                            <button type="button" id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                ${this.config.cancelLabel}
                            </button>
                        ` : ''}
                        <button type="submit" id="submit-btn" class="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${this.config.submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.attachEventListeners();
    }

    renderFields() {
        return this.config.fields.map(field => this.renderField(field)).join('');
    }

    renderField(field) {
        const errorMessage = this.errors[field.name] || '';
        const hasError = !!errorMessage;
        const value = this.data[field.name] || field.defaultValue || '';

        return `
            <div class="field-group mb-4">
                <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-2">
                    ${field.label}
                    ${field.required ? '<span class="text-red-500">*</span>' : ''}
                </label>
                ${this.renderInput(field, value, hasError)}
                ${hasError ? `<div class="text-red-500 text-sm mt-1">${errorMessage}</div>` : ''}
                ${field.help ? `<div class="text-gray-500 text-sm mt-1">${field.help}</div>` : ''}
            </div>
        `;
    }

    renderInput(field, value, hasError) {
        const baseClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            hasError ? 'border-red-500' : 'border-gray-300'
        }`;

        const commonAttributes = `
            id="${field.name}"
            name="${field.name}"
            class="${baseClasses}"
            ${field.required ? 'required' : ''}
            ${field.disabled ? 'disabled' : ''}
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        `;

        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'tel':
            case 'url':
                return `<input type="${field.type}" ${commonAttributes} value="${value}" ${field.maxlength ? `maxlength="${field.maxlength}"` : ''}>`;

            case 'date':
            case 'datetime-local':
            case 'time':
                return `<input type="${field.type}" ${commonAttributes} value="${value}">`;

            case 'textarea':
                return `<textarea ${commonAttributes} rows="${field.rows || 3}">${value}</textarea>`;

            case 'select':
                return `
                    <select ${commonAttributes}>
                        <option value="">-- Selecione --</option>
                        ${field.options.map(option => 
                            `<option value="${option.value}" ${option.value == value ? 'selected' : ''}>${option.label}</option>`
                        ).join('')}
                    </select>
                `;

            case 'radio':
                return `
                    <div class="space-y-2">
                        ${field.options.map(option => `
                            <label class="flex items-center">
                                <input 
                                    type="radio" 
                                    name="${field.name}" 
                                    value="${option.value}"
                                    class="mr-2"
                                    ${option.value == value ? 'checked' : ''}
                                    ${field.required ? 'required' : ''}
                                >
                                <span class="text-sm text-gray-700">${option.label}</span>
                            </label>
                        `).join('')}
                    </div>
                `;

            case 'checkbox':
                return `
                    <label class="flex items-center">
                        <input 
                            type="checkbox" 
                            ${commonAttributes}
                            ${value ? 'checked' : ''}
                            class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        >
                        <span class="text-sm text-gray-700">${field.checkboxLabel || field.label}</span>
                    </label>
                `;

            case 'file':
                return `
                    <input 
                        type="file" 
                        ${commonAttributes}
                        ${field.accept ? `accept="${field.accept}"` : ''}
                        ${field.multiple ? 'multiple' : ''}
                        class="w-full px-3 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    >
                `;

            case 'hidden':
                return `<input type="hidden" name="${field.name}" value="${value}">`;

            default:
                return `<input type="text" ${commonAttributes} value="${value}">`;
        }
    }

    attachEventListeners() {
        const form = this.container.querySelector('#dynamic-form');
        
        // Submit handler
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Cancel button
        const cancelBtn = this.container.querySelector('#cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.config.onCancel) {
                    this.config.onCancel();
                }
            });
        }

        // Real-time validation
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });

        // Clear error on focus
        form.addEventListener('focus', (e) => {
            if (this.errors[e.target.name]) {
                delete this.errors[e.target.name];
                this.updateFieldError(e.target.name);
            }
        }, true);
    }

    handleSubmit() {
        this.collectFormData();
        
        if (this.validate()) {
            if (this.config.onSubmit) {
                this.config.onSubmit(this.data);
            }
        } else {
            showToast('Por favor, corrija os erros no formulário', 'error');
        }
    }

    collectFormData() {
        const form = this.container.querySelector('#dynamic-form');
        const formData = new FormData(form);
        
        this.data = {};
        
        this.config.fields.forEach(field => {
            if (field.type === 'checkbox') {
                this.data[field.name] = form.querySelector(`[name="${field.name}"]`).checked;
            } else if (field.type === 'file') {
                this.data[field.name] = form.querySelector(`[name="${field.name}"]`).files;
            } else if (field.type === 'number') {
                const value = formData.get(field.name);
                this.data[field.name] = value ? parseFloat(value) : null;
            } else {
                this.data[field.name] = formData.get(field.name);
            }
        });
    }

    validate() {
        this.errors = {};
        let isValid = true;

        this.config.fields.forEach(field => {
            const value = this.data[field.name];
            const fieldErrors = [];

            // Required validation
            if (field.required && (!value && value !== 0 && value !== false)) {
                fieldErrors.push(`${field.label} é obrigatório`);
            }

            // Type-specific validation
            if (value) {
                switch (field.type) {
                    case 'email':
                        if (!this.isValidEmail(value)) {
                            fieldErrors.push('Email inválido');
                        }
                        break;
                    case 'number':
                        if (isNaN(value)) {
                            fieldErrors.push('Deve ser um número válido');
                        }
                        if (field.min !== undefined && value < field.min) {
                            fieldErrors.push(`Valor mínimo: ${field.min}`);
                        }
                        if (field.max !== undefined && value > field.max) {
                            fieldErrors.push(`Valor máximo: ${field.max}`);
                        }
                        break;
                    case 'tel':
                        if (!this.isValidPhone(value)) {
                            fieldErrors.push('Telefone inválido');
                        }
                        break;
                }
            }

            // Custom validation
            if (this.config.validationRules[field.name]) {
                const customValidator = this.config.validationRules[field.name];
                const customError = customValidator(value, this.data);
                if (customError) {
                    fieldErrors.push(customError);
                }
            }

            if (fieldErrors.length > 0) {
                this.errors[field.name] = fieldErrors[0]; // Show first error only
                isValid = false;
            }
        });

        this.updateErrorDisplay();
        return isValid;
    }

    validateField(input) {
        const field = this.config.fields.find(f => f.name === input.name);
        if (!field) return;

        const value = input.type === 'checkbox' ? input.checked : input.value;
        let error = '';

        // Required validation
        if (field.required && (!value && value !== 0 && value !== false)) {
            error = `${field.label} é obrigatório`;
        }

        // Type validation
        if (value && !error) {
            switch (field.type) {
                case 'email':
                    if (!this.isValidEmail(value)) {
                        error = 'Email inválido';
                    }
                    break;
                case 'tel':
                    if (!this.isValidPhone(value)) {
                        error = 'Telefone inválido';
                    }
                    break;
            }
        }

        if (error) {
            this.errors[field.name] = error;
        } else {
            delete this.errors[field.name];
        }

        this.updateFieldError(field.name);
    }

    updateErrorDisplay() {
        this.config.fields.forEach(field => {
            this.updateFieldError(field.name);
        });
    }

    updateFieldError(fieldName) {
        const fieldGroup = this.container.querySelector(`[name="${fieldName}"]`).closest('.field-group');
        const input = fieldGroup.querySelector(`[name="${fieldName}"]`);
        const existingError = fieldGroup.querySelector('.text-red-500');

        // Remove existing error
        if (existingError && existingError.classList.contains('mt-1')) {
            existingError.remove();
        }

        // Update input styling
        if (this.errors[fieldName]) {
            input.classList.remove('border-gray-300');
            input.classList.add('border-red-500');
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-red-500 text-sm mt-1';
            errorDiv.textContent = this.errors[fieldName];
            input.parentNode.appendChild(errorDiv);
        } else {
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-300');
        }
    }

    // Validation helpers
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    }

    // Public methods
    setData(data) {
        this.data = { ...data };
        this.populateForm();
    }

    populateForm() {
        this.config.fields.forEach(field => {
            const input = this.container.querySelector(`[name="${field.name}"]`);
            if (!input) return;

            const value = this.data[field.name];

            if (field.type === 'checkbox') {
                input.checked = !!value;
            } else if (field.type === 'radio') {
                const radioInput = this.container.querySelector(`[name="${field.name}"][value="${value}"]`);
                if (radioInput) radioInput.checked = true;
            } else {
                input.value = value || '';
            }
        });
    }

    getData() {
        this.collectFormData();
        return this.data;
    }

    setFieldValue(fieldName, value) {
        this.data[fieldName] = value;
        const input = this.container.querySelector(`[name="${fieldName}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = !!value;
            } else {
                input.value = value || '';
            }
        }
    }

    getFieldValue(fieldName) {
        return this.data[fieldName];
    }

    setFieldError(fieldName, errorMessage) {
        this.errors[fieldName] = errorMessage;
        this.updateFieldError(fieldName);
    }

    clearErrors() {
        this.errors = {};
        this.updateErrorDisplay();
    }

    setLoading(loading) {
        const submitBtn = this.container.querySelector('#submit-btn');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.innerHTML = loading ? 
                '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processando...' :
                this.config.submitLabel;
        }
    }
}