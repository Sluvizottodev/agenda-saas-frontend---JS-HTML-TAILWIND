// Configuração da API base
const API_BASE = import.meta.env?.VITE_API_BASE_URL || window.API_BASE || window.__API_BASE__ || 'http://localhost:8080/api';

// Classe para gerenciar a comunicação com a API
import router from '../utils/router.js';

class ApiClient {
	constructor(baseUrl = API_BASE) {
		this.baseUrl = baseUrl;
		this.token = localStorage.getItem('auth_token');
	}

	// Método para definir o token de autenticação
	setToken(token) {
		this.token = token;
		if (token) {
			localStorage.setItem('auth_token', token);
		} else {
			localStorage.removeItem('auth_token');
		}
	}

	// Método para obter o token
	getToken() {
		return this.token || localStorage.getItem('auth_token');
	}

	// Método para fazer requisições HTTP
	async request(path, options = {}) {
		const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
		
		// Headers padrão
		const headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			...options.headers
		};

		// Adicionar token de autorização se disponível
		const token = this.getToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const config = {
			...options,
			headers,
			credentials: 'include'
		};

		// Se o body é um objeto, converter para JSON
		if (config.body && typeof config.body !== 'string') {
			config.body = JSON.stringify(config.body);
		}

		try {
			console.log(`[API] ${config.method || 'GET'} ${url}`, config.body ? JSON.parse(config.body) : '');
			
			const response = await fetch(url, config);
			
			// Verificar se o token expirou
			if (response.status === 401) {
				this.setToken(null);
				if (!router.isCurrentPage('login')) {
					router.redirectToLogin();
				}
				throw new Error('Token expirado. Faça login novamente.');
			}

			// Tentar parsear a resposta
			let data = null;
			const contentType = response.headers.get('content-type');
			
			if (contentType && contentType.includes('application/json')) {
				const text = await response.text();
				if (text) {
					try {
						data = JSON.parse(text);
					} catch (e) {
						data = text;
					}
				}
			} else {
				data = await response.text();
			}

			if (!response.ok) {
				const errorMessage = data?.message || data?.error || data || response.statusText || 'Erro na requisição';
				const error = new Error(errorMessage);
				error.status = response.status;
				error.body = data;
				throw error;
			}

			console.log(`[API] Response:`, data);
			return data;

		} catch (error) {
			console.error(`[API] Error:`, error);
			
			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				throw new Error('Erro de conexão. Verifique sua internet ou se o servidor está funcionando.');
			}
			
			throw error;
		}
	}

	// Métodos CRUD para entidades
	async list(entity, query = '') {
		const queryString = query ? `?${query}` : '';
		return this.request(`/${entity}${queryString}`, { method: 'GET' });
	}

	async get(entity, id) {
		return this.request(`/${entity}/${id}`, { method: 'GET' });
	}

	async create(entity, data) {
		return this.request(`/${entity}`, { 
			method: 'POST', 
			body: data 
		});
	}

	async update(entity, id, data) {
		return this.request(`/${entity}/${id}`, { 
			method: 'PUT', 
			body: data 
		});
	}

	async delete(entity, id) {
		return this.request(`/${entity}/${id}`, { 
			method: 'DELETE' 
		});
	}

	// Métodos de autenticação
	async login(credentials) {
		const response = await this.request('/auth/login', {
			method: 'POST',
			body: credentials
		});
		
		if (response.token || response.accessToken) {
			this.setToken(response.token || response.accessToken);
		}
		
		return response;
	}

	async register(userData) {
		// Determinar endpoint baseado no tipo de usuário
		const endpoint = userData.role === 'prestador' ? '/auth/register/prestador' : '/auth/register/cliente';
		return this.request(endpoint, {
			method: 'POST',
			body: userData
		});
	}

	async logout() {
		try {
			await this.request('/auth/logout', { method: 'POST' });
		} catch (error) {
			// Ignorar erro de logout
			console.warn('Erro no logout:', error.message);
		} finally {
			this.setToken(null);
		}
	}

	async getCurrentUser() {
		return this.request('/auth/me', { method: 'GET' });
	}
}

// Instância singleton da API
const apiClient = new ApiClient();

// Exportar métodos para compatibilidade com código existente
export const listEntities = (entity, query) => apiClient.list(entity, query);
export const getEntity = (entity, id) => apiClient.get(entity, id);
export const createEntity = (entity, data) => apiClient.create(entity, data);
export const updateEntity = (entity, id, data) => apiClient.update(entity, id, data);
export const deleteEntity = (entity, id) => apiClient.delete(entity, id);

// Exportar cliente da API
export default apiClient;

