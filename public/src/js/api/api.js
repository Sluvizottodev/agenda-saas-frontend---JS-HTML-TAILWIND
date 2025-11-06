const API_BASE = window.API_BASE || window.__API_BASE__ || 'http://localhost:8080/api';

async function request(path, options = {}) {
	const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
	const opts = Object.assign({
		headers: { 'Content-Type': 'application/json' },
		credentials: 'same-origin'
	}, options);

	if (opts.body && typeof opts.body !== 'string') {
		opts.body = JSON.stringify(opts.body);
	}

	const res = await fetch(url, opts);
	const text = await res.text();
	let data = null;
	try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

	if (!res.ok) {
		const err = data || { message: res.statusText || 'Erro na requisição' };
		const error = new Error(err.message || 'Erro na requisição');
		error.status = res.status;
		error.body = err;
		throw error;
	}

	return data;
}

export async function listEntities(entity, query = '') {
	const q = query ? `?${query}` : '';
	return request(`/${entity}${q}`, { method: 'GET' });
}

export async function getEntity(entity, id) {
	return request(`/${entity}/${id}`, { method: 'GET' });
}

export async function createEntity(entity, data) {
	return request(`/${entity}`, { method: 'POST', body: data });
}

export async function updateEntity(entity, id, data) {
	return request(`/${entity}/${id}`, { method: 'PUT', body: data });
}

export async function deleteEntity(entity, id) {
	return request(`/${entity}/${id}`, { method: 'DELETE' });
}

export default { listEntities, getEntity, createEntity, updateEntity, deleteEntity };

