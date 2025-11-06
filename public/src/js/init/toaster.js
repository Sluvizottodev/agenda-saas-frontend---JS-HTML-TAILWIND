export function mountToaster() {
  const container = document.createElement('div');
  container.id = 'app-toaster';
  container.className = 'fixed top-4 right-4 z-50 space-y-2';
  document.body.appendChild(container);

  window.addEventListener('app:toast', (e) => {
    const { message, kind } = e.detail || {};
    const el = document.createElement('div');
    el.className = 'px-4 py-2 rounded shadow text-white';
    el.style.minWidth = '200px';
    if (kind === 'success') el.style.background = '#16a34a';
    else if (kind === 'error') el.style.background = '#dc2626';
    else el.style.background = '#2563eb';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  });
}
