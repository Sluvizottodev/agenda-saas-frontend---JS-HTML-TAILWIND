import { loadComponents } from './init/loader.js';
import { mountToaster } from './init/toaster.js';
import { initHeader } from './init/header.js';
import { initFooter } from './init/footer.js';
import { initDashboardSidebar } from './init/dashboardSidebar.js';
import { initRegisterForm } from './init/registerForm.js';
import { seedDefault } from './init/seed.js';
import { setupGlobalErrorHandler, setupPageNotFoundHandler } from './utils/globalErrorHandler.js';

export async function loadHeaderFooter() {
  try {
    const headerResponse = await fetch('/components/header.html');
    if (headerResponse.ok) {
      const headerHtml = await headerResponse.text();
      const headerPlaceholder = document.getElementById('header-placeholder');
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
      }
    }

    const footerResponse = await fetch('/components/footer.html');
    if (footerResponse.ok) {
      const footerHtml = await footerResponse.text();
      const footerPlaceholder = document.getElementById('footer-placeholder');
      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar header/footer:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="style.css"]'));
    links.forEach(l => {
      const url = new URL(l.getAttribute('href'), location.origin);
      url.searchParams.set('ts', Date.now());
      l.setAttribute('href', url.toString());
    });
  } catch (e) { }

  setupGlobalErrorHandler();
  setupPageNotFoundHandler();

  await loadComponents().catch(console.error);
  try { seedDefault(); } catch (e) { console.warn('seed error', e); }
  mountToaster();
  initHeader();
  initDashboardSidebar();
  initFooter();
  initRegisterForm();
});

export { loadComponents };
