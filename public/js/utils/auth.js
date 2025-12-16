import apiClient from '../api/api.js';
import router from './router.js';
import toast from './toast.js';

/**
 * Gerenciador de autenticação com suporte a roles
 * 
 * Funcionalidades:
 * - Login com armazenamento de token JWT
 * - Registro de usuários (CLIENTE/PRESTADOR)
 * - Controle de acesso baseado em role (RBAC)
 * - Atualização de dados do usuário
 * - Logout seguro
 */
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
        this.role = localStorage.getItem('user_role');
    }

    isAuthenticated() {
        return !!this.token && !!this.user && !!this.role;
    }

    getCurrentUser() {
        return this.user;
    }

    /**
     * Obtém a role do usuário autenticado
     */
    getRole() {
        return this.role;
    }
    async refreshUserData() {
        if (!this.token) {
            return null;
        }

        try {
            const userData = await apiClient.getCurrentUser();
            this.user = {
                id: userData.id,
                nome: userData.nome,
                email: userData.email,
                role: userData.role || userData.tipoUsuario
            };
            
            this.role = userData.role || userData.tipoUsuario;
            
            localStorage.setItem('user_data', JSON.stringify(this.user));
            localStorage.setItem('user_role', this.role);
            return this.user;
        } catch (error) {
            console.warn('Erro ao atualizar dados do usuário:', error);
            // Se falhou, limpar dados de autenticação
            this.logout();
            return null;
        }
    }
    getUserType() {
        return this.role || this.user?.tipo || this.user?.role;
    }

    isCliente() {
        return this.getUserType() === 'CLIENTE';
    }

    isPrestador() {
        return this.getUserType() === 'PRESTADOR';
    }

    async login(credentials) {
        try {
            const response = await apiClient.login(credentials);
            
            if (response.token || response.accessToken) {
                this.token = response.token || response.accessToken;
                const userRole = response.tipoUsuario || response.role || 'CLIENTE';
                
                this.user = {
                    id: response.id,
                    nome: response.nome || response.username,
                    email: response.email,
                    tipo: userRole,
                    role: userRole
                };
                
                this.role = userRole;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                localStorage.setItem('user_role', this.role);
                apiClient.setToken(this.token);
                toast.success(`Bem-vindo, ${this.user.nome}!`);
                
                globalThis.dispatchEvent(new CustomEvent('auth:login', { 
                    detail: { user: this.user, role: this.role } 
                }));
                
                return response;
            } else {
                throw new Error('Token não retornado pelo servidor');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Falha ao fazer login. Verifique suas credenciais.';
            toast.error(errorMessage);
            throw error;
        }
    }

    async logout() {
        try {
            await apiClient.logout();
        } catch (error) {
            console.warn('Erro ao fazer logout no servidor:', error);
        } finally {
            this.token = null;
            this.user = null;
            this.role = null;
            
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_role');
            
            apiClient.setToken(null);
            
            globalThis.dispatchEvent(new CustomEvent('auth:logout'));
            
            if (!router.isCurrentPage('login')) {
                router.redirectToLogin();
            }
        }
    }

    async register(userData) {
        try {
            const response = await apiClient.register(userData);
            return response;
        } catch (error) {
            console.error('Erro no registro:', error);
            throw error;
        }
    }

    /**
     * Verifica se o usuário pode acessar um recurso específico
     * @param {string} requiredRole - Role necessária (CLIENTE, PRESTADOR)
     * @returns {boolean} true se autorizado
     */
    canAccess(requiredRole) {
        if (!this.isAuthenticated()) {
            return false;
        }

        if (!requiredRole) {
            return true;
        }

        const userRole = this.getUserType();
        if (!userRole) return false;

        return userRole.toUpperCase() === requiredRole.toUpperCase();
    }

    redirectToDashboard() {
        if (!this.isAuthenticated()) {
            router.redirectToLogin();
            return;
        }

        if (this.isCliente()) {
            router.navigate('/pages/dashboardCliente.html');
        } else if (this.isPrestador()) {
            router.navigate('/pages/dashboardPrestador.html');
        } else {
            router.redirectToDashboard(this.user);
        }
    }

    isAdmin() {
        return this.role === 'ADMIN';
    }

    getRoleLabel() {
        const labels = {
            'CLIENTE': 'Cliente',
            'PRESTADOR': 'Prestador de Serviços',
            'ADMIN': 'Administrador'
        };
        return labels[this.role] || this.role;
    }
}

const authManager = new AuthManager();

export function getUser() {
    return authManager.getCurrentUser();
}

export function getUserRole() {
    return authManager.getRole();
}

export function requireRole(requiredRole) {
    if (!authManager.isAuthenticated()) {
        router.redirectToLogin();
        return false;
    }
    
    if (requiredRole && !authManager.canAccess(requiredRole)) {
        console.warn(`Acesso negado: role necessária=${requiredRole}, role atual=${authManager.getRole()}`);
        authManager.redirectToDashboard();
        return false;
    }
    
    return true;
}

export function ensureLoggedIn() {
    if (!authManager.isAuthenticated()) {
        router.redirectToLogin();
        return false;
    }
    return true;
}

export { AuthManager };
export default authManager;
