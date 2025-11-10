import { loadComponents } from './init/loader.js';
import { mountToaster } from './init/toaster.js';
import { initHeader } from './init/header.js';
import { initFooter } from './init/footer.js';
import { initDashboardSidebar } from './init/dashboardSidebar.js';
import { initRegisterForm } from './init/registerForm.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="style.css"]'));
    links.forEach(l => {
      const url = new URL(l.getAttribute('href'), location.origin);
      url.searchParams.set('ts', Date.now());
      l.setAttribute('href', url.toString());
    });
  } catch (e) { }

  await loadComponents().catch(console.error);
  mountToaster();
  initHeader();
  initDashboardSidebar();
  initFooter();
  initRegisterForm();
});

export { loadComponents };
