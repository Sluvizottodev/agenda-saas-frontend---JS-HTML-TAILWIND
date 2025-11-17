import authManager from '../utils/auth.js';
import router from '../utils/router.js';

class HeaderManager {
    constructor() {
        this.authManager = authManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.highlightActiveNavLink();
    }

    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.logout();
                router.navigateTo('login', true);
            });
        }

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('mobile-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebarClose = document.getElementById('sidebar-close');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.remove('hidden');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.add('hidden');
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.add('hidden');
            });
        }

        // Mobile nav links - close sidebar when clicking
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
            });
        });
    }

    updateUI() {
        if (!this.authManager.isAuthenticated()) {
            return;
        }

        const user = this.authManager.getCurrentUser();
        
        // Update user info in desktop header
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        
        if (userNameEl && user.nome) {
            userNameEl.textContent = user.nome;
        }
        
        if (userRoleEl && user.tipo) {
            const roleLabels = {
                'CLIENTE': 'Cliente',
                'PRESTADOR': 'Prestador',
                'ADMIN': 'Administrador'
            };
            userRoleEl.textContent = roleLabels[user.tipo] || user.tipo;
        }

        // Update user info in mobile sidebar
        const mobileUserNameEl = document.getElementById('mobile-user-name');
        const mobileUserRoleEl = document.getElementById('mobile-user-role');
        
        if (mobileUserNameEl && user.nome) {
            mobileUserNameEl.textContent = user.nome;
        }
        
        if (mobileUserRoleEl && user.tipo) {
            const roleLabels = {
                'CLIENTE': 'Cliente',
                'PRESTADOR': 'Prestador',
                'ADMIN': 'Administrador'
            };
            mobileUserRoleEl.textContent = roleLabels[user.tipo] || user.tipo;
        }

        // Hide navigation items based on user role
        this.updateNavigationByRole(user.tipo);
    }

    updateNavigationByRole(userType) {
        // Por enquanto, mostrar todos os links para todos os tipos de usuário
        // Isso pode ser customizado conforme as regras de negócio
        
        if (userType === 'CLIENTE') {
            // Clientes podem ver apenas agendamentos e seus dados
            // this.hideNavLink('/pages/prestadores.html');
            // this.hideNavLink('/pages/servicos.html');
        } else if (userType === 'PRESTADOR') {
            // Prestadores podem ver seus serviços e agendamentos
            // this.hideNavLink('/pages/clientes.html');
        }
        // ADMIN ou outros tipos podem ver tudo
    }

    hideNavLink(href) {
        // Desktop navigation
        const desktopLink = document.querySelector(`.nav-link[href="${href}"]`);
        if (desktopLink) {
            desktopLink.style.display = 'none';
        }

        // Mobile navigation
        const mobileLink = document.querySelector(`.mobile-nav-link[href="${href}"]`);
        if (mobileLink) {
            mobileLink.style.display = 'none';
        }
    }

    highlightActiveNavLink() {
        const currentPath = globalThis.location.pathname;
        
        // Desktop navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('text-blue-600', 'font-bold');
            link.classList.add('text-gray-600');
            
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').split('/').pop().split('.')[0])) {
                link.classList.remove('text-gray-600');
                link.classList.add('text-blue-600', 'font-bold');
            }
        });

        // Mobile navigation
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.classList.remove('text-blue-600', 'bg-blue-50');
            
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').split('/').pop().split('.')[0])) {
                link.classList.add('text-blue-600', 'bg-blue-50');
            }
        });
    }
}

// Auto-initialize when header is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure header HTML is loaded
    setTimeout(() => {
        new HeaderManager();
    }, 100);
});

export { HeaderManager };