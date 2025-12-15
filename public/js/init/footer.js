import { resolvePath, dashboardForUser } from '../utils/roleRouter.js';
import { FooterManager } from '../components/footer.js';

export function initFooter() {
  const footer = document.querySelector('[data-component="footer"]');
  if (!footer) return;
  
  new FooterManager();
}
}
