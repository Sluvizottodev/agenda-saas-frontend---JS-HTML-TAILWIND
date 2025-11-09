import api from '../api/api.js';
import { showToast } from './toast.js';

export async function renderList(container, entity, fields = ['id', 'title'], options = {}) {
  container.innerHTML = '<div class="p-4">Carregando...</div>';
  try {
    let data = null;
    try {
      data = await api.listEntities(entity);
    } catch (e) {
      try {
        const s = localStorage.getItem('mock_' + entity);
        data = s ? JSON.parse(s) : [];
      } catch (e2) { data = []; }
    }
    if (!Array.isArray(data)) data = [];

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    fields.forEach(f => {
      const th = document.createElement('th');
      th.textContent = f.toUpperCase();
      th.className = 'px-4 py-2 text-left text-sm font-medium text-gray-700';
      headerRow.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = 'AÇÕES';
    thActions.className = 'px-4 py-2 text-left text-sm font-medium text-gray-700';
    headerRow.appendChild(thActions);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';

    data.forEach(item => {
      const tr = document.createElement('tr');
      fields.forEach(f => {
        const td = document.createElement('td');
        td.className = 'px-4 py-2 text-sm text-gray-700';
        td.textContent = item[f] ?? '';
        tr.appendChild(td);
      });

      const tdActions = document.createElement('td');
      tdActions.className = 'px-4 py-2 text-sm';

      const btnEdit = document.createElement('button');
      btnEdit.textContent = 'Editar';
      btnEdit.className = 'mr-2 px-2 py-1 bg-blue-500 text-white rounded';
      btnEdit.addEventListener('click', () => {
        if (options.onEdit) options.onEdit(item);
      });

      const btnDelete = document.createElement('button');
      btnDelete.textContent = 'Excluir';
      btnDelete.className = 'px-2 py-1 bg-red-500 text-white rounded';
      btnDelete.addEventListener('click', async () => {
        if (!confirm('Confirma exclusão?')) return;
        try {
          try {
            await api.deleteEntity(entity, item.id);
          } catch (e) {
            try {
              const s = localStorage.getItem('mock_' + entity);
              const arr = s ? JSON.parse(s) : [];
              const filtered = arr.filter(x => String(x.id) !== String(item.id));
              localStorage.setItem('mock_' + entity, JSON.stringify(filtered));
            } catch (e2) { console.error(e2); }
          }
          showToast('Registro excluído', 'success');
          if (options.onDeleted) options.onDeleted(item);
        } catch (err) {
          console.error(err);
          showToast(err.message || 'Erro ao excluir', 'error');
        }
      });

      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDelete);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="p-4 text-red-600">Erro: ${err.message || err}</div>`;
  }
}
