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
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.logout();
                router.navigateTo('login', true);
            });
        }

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
        const role = this.authManager.getRole();
        
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        
        if (userNameEl && user.nome) {
            userNameEl.textContent = user.nome;
        }
        
        if (userRoleEl && role) {
            const roleLabels = {
                'CLIENTE': 'Cliente',
                'PRESTADOR': 'Prestador de Serviços',
                'ADMIN': 'Administrador'
            };
            userRoleEl.textContent = roleLabels[role] || role;
        }

        const mobileUserNameEl = document.getElementById('mobile-user-name');
        const mobileUserRoleEl = document.getElementById('mobile-user-role');
        
        if (mobileUserNameEl && user.nome) {
            mobileUserNameEl.textContent = user.nome;
        }
        
        if (mobileUserRoleEl && role) {
            const roleLabels = {
                'CLIENTE': 'Cliente',
                'PRESTADOR': 'Prestador de Serviços',
                'ADMIN': 'Administrador'
            };
            mobileUserRoleEl.textContent = roleLabels[role] || role;
        }

        this.updateNavigationByRole(role);
    }

    updateNavigationByRole(role) {
        if (role === 'CLIENTE') {
            this.showNavLink('dashboard');
            this.showNavLink('prestadores');
            this.showNavLink('profile');
            this.hideNavLink('servicos');
            this.hideNavLink('horarios');
        } else if (role === 'PRESTADOR') {
            this.showNavLink('dashboard');
            this.showNavLink('servicos');
            this.showNavLink('horarios');
            this.showNavLink('profile');
            this.hideNavLink('prestadores');
        } else {
            this.showNavLink('dashboard');
            this.showNavLink('servicos');
            this.showNavLink('horarios');
            this.showNavLink('prestadores');
            this.showNavLink('profile');
        }
    }

    showNavLink(linkId) {
        const desktopLink = document.querySelector(`.nav-link[data-nav="${linkId}"]`);
        if (desktopLink) {
            desktopLink.style.display = '';
        }

        const mobileLink = document.querySelector(`.mobile-nav-link[data-nav="${linkId}"]`);
        if (mobileLink) {
            mobileLink.style.display = '';
        }
    }

    hideNavLink(linkId) {
        const desktopLink = document.querySelector(`.nav-link[data-nav="${linkId}"]`);
        if (desktopLink) {
            desktopLink.style.display = 'none';
        }

        const mobileLink = document.querySelector(`.mobile-nav-link[data-nav="${linkId}"]`);
        if (mobileLink) {
            mobileLink.style.display = 'none';
        }
    }

    highlightActiveNavLink() {
        const currentPath = globalThis.location.pathname;
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('text-blue-600', 'font-bold');
            link.classList.add('text-gray-600');
            
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').split('/').pop().split('.')[0])) {
                link.classList.remove('text-gray-600');
                link.classList.add('text-blue-600', 'font-bold');
            }
        });

        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.classList.remove('text-blue-600', 'bg-blue-50');
            
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').split('/').pop().split('.')[0])) {
                link.classList.add('text-blue-600', 'bg-blue-50');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new HeaderManager();
    }, 100);
});

export { HeaderManager };