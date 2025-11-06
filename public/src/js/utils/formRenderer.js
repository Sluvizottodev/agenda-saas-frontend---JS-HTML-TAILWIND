import api from '../api/api.js';
import { showToast } from './toast.js';

export async function renderForm(container, entity, fields = [{ name: 'title', label: 'Título' }], options = {}) {
  const form = document.createElement('form');
  form.className = 'space-y-4 p-4 max-w-lg bg-white rounded shadow';
  form.noValidate = true;

  const idInput = document.createElement('input');
  idInput.type = 'hidden';
  idInput.name = 'id';
  form.appendChild(idInput);

  fields.forEach(f => {
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = f.label || f.name;
    label.className = 'block text-sm font-medium text-gray-700';
    const input = document.createElement('input');
    input.name = f.name;
    input.type = f.type || 'text';
    input.className = 'mt-1 block w-full rounded border-gray-300 px-3 py-2';
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  const btnSubmit = document.createElement('button');
  btnSubmit.type = 'submit';
  btnSubmit.textContent = 'Salvar';
  btnSubmit.className = 'px-4 py-2 bg-green-600 text-white rounded';
  form.appendChild(btnSubmit);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const inputs = Array.from(form.querySelectorAll('input,textarea,select')).filter(i => i.name);
    const values = {};
    let firstInvalid = null;
    for (const inp of inputs) {
      const val = inp.value && inp.value.trim();
      if (inp.required && !val) {
        inp.classList.add('border-red-500');
        if (!firstInvalid) firstInvalid = inp;
      } else {
        inp.classList.remove('border-red-500');
      }
      values[inp.name] = val;
    }
    if (firstInvalid) { firstInvalid.focus(); showToast('Preencha os campos obrigatórios', 'error'); return; }

    try {
      btnSubmit.disabled = true;
      const prevText = btnSubmit.textContent;
      btnSubmit.textContent = 'Salvando...';

      try {
        if (values.id) {
          await api.updateEntity(entity, values.id, values);
          showToast('Atualizado com sucesso', 'success');
        } else {
          await api.createEntity(entity, values);
          showToast('Criado com sucesso', 'success');
        }
      } catch (errApi) {
        try {
          const key = 'mock_' + entity;
          const s = localStorage.getItem(key);
          const arr = s ? JSON.parse(s) : [];
          if (values.id) {
            const idx = arr.findIndex(x => String(x.id) === String(values.id));
            if (idx >= 0) arr[idx] = Object.assign({}, arr[idx], values);
          } else {
            const nid = Date.now();
            arr.push(Object.assign({ id: nid }, values));
          }
          localStorage.setItem(key, JSON.stringify(arr));
          showToast('Salvo em mock local', 'success');
        } catch (e2) {
          console.error(e2);
          throw errApi;
        }
      }
      if (options.onSaved) options.onSaved();
      form.reset();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao salvar', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = prevText || 'Salvar';
    }
  });

  container.innerHTML = '';
  container.appendChild(form);
}
