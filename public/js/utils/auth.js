import apiClient from '../api/api.js';
import router from './router.js';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getCurrentUser() {
        return this.user;
    }

    async refreshUserData() {
        if (!this.token) {
            return null;
        }

        try {
            const userData = await apiClient.getCurrentUser();
            this.user = userData;
            localStorage.setItem('user_data', JSON.stringify(this.user));
            return this.user;
        } catch (error) {
            console.warn('Erro ao atualizar dados do usuário:', error);
            // Se falhou, limpar dados de autenticação
            this.logout();
            return null;
        }
    }

    getUserType() {
        return this.user?.tipo;
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
                this.user = {
                    id: response.id,
                    nome: response.nome || response.username,
                    email: response.email,
                    tipo: response.tipoUsuario || response.role || 'CLIENTE'
                };
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                
                globalThis.dispatchEvent(new CustomEvent('auth:login', { 
                    detail: { user: this.user } 
                }));
                
                return response;
            } else {
                throw new Error('Token não retornado pelo servidor');
            }
        } catch (error) {
            console.error('Erro no login:', error);
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
            
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
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

    canAccess(requiredRole) {
        if (!this.isAuthenticated()) {
            return false;
        }

        if (!requiredRole) {
            return true;
        }

        const userType = this.getUserType();
        if (!userType) return false;

        return userType.toLowerCase() === requiredRole.toLowerCase();
    }

    redirectToDashboard() {
        if (!this.isAuthenticated()) {
            router.redirectToLogin();
            return;
        }

        router.redirectToDashboard(this.user);
    }
}

const authManager = new AuthManager();

export function getUser() {
    return authManager.getCurrentUser();
}

export function requireRole(requiredRole) {
    if (!authManager.isAuthenticated()) {
        router.redirectToLogin();
        return false;
    }
    
    if (requiredRole && !authManager.canAccess(requiredRole)) {
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
