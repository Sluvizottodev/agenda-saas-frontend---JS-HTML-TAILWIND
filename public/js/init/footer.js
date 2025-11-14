import { resolvePath, dashboardForUser } from '../utils/roleRouter.js';

export function initFooter() {
  const footer = document.querySelector('[data-component="footer"]');
  if (!footer) return;
  const links = footer.querySelectorAll('a');
  for (const a of links) {
    const href = a.getAttribute('href');
    if (!href) continue;
    if (href.endsWith('agenda.html')) a.setAttribute('href', resolvePath('agenda.html'));
    if (href.endsWith('login.html')) a.setAttribute('href', resolvePath('login.html'));
    if (href.endsWith('register.html')) a.setAttribute('href', resolvePath('register.html'));
    if (href.endsWith('dashboard.html')) {
      // resolve to role-based dashboard if user is present
      let user = null;
      try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
      const dash = dashboardForUser(user);
      a.setAttribute('href', resolvePath(dash));
    }
  }
}
