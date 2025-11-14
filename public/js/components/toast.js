function ensureToastContainer(){
  let c = document.getElementById('app-toast-container');
  if(c) return c;
  c = document.createElement('div'); c.id = 'app-toast-container';
  c.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
  document.body.appendChild(c);
  return c;
}

export function toast(message, type='info', timeout=3000){
  try{
    const c = ensureToastContainer();
    const el = document.createElement('div');
    const color = type === 'error' ? 'bg-red-100 text-red-900' : type === 'success' ? 'bg-green-100 text-green-900' : 'bg-gray-100 text-gray-900';
    el.className = `${color} px-3 py-2 rounded shadow text-sm`;
    el.textContent = message;
    c.appendChild(el);
    setTimeout(()=>{ el.classList.add('opacity-0'); setTimeout(()=> el.remove(), 300); }, timeout);
    return el;
  }catch(e){ try{ console.log(message); }catch(_){} }
}

export default { toast };
