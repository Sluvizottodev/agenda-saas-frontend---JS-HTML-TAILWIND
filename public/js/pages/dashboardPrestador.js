import { getUser } from '../utils/auth.js';
import { confirm, alert as modalAlert } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { resolvePath } from '../utils/roleRouter.js';
import { formatTimeShort } from '../utils/format.js';

function getProvidersFromMock(){
  try{ const s = localStorage.getItem('mock_providers'); return s? JSON.parse(s): []; }catch(e){ return []; }
}

function saveProvidersMock(list){
  try{ localStorage.setItem('mock_providers', JSON.stringify(list)); }catch(e){ console.error('saveProvidersMock', e); }
}

function getAppointmentsForProvider(providerId){
  try{ const s = localStorage.getItem('mock_appointments'); const arr = s? JSON.parse(s): []; return arr.filter(a => String(a.providerId) === String(providerId)); }catch(e){ return []; }
}

function renderServices(provider){
  const root = document.getElementById('provider-services');
  if(!root) return;
  root.innerHTML = '';
  const list = provider.services || [];
  const ul = document.createElement('ul'); ul.className = 'space-y-2 text-sm';
  for(const s of list){
    const li = document.createElement('li'); li.className='p-2 border rounded flex justify-between items-center';
    const title = document.createElement('div'); title.innerHTML = `<div class="font-medium">${s.name}</div><div class="text-xs text-gray-500">${s.duration} min</div>`;
    const actions = document.createElement('div');
    const del = document.createElement('button'); del.type='button'; del.className='text-sm text-red-600'; del.textContent='Remover';
    del.addEventListener('click', async ()=>{
      const ok = await confirm('Remover serviço?'); if(!ok) return;
      const providers = getProvidersFromMock();
      const p = providers.find(x => String(x.id) === String(provider.id));
      if(p && p.services){ p.services = p.services.filter(x => String(x.id) !== String(s.id)); saveProvidersMock(providers); renderServices(p); toast('Serviço removido', 'success'); }
    });
    actions.appendChild(del);
    li.appendChild(title); li.appendChild(actions);
    ul.appendChild(li);
  }
  root.appendChild(ul);
}

