import api from '../api/api.js';
import {
  DEFAULT_SLOT_MINUTES,
  DEFAULT_WORK_START,
  DEFAULT_WORK_END,
  toDateObj,
  getAppointmentIntervalsForProvider,
  isSlotAvailable,
  generateSlotsForDay
} from '../utils/slots.js';
import { formatMonthYear, formatDateReadable, formatTimeShort } from '../utils/format.js';

const MAX_PER_DAY = 8; // max appointments indicating full day

async function getProviders(){
  try{
    const res = await api.listEntities('providers');
    if(Array.isArray(res)) return res;
  }catch(e){ /* fallback */ }
  try{ const s = localStorage.getItem('mock_providers'); return s? JSON.parse(s) : []; }catch(e){ return []; }
}

async function getAppointments(){
  try{
    const res = await api.listEntities('appointments');
    if(Array.isArray(res)) return res;
  }catch(e){ /* fallback */ }
  try{ const s = localStorage.getItem('mock_appointments'); return s? JSON.parse(s) : []; }catch(e){ return []; }
}

function clearNode(el){ while(el.firstChild) el.remove(); }

function renderProviders(list, onSelect, selectedId){
  const root = document.getElementById('providers-list');
  if(!root) return;
  clearNode(root);
  for (const p of list) {
    const btn = document.createElement('button');
    btn.type='button';
    btn.className = `w-full text-left px-3 py-2 rounded ${selectedId===p.id? 'bg-blue-50 border border-blue-200':'hover:bg-gray-50'}`;
    const servicesCount = Array.isArray(p.services) ? p.services.length : (p.specialty? 1 : 0);
    btn.innerHTML = `<div class="flex justify-between items-center"><span>${p.name}${p.specialty? ` — ${p.specialty}` : ''}</span><span class="text-xs text-gray-500">${servicesCount} serviço(s)</span></div>`;
    btn.addEventListener('click', () => onSelect(p));
    root.appendChild(btn);
  }
}

function renderServicesSelector(provider){
  const tit = document.getElementById('calendar-title');
  if(!tit) return;
  const existing = document.getElementById('services-row');
  if(existing) existing.remove();
  const row = document.createElement('div');
  row.id = 'services-row';
  row.className = 'flex items-center gap-2 mb-3 flex-wrap';
  const services = Array.isArray(provider.services) && provider.services.length ? provider.services : (provider.specialty? [{ id: 's-1', name: provider.specialty, duration: 30 }] : []);
  for(const s of services){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'px-2 py-1 text-sm bg-gray-100 rounded';
    b.textContent = s.name || s;
    b.dataset.serviceId = s.id || s.name;
    b.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('agenda:serviceSelected', { detail: { providerId: provider.id, service: s } }));
      for(const x of row.querySelectorAll('button')) x.classList.remove('bg-blue-100','text-blue-800');
      b.classList.add('bg-blue-100','text-blue-800');
    });
    row.appendChild(b);
  }
  tit.parentNode.insertBefore(row, tit.nextSibling);
}

function renderMonthNav(container, year, month, onChange){
  // remove existing nav
  const existing = document.getElementById('month-nav');
  if(existing) existing.remove();
  const nav = document.createElement('div'); nav.id = 'month-nav'; nav.className = 'flex items-center justify-between mb-2';
  const left = document.createElement('div');
  const btnPrev = document.createElement('button'); btnPrev.type='button'; btnPrev.className='px-2 py-1 bg-gray-100 rounded'; btnPrev.textContent = '<';
  const btnNext = document.createElement('button'); btnNext.type='button'; btnNext.className='px-2 py-1 bg-gray-100 rounded'; btnNext.textContent = '>';
  const label = document.createElement('div'); label.className='font-semibold text-center'; label.textContent = formatMonthYear(year, month);
  btnPrev.addEventListener('click', () => onChange(year, month - 1));
  btnNext.addEventListener('click', () => onChange(year, month + 1));
  left.appendChild(btnPrev); left.appendChild(label); left.appendChild(btnNext);
  nav.appendChild(left);
  const title = document.getElementById('calendar-title');
  if(title && title.parentNode) title.parentNode.insertBefore(nav, title.nextSibling);
}



function buildCalendarGrid(year, month){
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  const startWeekday = first.getDay();
  for(let i=0;i<startWeekday;i++) days.push(null);
  for(let d=1; d<= lastDay; d++) days.push(new Date(year, month, d));
  return days;
}

