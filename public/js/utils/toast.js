import { getIcon } from './icons.js';

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.defaultOptions = {
            duration: 4000,
            position: 'top-right',
            maxToasts: 5,
            showProgress: true,
            pauseOnHover: true,
            closeButton: true
        };
        
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container fixed z-50 p-4 pointer-events-none';
        this.updatePosition('top-right');
        document.body.appendChild(this.container);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                max-width: 400px;
                width: 100%;
            }
            
            .toast {
                pointer-events: auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 8px;
                overflow: hidden;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease-in-out;
                position: relative;
            }
            
            .toast.toast-enter {
                transform: translateX(0);
                opacity: 1;
            }
            
            .toast.toast-exit {
                transform: translateX(100%);
                opacity: 0;
                margin-bottom: 0;
                max-height: 0;
            }
            
            .toast-content {
                padding: 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .toast-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                margin-top: 2px;
            }
            
            .toast-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .toast-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .toast-description {
                color: #666;
            }
            
            .toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .toast-close:hover {
                background: rgba(0, 0, 0, 0.1);
                color: #666;
            }
            
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                transition: width linear;
            }
            
            .toast-success {
                border-left: 4px solid #10b981;
                color: #065f46;
            }
            
            .toast-error {
                border-left: 4px solid #ef4444;
                color: #991b1b;
            }
            
            .toast-warning {
                border-left: 4px solid #f59e0b;
                color: #92400e;
            }
            
            .toast-info {
                border-left: 4px solid #3b82f6;
                color: #1e40af;
            }
            
            .toast:hover .toast-progress {
                animation-play-state: paused;
            }
        `;
        
        if (!document.head.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }
    }

    updatePosition(position) {
        const positions = {
            'top-left': 'top-4 left-4',
            'top-right': 'top-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'bottom-right': 'bottom-4 right-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        
        this.container.className = `toast-container fixed z-50 p-4 pointer-events-none ${positions[position] || positions['top-right']}`;
    }

    getIcon(type) {
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'exclamation-triangle',
            info: 'information-circle'
        };
        
        const iconName = iconMap[type] || iconMap.info;
        return getIcon(iconName, 'text-current', 'sm');
    }

    show(message, type = 'info', options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const toast = this.createToast(message, type, config);
        
        // Limit number of toasts
        if (this.toasts.length >= config.maxToasts) {
            this.remove(this.toasts[0]);
        }
        
        this.toasts.push(toast);
        this.container.appendChild(toast.element);
        
        // Trigger enter animation
        requestAnimationFrame(() => {
            toast.element.classList.add('toast-enter');
        });
        
        // Auto remove
        if (config.duration > 0) {
            toast.timer = setTimeout(() => {
                this.remove(toast);
            }, config.duration);
            
            // Setup progress bar
            if (config.showProgress) {
                this.setupProgress(toast, config.duration);
            }
        }
        
        return toast;
    }

    createToast(message, type, config) {
        const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 9);
        const element = document.createElement('div');
        element.className = `toast toast-${type}`;
        element.id = id;
        
        const title = typeof message === 'object' ? message.title : '';
        const description = typeof message === 'object' ? message.message : message;
        
        element.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${this.getIcon(type)}</div>
                <div class="toast-message">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    <div class="toast-description">${description}</div>
                </div>
                ${config.closeButton ? `
                    <button class="toast-close" type="button" aria-label="Fechar">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
            ${config.showProgress ? '<div class="toast-progress"></div>' : ''}
        `;
        
        // Close button handler
        if (config.closeButton) {
            const closeBtn = element.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                this.remove({ id, element });
            });
        }
        
        return {
            id,
            element,
            type,
            timer: null
        };
    }

    setupProgress(toast, duration) {
        const progressBar = toast.element.querySelector('.toast-progress');
        if (!progressBar) return;
        
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${duration}ms linear`;
        
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
    }

    remove(toast) {
        if (!toast || !toast.element) return;
        
        // Clear timer
        if (toast.timer) {
            clearTimeout(toast.timer);
        }
        
        // Remove from array
        this.toasts = this.toasts.filter(t => t.id !== toast.id);
        
        // Exit animation
        toast.element.classList.remove('toast-enter');
        toast.element.classList.add('toast-exit');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.element && toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
        }, 300);
    }

    // Public API methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { duration: 6000, ...options });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

const toastManager = new ToastManager();

export function showToast(message, type = 'info', options = {}) {
    return toastManager.show(message, type, options);
}

export function showToastExternal(message, kind = 'info') {
    showToast(message, kind);
}

export default toastManager;