export function initProviderDashboard(){
  const user = getUser();
  if(!user) return;
  const providers = getProvidersFromMock();
  const provider = providers.find(p => String(p.id) === String(user.id)) || providers[0] || { id: user.id, name: user.name, services: [] };

  const title = document.getElementById('dashboard-title'); if(title) title.textContent = `Dashboard — ${provider.name}`;
  const roleArea = document.getElementById('role-area');
  if(roleArea){
    roleArea.innerHTML = `
      <div class="flex items-center justify-end mb-4" id="provider-actions"></div>
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="bg-white rounded shadow p-4">
          <h3 class="font-semibold mb-2">Serviços</h3>
          <div id="provider-services"></div>
          <form id="service-add" class="mt-3 flex gap-2">
            <input name="name" placeholder="Nome do serviço" class="flex-1 p-2 border rounded" />
            <input name="duration" placeholder="Duração (min)" type="number" class="w-28 p-2 border rounded" />
            <button type="submit" class="px-3 py-2 bg-green-600 text-white rounded">Adicionar</button>
          </form>
        </div>
        <div class="bg-white rounded shadow p-4">
          <h3 class="font-semibold mb-2">Agenda do dia</h3>
          <div id="provider-today-agenda" class="text-sm text-gray-700"></div>
        </div>
      </div>
    `;

    const actionsRoot = document.getElementById('provider-actions');
    if(actionsRoot){
      actionsRoot.innerHTML = '';
      const btnAgenda = document.createElement('a'); btnAgenda.href = resolvePath('agenda.html'); btnAgenda.className='px-3 py-1 rounded bg-blue-600 text-white text-sm'; btnAgenda.textContent='Ver agenda';
      const btnAdd = document.createElement('button'); btnAdd.type='button'; btnAdd.className='ml-2 px-3 py-1 rounded border text-sm'; btnAdd.textContent='Novo serviço';
      btnAdd.addEventListener('click', ()=>{ const form = document.getElementById('service-add'); if(form) form.querySelector('[name="name"]').focus(); });
      actionsRoot.appendChild(btnAgenda); actionsRoot.appendChild(btnAdd);
    }

    const form = document.getElementById('service-add');
    if(form){
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name')||'').toString().trim();
      const duration = Number(fd.get('duration')) || 30;
      if(!name){ await modalAlert('Nome é obrigatório'); return; }
      const providersArr = getProvidersFromMock();
      let p = providersArr.find(x => String(x.id) === String(provider.id));
      if(!p){ p = { id: provider.id, name: provider.name, services: [] }; providersArr.push(p); }
      const sid = 'svc-' + Date.now();
      p.services = p.services || [];
      p.services.push({ id: sid, name, duration });
      saveProvidersMock(providersArr);
      renderServices(p);
      form.reset();
      toast('Serviço adicionado', 'success');
    });
    }
    renderServices(provider);
    // if no services, show empty CTA
    if(!Array.isArray(provider.services) || provider.services.length === 0){
      const srvRoot = document.getElementById('provider-services');
      if(srvRoot){ srvRoot.innerHTML = '';
        const card = document.createElement('div'); card.className='p-4 bg-white rounded shadow text-center';
        const h = document.createElement('div'); h.className='font-semibold mb-2'; h.textContent = 'Nenhum serviço cadastrado';
        const p = document.createElement('div'); p.className='text-sm text-gray-600 mb-3'; p.textContent = 'Adicione seu primeiro serviço para começar a receber agendamentos.';
        const btn = document.createElement('button'); btn.type='button'; btn.className='px-3 py-2 bg-green-600 text-white rounded'; btn.textContent = 'Adicionar serviço';
        btn.addEventListener('click', ()=>{ const form = document.getElementById('service-add'); if(form) form.querySelector('[name="name"]').focus(); });
        card.appendChild(h); card.appendChild(p); card.appendChild(btn); srvRoot.appendChild(card);
      }
    }

    const agendaRoot = document.getElementById('provider-today-agenda');
    if(agendaRoot){
      const today = new Date();
      const appts = getAppointmentsForProvider(provider.id).filter(a => {
        const dt = new Date(a.date); if(isNaN(dt.getTime())) return false;
        return dt.getFullYear()===today.getFullYear() && dt.getMonth()===today.getMonth() && dt.getDate()===today.getDate();
      });
      if(appts.length===0) agendaRoot.textContent = 'Sem agendamentos hoje.';
      else{
        const ul = document.createElement('ul'); ul.className='space-y-2 text-sm';
        for(const a of appts){
          const li = document.createElement('li'); li.className='p-2 border rounded flex justify-between items-center';
          const dt = new Date(a.date);
          li.innerHTML = `<div><div class="font-medium">${a.title}</div><div class="text-xs text-gray-500">${formatTimeShort(dt)} — ${a.client}</div></div>`;
          const btns = document.createElement('div');
          const cancel = document.createElement('button'); cancel.type='button'; cancel.className='text-sm text-red-600'; cancel.textContent='Cancelar';
          cancel.addEventListener('click', async ()=>{
            const ok = await confirm('Cancelar agendamento?'); if(!ok) return;
            try{ const s = localStorage.getItem('mock_appointments'); const arr = s? JSON.parse(s): []; const idx = arr.findIndex(x=>String(x.id)===String(a.id)); if(idx>=0){ arr.splice(idx,1); localStorage.setItem('mock_appointments', JSON.stringify(arr)); toast('Agendamento cancelado', 'success'); try{ document.dispatchEvent(new CustomEvent('agenda:refresh', { detail: { providerId: provider.id } })); }catch(e){} }}catch(e){ console.error(e); toast('Falha ao cancelar', 'error'); }
          });
          btns.appendChild(cancel);
          li.appendChild(btns);
          ul.appendChild(li);
        }
        agendaRoot.appendChild(ul);
      }
    }
  }
}

export default { initProviderDashboard };