function renderCalendarForProvider(provider, appointments, yearArg, monthArg, onMonthChange){
  const title = document.getElementById('calendar-title');
  const cal = document.getElementById('calendar');
  if(!cal) return;
  const now = new Date();
  const year = Number.isFinite(yearArg) ? yearArg : now.getFullYear();
  const month = Number.isFinite(monthArg) ? monthArg : now.getMonth();
  title.textContent = `Agenda de ${provider.name} — ${formatMonthYear(year, month)}`;
  clearNode(cal);

  const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  weekdays.forEach(w => {
    const el = document.createElement('div');
    el.className = 'font-semibold text-center';
    el.textContent = w;
    cal.appendChild(el);
  });

  if (typeof onMonthChange === 'function') renderMonthNav(title, year, month, onMonthChange);
  const days = buildCalendarGrid(year, month);
  const apptsByDay = {};
  appointments.forEach(a => {
    const dt = toDateObj(a.date);
    if(!dt || !a) return;
    if(String(a.providerId || a.provider) !== String(provider.id) && a.client !== provider.name) {
      if(String(a.providerId || a.provider) !== String(provider.id)) return;
    }
    if(dt.getMonth() !== month || dt.getFullYear() !== year) return;
    const key = dt.getDate();
    apptsByDay[key] = (apptsByDay[key]||0) + 1;
  });

  for (const d of days) {
    const cell = document.createElement('div');
    if(!d){ cell.className='p-2'; cal.appendChild(cell); continue; }
    const dayNum = d.getDate();
    const count = apptsByDay[dayNum] || 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isPast = d < today;
    const available = !isPast && count < MAX_PER_DAY;
    cell.className = `p-2 border rounded text-center ${available? 'bg-green-50 text-green-800':'bg-red-50 text-red-600'} `;
    const num = document.createElement('div'); num.className='font-medium'; num.textContent = dayNum;
    const info = document.createElement('div'); info.className='text-xs';
    let infoText;
    if (isPast) infoText = '—';
    else if (available) infoText = `${MAX_PER_DAY - count} vagas`;
    else infoText = 'lotado';
    info.textContent = infoText;
    cell.appendChild(num); cell.appendChild(info);
    // click to show timeslots (if not past)
    if(!isPast){
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => showDaySlots(d, provider));
    }
    cal.appendChild(cell);
  }
}

function renderAppointmentsForProvider(provider, appointments){
  const root = document.getElementById('provider-appointments');
  if(!root) return;
  clearNode(root);
  const list = [];
  for (const a of appointments) {
    if (String(a.providerId || a.provider) === String(provider.id)) list.push(a);
  }
  if(list.length===0){ root.textContent = 'Sem agendamentos para este prestador.'; return; }
  const ul = document.createElement('ul'); ul.className='space-y-2';
  for (const a of list) {
    const li = document.createElement('li'); li.className='p-2 border rounded';
  const dt = toDateObj(a.date);
  const dateText = dt ? formatDateReadable(dt) : (a.date || '');
    li.innerHTML = `<div class="font-semibold">${a.title}</div><div class="text-xs text-gray-600">${dateText}</div>`;
    // allow provider to delete appointment if logged in as prestador
    try{
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user && user.role === 'prestador'){
        const btn = document.createElement('button'); btn.type='button'; btn.className='ml-2 text-sm text-red-600'; btn.textContent = 'Cancelar';
        btn.addEventListener('click', async () => {
          if(!confirm('Remover agendamento?')) return;
          // remove from localStorage fallback
          try{
            const key = 'mock_appointments';
            const s = localStorage.getItem(key); const arr = s? JSON.parse(s) : [];
            const idx = arr.findIndex(x => String(x.id) === String(a.id));
            if(idx>=0) { arr.splice(idx,1); localStorage.setItem(key, JSON.stringify(arr)); window.location.reload(); }
          }catch(e){ console.error(e); }
        });
        li.appendChild(btn);
      }
    }catch(e){}
    ul.appendChild(li);
  }
  root.appendChild(ul);
}


async function saveAppointmentLocal(appt){
  try{
    const key = 'mock_appointments';
    const s = localStorage.getItem(key); const arr = s? JSON.parse(s) : [];
    arr.push(appt);
    localStorage.setItem(key, JSON.stringify(arr));
    return true;
  }catch(e){ console.error('saveAppointmentLocal failed', e); return false; }
}

function ensureTimeslotRoot(){
  const root = document.getElementById('calendar-root');
  if(!root) return null;
  let r = document.getElementById('timeslots-root');
  if(r) return r;
  r = document.createElement('div'); r.id = 'timeslots-root'; r.className = 'bg-white rounded shadow p-4 mt-4';
  root.appendChild(r);
  return r;
}

