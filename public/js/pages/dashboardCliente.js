import { getUser } from '../utils/auth.js';
import { toast } from '../components/toast.js';
import { confirm, show } from '../components/modal.js';
import { resolvePath } from '../utils/roleRouter.js';
import { generateSlotsForDay, isSlotAvailable, toDateObj, DEFAULT_SLOT_MINUTES } from '../utils/slots.js';
import { formatDateReadable, formatTimeShort } from '../utils/format.js';

function safeParse(key){ try{ const s = localStorage.getItem(key); return s? JSON.parse(s): []; }catch(e){ return []; } }
function save(key, arr){ try{ localStorage.setItem(key, JSON.stringify(arr)); return true; }catch(e){ return false; } }

function renderEmpty(root){
  root.innerHTML = '';
  const card = document.createElement('div'); card.className = 'p-6 bg-white rounded shadow text-center';
  const h = document.createElement('div'); h.className='font-semibold text-lg mb-2'; h.textContent = 'Você ainda não tem agendamentos';
  const p = document.createElement('div'); p.className='text-sm text-gray-600 mb-4'; p.textContent = 'Agende um serviço rapidamente usando a agenda.';
  const a = document.createElement('a'); a.href = resolvePath('agenda.html'); a.className = 'inline-block px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700'; a.textContent = 'Agendar agora';
  card.appendChild(h); card.appendChild(p); card.appendChild(a); root.appendChild(card);
}

