import api from '../api/api.js';

export function initRegisterForm() {
  const form = document.getElementById('formRegister');
  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: (fd.get('name')||'').toString().trim(),
      email: (fd.get('email')||'').toString().trim(),
      password: (fd.get('password')||'').toString(),
      role: (fd.get('role')||'cliente').toString()
    };

    const btn = form.querySelector('button[type="submit"]');
    const prev = btn ? btn.textContent : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

    try {
      try {
        await api.createEntity('users', payload);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Usuário criado (API)', kind: 'success' } }));
        form.reset();
      } catch (err) {
        const key = 'mock_users';
        const s = localStorage.getItem(key);
        const arr = s ? JSON.parse(s) : [];
        const id = Date.now();
        arr.push(Object.assign({ id }, payload));
        localStorage.setItem(key, JSON.stringify(arr));
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Usuário criado (mock)', kind: 'success' } }));
        form.reset();
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: e.message || 'Erro ao criar', kind: 'error' } }));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev || 'Criar usuário'; }
    }
  });
}
