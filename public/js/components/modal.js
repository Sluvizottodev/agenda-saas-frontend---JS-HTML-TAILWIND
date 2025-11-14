function ensureModalRoot(){
  let root = document.getElementById('app-modal-root');
  if(root) return root;
  root = document.createElement('div');
  root.id = 'app-modal-root';
  root.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
  document.body.appendChild(root);
  return root;
}

function makeBackdrop(){
  const b = document.createElement('div');
  b.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-auto';
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-black opacity-40';
  b.appendChild(overlay);
  return b;
}

function escapeHtml(str){
  if(typeof str !== 'string') return '' + (str ?? '');
  return str.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

export function alert(message) {
  return showSimple(message, { hideCancel: true });
}

export function confirm(message) {
  return showSimple(message, { hideCancel: false });
}

function showSimple(message, opts = {}) {
  return new Promise((resolve) => {
    const root = ensureModalRoot();
    const el = document.createElement('div');
    el.className = 'modal-card p-4 bg-white rounded shadow max-w-lg w-full';
    el.innerHTML = `<p class="mb-4">${escapeHtml(message)}</p>`;
    const btns = document.createElement('div');
    btns.className = 'flex gap-2 justify-end';
    const ok = document.createElement('button');
    ok.className = 'px-4 py-2 bg-blue-600 text-white rounded';
    ok.textContent = 'OK';
    const cancel = document.createElement('button');
    cancel.className = 'px-4 py-2 bg-gray-200 rounded';
    cancel.textContent = 'Cancelar';
    ok.addEventListener('click', () => {
      backdrop.remove();
      resolve(true);
    });
    cancel.addEventListener('click', () => {
      backdrop.remove();
      resolve(false);
    });
    if (!opts.hideCancel) btns.appendChild(cancel);
    btns.appendChild(ok);
    el.appendChild(btns);
  const backdrop = makeBackdrop();
  backdrop.appendChild(el);
  root.appendChild(backdrop);
  });
}

// New: show arbitrary content in a modal and return a promise resolved with a result.
export function show(content, { title = '', hideClose = false } = {}) {
  return new Promise((resolve) => {
    const root = ensureModalRoot();
    const el = document.createElement('div');
    el.className = 'modal-card p-4 bg-white rounded shadow max-w-2xl w-full';
    if (title) {
      const h = document.createElement('h3');
      h.className = 'text-lg font-semibold mb-3';
      h.textContent = title;
      el.appendChild(h);
    }
    const contentContainer = document.createElement('div');
    if (typeof content === 'string') contentContainer.innerHTML = content;
    else contentContainer.appendChild(content);
    el.appendChild(contentContainer);

    if (!hideClose) {
      const close = document.createElement('button');
      close.className = 'mt-4 px-3 py-1 text-sm bg-gray-200 rounded';
      close.textContent = 'Fechar';
      close.addEventListener('click', () => {
        backdrop.remove();
        resolve(null);
      });
      el.appendChild(close);
    }

    const backdrop = makeBackdrop();
    backdrop.appendChild(el);
    root.appendChild(backdrop);
    backdrop.__resolve = (res) => {
      if (root.contains(backdrop)) backdrop.remove();
      resolve(res);
    };
  });
}
