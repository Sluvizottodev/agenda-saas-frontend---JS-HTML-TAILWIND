import { loadComponents } from './init/loader.js';
import { mountToaster } from './init/toaster.js';
import { initHeader } from './init/header.js';
import { initFooter } from './init/footer.js';
import { initDashboardSidebar } from './init/dashboardSidebar.js';
import { initRegisterForm } from './init/registerForm.js';
import { seedDefault } from './init/seed.js';

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
  try { seedDefault(); } catch (e) { console.warn('seed error', e); }
  mountToaster();
  initHeader();
  initDashboardSidebar();
  initFooter();
  initRegisterForm();
  
  function adjustBodyForFixedBars(){
    try{
      const hdr = document.querySelector('header');
      const ftr = document.querySelector('footer');
      const neededTop = hdr ? Math.ceil(hdr.getBoundingClientRect().height) : 0;
      const neededBottom = ftr ? Math.ceil(ftr.getBoundingClientRect().height) : 0;
  // small gap so content doesn't butt against header
  const GAP = 8;
  // pages like agenda or dashboard benefit from a larger top spacing
  const LARGE_PAGE_GAP = 32;
  // detect common signals for agenda/dashboard pages
  const isAgenda = !!document.getElementById('calendar-root') || location.pathname.includes('agenda');
  const isDashboard = !!document.getElementById('dashboard-title') || location.pathname.includes('dashboard');
  const extra = (isAgenda || isDashboard) ? LARGE_PAGE_GAP : GAP;
  const topGap = neededTop ? (neededTop + extra) : 0;
      
      const main = document.querySelector('main')
        || document.querySelector('[role="main"]')
        || document.getElementById('role-area')
        || document.querySelector('[data-component="dashboard"]')
        || Array.from(document.body.children).find(c => {
          try{
            if(!c) return false;
            if (hdr && (c === hdr || c.contains(hdr))) return false;
            if (ftr && (c === ftr || c.contains(ftr))) return false;
            // skip script/template/style/meta
            if (['SCRIPT','TEMPLATE','STYLE','LINK','META'].includes(c.tagName)) return false;
            return true;
          }catch(e){ return false; }
        });
      if (main) {
        if (main.style.marginTop !== topGap + 'px') main.style.marginTop = topGap + 'px';
        if (main.style.marginBottom !== neededBottom + 'px') main.style.marginBottom = neededBottom + 'px';
        const min = `calc(100vh - ${topGap + neededBottom}px)`;
        if (main.style.minHeight !== min) main.style.minHeight = min;
      }
      if(!main) {
        if(document.body.style.paddingTop !== topGap + 'px') document.body.style.paddingTop = topGap + 'px';
        if(document.body.style.paddingBottom !== neededBottom + 'px') document.body.style.paddingBottom = neededBottom + 'px';
      }
    }catch(e){  }
  }

  adjustBodyForFixedBars();
  window.addEventListener('resize', adjustBodyForFixedBars, { passive: true });
  if (typeof ResizeObserver !== 'undefined'){
    try{
      const hdr = document.querySelector('header');
      const ftr = document.querySelector('footer');
      const ro = new ResizeObserver(adjustBodyForFixedBars);
      if(hdr) ro.observe(hdr);
      if(ftr) ro.observe(ftr);
    }catch(e){  }
  }
});

export { loadComponents };
