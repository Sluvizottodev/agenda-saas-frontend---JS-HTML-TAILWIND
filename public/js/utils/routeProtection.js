import authManager from './auth.js';
import router from './router.js';

const PUBLIC_PAGES = ['login', 'register', 'index'];

const PROTECTED_PAGES = ['dashboardCliente', 'dashboardPrestador', 'profile', 'agenda', 'appointments', 'agendar-servico', 'clientes', 'prestadores', 'servicos', 'agendamentos', 'agenda-prestador'];

// mapeamento roles -> page
const ROLE_PAGE_MAP = {
  'CLIENTE': ['dashboardCliente', 'agenda', 'appointments', 'agendar-servico', 'prestadores', 'servicos', 'profile'],
  'PRESTADOR': ['dashboardPrestador', 'agenda-prestador', 'agendamentos', 'clientes', 'profile'],
  'ADMIN': ['dashboardCliente', 'dashboardPrestador', 'agenda', 'appointments', 'clientes', 'prestadores', 'profile']
};

function getCurrentPageName() {
  const pathname = window.location.pathname;
  const pageName = pathname.split('/').pop().replace('.html', '');
  return pageName || 'index';
}

function isProtectedPage(pageName) {
  return PROTECTED_PAGES.includes(pageName);
}

function hasAccessToPage(pageName, userRole) {
  const allowedPages = ROLE_PAGE_MAP[userRole] || [];
  return allowedPages.includes(pageName);
}

export function protectRoute() {
  const currentPage = getCurrentPageName();
  const isPublic = PUBLIC_PAGES.includes(currentPage);
  const isProtected = isProtectedPage(currentPage);

  if (isPublic) {
    return true;
  }

  if (isProtected) {
    const isAuthenticated = authManager.isAuthenticated();
    const userRole = authManager.getRole();

    if (!isAuthenticated) {
      console.warn(`Acesso negado a ${currentPage}: usuário não autenticado`);
      router.redirectToLogin();
      return false;
    }

    if (!userRole) {
      console.warn(`Acesso negado a ${currentPage}: role não definida`);
      router.redirectToLogin();
      return false;
    }

    if (!hasAccessToPage(currentPage, userRole)) {
      console.warn(`Acesso negado a ${currentPage}: usuário com role ${userRole} não tem permissão`);
      router.redirectToDashboard(authManager.getCurrentUser());
      return false;
    }

    return true;
  }

  console.warn(`Página não encontrada: ${currentPage}`);
  router.redirectToLogin();
  return false;
}

export default {
  protectRoute,
  getCurrentPageName,
  isProtectedPage,
  hasAccessToPage
};
