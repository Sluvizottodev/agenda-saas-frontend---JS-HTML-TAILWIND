// Sistema de modais reutilizáveis
export class Modal {
    constructor(config = {}) {
        this.config = {
            title: '',
            content: '',
            size: 'medium', // small, medium, large, full
            showHeader: true,
            showCloseButton: true,
            closeOnBackdropClick: true,
            closeOnEscape: true,
            buttons: [], // [{ text: 'OK', class: 'btn-primary', callback: () => {} }]
            onOpen: null,
            onClose: null,
            ...config
        };
        
        this.element = null;
        this.isOpen = false;
        
        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
        this.element.style.display = 'none';
        
        this.element.innerHTML = `
            <div class="modal-content bg-white rounded-lg shadow-xl transform transition-all ${this.getSizeClasses()}" role="dialog" aria-modal="true">
                ${this.config.showHeader ? this.renderHeader() : ''}
                <div class="modal-body ${this.getBodyClasses()}">
                    ${this.config.content}
                </div>
                ${this.config.buttons.length > 0 ? this.renderFooter() : ''}
            </div>
        `;
        
        document.body.appendChild(this.element);
        this.attachEventListeners();
    }

    renderHeader() {
        return `
            <div class="modal-header flex items-center justify-between p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">${this.config.title}</h3>
                ${this.config.showCloseButton ? `
                    <button type="button" class="modal-close text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150" aria-label="Fechar">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderFooter() {
        return `
            <div class="modal-footer flex justify-end space-x-3 p-6 border-t border-gray-200">
                ${this.config.buttons.map(button => `
                    <button 
                        type="button" 
                        class="modal-btn px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 ${button.class || 'bg-gray-300 text-gray-700 hover:bg-gray-400'}"
                        data-action="${button.action || ''}"
                    >
                        ${button.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    getSizeClasses() {
        const sizes = {
            small: 'max-w-md w-full',
            medium: 'max-w-lg w-full',
            large: 'max-w-2xl w-full',
            full: 'max-w-4xl w-full'
        };
        return sizes[this.config.size] || sizes.medium;
    }

    getBodyClasses() {
        const baseClasses = this.config.showHeader ? '' : 'pt-6';
        const footerClasses = this.config.buttons.length > 0 ? '' : 'pb-6';
        return `px-6 ${baseClasses} ${footerClasses}`;
    }

    attachEventListeners() {
        // Close button
        const closeButton = this.element.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        // Footer buttons
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-btn')) {
                const action = e.target.getAttribute('data-action');
                const button = this.config.buttons.find(btn => btn.action === action);
                if (button && button.callback) {
                    const result = button.callback(this);
                    // Close modal if callback doesn't return false
                    if (result !== false) {
                        this.close();
                    }
                }
            }
        });

        // Backdrop click
        if (this.config.closeOnBackdropClick) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }

        // Escape key
        if (this.config.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.element.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (this.config.onOpen) {
            this.config.onOpen(this);
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.element.style.display = 'none';
        document.body.style.overflow = '';
        
        if (this.config.onClose) {
            this.config.onClose(this);
        }
    }

    destroy() {
        this.close();
        
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    setContent(content) {
        const modalBody = this.element.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
}

// Utility functions for common modal types
export function confirm(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Confirmação',
            content: `<p class="text-gray-700">${message}</p>`,
            size: options.size || 'small',
            buttons: [
                {
                    text: options.cancelText || 'Cancelar',
                    class: 'bg-gray-300 text-gray-700 hover:bg-gray-400',
                    action: 'cancel',
                    callback: () => {
                        modal.destroy();
                        resolve(false);
                    }
                },
                {
                    text: options.confirmText || 'Confirmar',
                    class: options.confirmClass || 'bg-red-600 text-white hover:bg-red-700',
                    action: 'confirm',
                    callback: () => {
                        modal.destroy();
                        resolve(true);
                    }
                }
            ]
        });
        modal.open();
    });
}

export function alert(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Atenção',
            content: `<p class="text-gray-700">${message}</p>`,
            size: options.size || 'small',
            buttons: [
                {
                    text: options.buttonText || 'OK',
                    class: options.buttonClass || 'bg-blue-600 text-white hover:bg-blue-700',
                    action: 'ok',
                    callback: () => {
                        modal.destroy();
                        resolve(true);
                    }
                }
            ]
        });
        modal.open();
    });
}

export function show(content, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || '',
            content: typeof content === 'string' ? content : content.outerHTML,
            size: options.size || 'medium',
            buttons: options.buttons || [{
                text: 'Fechar',
                class: 'bg-gray-300 text-gray-700 hover:bg-gray-400',
                action: 'close',
                callback: () => {
                    modal.destroy();
                    resolve(null);
                }
            }],
            ...options
        });
        modal.open();
    });
}

// Export default modal
export default Modal;