function showDaySlots(dateObj, provider){
  const root = ensureTimeslotRoot(); if(!root) return;
  clearNode(root);
  const day = dateObj.getDate(); const month = dateObj.getMonth(); const year = dateObj.getFullYear();
  const h = document.createElement('h3'); h.className='text-lg font-semibold mb-2'; h.textContent = `Horários — ${provider.name} — ${formatDateReadable(dateObj, { dateOnly: true })}`;
  root.appendChild(h);
  const services = Array.isArray(provider.services) && provider.services.length ? provider.services : (provider.specialty? [{ id: 's-1', name: provider.specialty, duration: 30 }] : []);
  let selectedService = services[0] || null;
  if(services.length>1){
    const sel = document.createElement('select'); sel.className='mb-3 p-1 border rounded';
    for(const s of services){ const opt = document.createElement('option'); opt.value = s.id || s.name; opt.textContent = s.name || s; sel.appendChild(opt); }
    sel.addEventListener('change', () => { selectedService = services.find(ss => String(ss.id||ss.name) === sel.value); renderSlots(); });
    root.appendChild(sel);
  }

  const slotsContainer = document.createElement('div'); slotsContainer.className = 'grid grid-cols-2 md:grid-cols-4 gap-2';
  root.appendChild(slotsContainer);

  function renderSlots(){
    clearNode(slotsContainer);
    const slots = generateSlotsForDay(year, month, day, { interval: (selectedService && selectedService.duration) || DEFAULT_SLOT_MINUTES });
    const appts = (function(){ try{ const s = localStorage.getItem('mock_appointments'); return s? JSON.parse(s) : []; }catch(e){ return []; } })();
    for(const slot of slots){
      const duration = (selectedService && selectedService.duration) || DEFAULT_SLOT_MINUTES;
      const taken = !isSlotAvailable(slot, duration, provider, appts);
      const card = document.createElement('div'); card.className = `p-2 border rounded ${taken? 'bg-red-50 text-red-700':'bg-green-50 text-green-700'}`;
  const label = document.createElement('div'); label.className='font-medium'; label.textContent = formatTimeShort(slot);
      card.appendChild(label);
      const btn = document.createElement('button'); btn.type='button'; btn.className = 'mt-2 px-2 py-1 text-sm rounded';
      if(taken){ btn.textContent = 'Ocupado'; btn.disabled = true; }
      else { btn.textContent = 'Agendar'; btn.classList.add('bg-blue-600','text-white'); btn.addEventListener('click', async () => {
          // booking flow: get client name
          let clientName = 'Cliente';
          try{ const u = JSON.parse(localStorage.getItem('user')||'null'); if(u && u.name) clientName = u.name; }
          catch(e){}
          const title = (selectedService && (selectedService.name || selectedService)) ? `${selectedService.name} — ${clientName}` : `Agendamento — ${clientName}`;
          const appt = { id: Date.now(), title, client: clientName, providerId: provider.id, date: slot.toISOString(), service: selectedService ? (selectedService.id || selectedService.name) : null };
          const ok = await saveAppointmentLocal(appt);
          if(ok){ alert('Agendado');
            // notify app to refresh (initAgenda listens to this event)
            try{ document.dispatchEvent(new CustomEvent('agenda:refresh', { detail: { providerId: provider.id } })); }catch(e){}
            renderSlots();
          } else alert('Falha ao agendar');
      }); }
      card.appendChild(btn);
      slotsContainer.appendChild(card);
    }
  }

  renderSlots();
}

export default async function initAgenda(){
  const providers = await getProviders();
  let appointments = await getAppointments();
  let selected = providers[0];
  // calendar state
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();

  function renderForSelected(){
    if(!selected) return;
    renderProviders(providers, select, selected.id);
    renderCalendarForProvider(selected, appointments, currentYear, currentMonth, (y,m)=>{
      // normalize month/year (JS Date handles overflow but we want integers)
      const dt = new Date(y, m, 1);
      currentYear = dt.getFullYear();
      currentMonth = dt.getMonth();
      // re-render
      renderForSelected();
    });
    renderAppointmentsForProvider(selected, appointments);
    renderServicesSelector(selected);
  }

  function select(p){
    selected = p;
    // reset to current month when selecting different provider
    renderForSelected();
  }

  renderProviders(providers, select, selected? selected.id : null);
  if(selected){ renderForSelected(); }

  // refresh handler: when bookings change elsewhere in the UI
  document.addEventListener('agenda:refresh', async (ev) => {
    try{
      appointments = await getAppointments();
      renderForSelected();
    }catch(e){ console.error('agenda refresh failed', e); }
  });
}

// auto-init if loaded directly
if(document.readyState === 'complete' || document.readyState === 'interactive'){
  setTimeout(() => initAgenda().catch(() => {}), 0);
} else {
  document.addEventListener('DOMContentLoaded', () => initAgenda().catch(() => {}));
}
