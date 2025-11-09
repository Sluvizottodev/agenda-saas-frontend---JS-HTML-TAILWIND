export function initFooter() {
  const footer = document.querySelector('[data-component="footer"]');
  if (!footer) return;
  function resolve(p) { const path = location.pathname || ''; const inPages = path.includes('/pages/') || path.includes('/src/pages/'); return inPages ? p : '/src/pages/' + p; }
  const links = footer.querySelectorAll('a');
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.endsWith('agenda.html')) a.setAttribute('href', resolve('agenda.html'));
    if (href.endsWith('login.html')) a.setAttribute('href', resolve('login.html'));
    if (href.endsWith('register.html')) a.setAttribute('href', resolve('register.html'));
  });
}
