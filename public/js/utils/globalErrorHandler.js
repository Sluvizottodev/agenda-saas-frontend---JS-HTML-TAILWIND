import router from './router.js';
import authManager from './auth.js';

/**
 * Interceptador global de erros HTTP
 */
export function setupGlobalErrorHandler() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .then(response => {
                if (response.status === 401) {
                    console.warn('Erro 401: Não autenticado. Redirecionando para login...');
                    authManager.logout();
                    router.redirectToLogin();
                    throw new Error('Sessão expirada. Faça login novamente.');
                }
                
                if (response.status === 403) {
                    console.warn('Erro 403: Acesso negado. Redirecionando para dashboard...');
                    const user = authManager.getCurrentUser();
                    if (user) {
                        router.redirectToDashboard(user);
                    } else {
                        router.redirectToLogin();
                    }
                    throw new Error('Acesso negado.');
                }
                
                return response;
            })
            .catch(error => {
                throw error;
            });
    };
}

export function setupPageNotFoundHandler() {
    window.addEventListener('load', () => {
        const mainContent = document.querySelector('main');
        if (mainContent && mainContent.innerText.trim() === '') {
            console.warn('Página vazia detectada. Pode ser um erro 404.');
        }
    });
}

export function setupAPIHealthCheck() {
    setInterval(async () => {
        try {
            const response = await originalFetch('http://localhost:8080/api/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                console.warn('API não está respondendo corretamente');
            }
        } catch (error) {
            console.warn('Erro ao conectar com a API:', error.message);
        }
    }, 30000);
}

export default {
    setupGlobalErrorHandler,
    setupPageNotFoundHandler,
    setupAPIHealthCheck
};