export default function initClienteDashboard(){
  const user = getUser();
  if(!user) return;
  const title = document.getElementById('dashboard-title'); if(title) title.textContent = `Dashboard — ${user.name}`;
  const roleArea = document.getElementById('role-area'); if(!roleArea) return;

    roleArea.innerHTML = `
      <div class="flex items-center justify-end mb-4" id="client-actions"></div>
      <div class="max-w-4xl mx-auto space-y-3" id="client-content"></div>
    `;

    const actionsRoot = document.getElementById('client-actions');
    if(actionsRoot){
      actionsRoot.innerHTML = '';
      const btnAgenda = document.createElement('a'); btnAgenda.href = resolvePath('agenda.html'); btnAgenda.className='px-3 py-1 rounded bg-blue-600 text-white text-sm'; btnAgenda.textContent='Agendar';
      actionsRoot.appendChild(btnAgenda);
    }

    const contentRoot = document.getElementById('client-content');

    const appts = safeParse('mock_appointments').filter(a => String(a.clientId || a.client) === String(user.id) || String(a.client) === String(user.name));
    if (appts.length === 0) {
      if (contentRoot) {
        renderEmpty(contentRoot);
      }
      return;
    }
    const upcoming = appts.map(a => ({...a, dateObj: new Date(a.date)})).filter(a=>!Number.isNaN(a.dateObj.getTime())).sort((x,y)=>x.dateObj - y.dateObj);
      const list = document.createElement('div'); list.className='space-y-3';
    for(const a of upcoming){
    const card = document.createElement('div'); card.className='bg-white p-3 rounded shadow flex justify-between items-center';
    const left = document.createElement('div');
    const dt = formatDateReadable(a.date);
    left.innerHTML = `<div class="font-medium">${a.title || 'Agendamento'}</div><div class="text-xs text-gray-600">${dt}</div>`;
  const actions = document.createElement('div');
  const btnCancel = document.createElement('button'); btnCancel.type='button'; btnCancel.className='text-sm text-red-600 mr-2'; btnCancel.textContent='Cancelar';
    btnCancel.addEventListener('click', async ()=>{
      const ok = await confirm('Cancelar este agendamento?');
      if(!ok) return;
      try{
        const arr = safeParse('mock_appointments');
        const idx = arr.findIndex(x=>String(x.id)===String(a.id));
        if(idx>=0){ arr.splice(idx,1); save('mock_appointments', arr); toast('Agendamento cancelado', 'success'); document.dispatchEvent(new CustomEvent('agenda:refresh')); renderList(); }
      }catch(e){ console.error(e); toast('Falha ao cancelar', 'error'); }
    });
    actions.appendChild(btnCancel);
    // Reagendar button
    const btnReschedule = document.createElement('button'); btnReschedule.type='button'; btnReschedule.className='text-sm text-blue-600'; btnReschedule.textContent='Reagendar';
    btnReschedule.addEventListener('click', async () => {
      try{
        // find provider and appointments
        const providers = (function(){ try{ const s = localStorage.getItem('mock_providers'); return s? JSON.parse(s): []; }catch(e){ return []; }})();
        const provider = providers.find(p => String(p.id) === String(a.providerId || a.provider));
        if(!provider){ toast('Prestador não encontrado', 'error'); return; }
        // determine service/duration
        let duration = DEFAULT_SLOT_MINUTES;
        if(a.duration) duration = Number(a.duration) || duration;
        else if(a.service && Array.isArray(provider.services)){
          const s = provider.services.find(x => String(x.id) === String(a.service) || String(x.name) === String(a.service));
          if(s && s.duration) duration = Number(s.duration) || duration;
        }
        const appts = (function(){ try{ const s = localStorage.getItem('mock_appointments'); return s? JSON.parse(s) : []; }catch(e){ return []; } })();

        // build modal content
        const container = document.createElement('div');
        container.className = 'space-y-3';
        const info = document.createElement('div'); info.className='text-sm text-gray-700'; info.textContent = `Escolha novo horário para ${provider.name} (duração ${duration} min)`;
        container.appendChild(info);
        const dateRow = document.createElement('div'); dateRow.className = 'flex items-center gap-2';
        const dateInput = document.createElement('input'); dateInput.type='date'; dateInput.className='p-1 border rounded';
        const initial = toDateObj(a.date) || new Date();
        const pad = (n)=> String(n).padStart(2,'0');
        dateInput.value = `${initial.getFullYear()}-${pad(initial.getMonth()+1)}-${pad(initial.getDate())}`;
        dateRow.appendChild(dateInput);
        container.appendChild(dateRow);
        const slotsRoot = document.createElement('div'); slotsRoot.className='grid grid-cols-2 md:grid-cols-4 gap-2';
        container.appendChild(slotsRoot);

        // render slots for selected date
        function renderSlotsForDate(dateStr){
          slotsRoot.innerHTML = '';
          const d = new Date(dateStr + 'T00:00:00');
          if(Number.isNaN(d.getTime())) return;
          const year = d.getFullYear(), month = d.getMonth(), day = d.getDate();
          const slots = generateSlotsForDay(year, month, day, { interval: duration });
          // exclude the appointment being rescheduled when checking availability
          const otherAppts = appts.filter(x => String(x.id) !== String(a.id));
          for(const slot of slots){
            const taken = !isSlotAvailable(slot, duration, provider, otherAppts);
            const btn = document.createElement('button'); btn.type='button'; btn.className = `p-2 rounded text-sm ${taken? 'bg-red-50 text-red-700':'bg-green-50 text-green-700'}`;
            btn.textContent = formatTimeShort(slot);
            if(taken) btn.disabled = true;
            else btn.addEventListener('click', () => {
              // close modal via backdrop.__resolve
              const root = document.getElementById('app-modal-root');
              if(root && root.lastChild && root.lastChild.__resolve) root.lastChild.__resolve(slot.toISOString());
            });
            slotsRoot.appendChild(btn);
          }
        }

        // open modal
        const p = show(container, { title: 'Reagendar' });
        // after open, render slots for initial date
        renderSlotsForDate(dateInput.value);
        dateInput.addEventListener('change', () => renderSlotsForDate(dateInput.value));
        const chosen = await p; // resolved when backdrop.__resolve called or closed
        if(chosen){
          // update appointment
          try{
            const arr = (function(){ try{ const s = localStorage.getItem('mock_appointments'); return s? JSON.parse(s): []; }catch(e){ return []; } })();
            const idx = arr.findIndex(x => String(x.id) === String(a.id));
            if(idx>=0){ arr[idx].date = chosen; localStorage.setItem('mock_appointments', JSON.stringify(arr)); toast('Agendamento reagendado', 'success'); document.dispatchEvent(new CustomEvent('agenda:refresh')); renderList(); }
          }catch(e){ console.error(e); toast('Falha ao reagendar', 'error'); }
        }
      }catch(e){ console.error(e); toast('Erro ao abrir reagendamento', 'error'); }
    });
    actions.appendChild(btnReschedule);
    card.appendChild(left); card.appendChild(actions);
    list.appendChild(card);
  }

  function renderList(){ if(contentRoot){ contentRoot.innerHTML=''; contentRoot.appendChild(list); } }
  renderList();
}
