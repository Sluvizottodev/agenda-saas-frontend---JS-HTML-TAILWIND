export function initDashboardSidebar() {
  const dashboard = document.querySelector('[data-component="dashboard"]');
  if (!dashboard) return;
  const sidebarAgenda = dashboard.querySelector('#sidebar-agenda-link');
  const sidebarDashboard = dashboard.querySelector('#sidebar-dashboard-link');
  const sidebarProfile = dashboard.querySelector('#sidebar-profile-link');

  function resolve(p) { const path = location.pathname || ''; const inPages = path.includes('/pages/') || path.includes('/src/pages/'); return inPages ? p : '/src/pages/' + p; }

  if (sidebarAgenda) sidebarAgenda.setAttribute('href', resolve('agenda.html'));
  if (sidebarProfile) sidebarProfile.setAttribute('href', resolve('profile.html'));

  var user = null;
  try { var s = localStorage.getItem('user'); if (s) user = JSON.parse(s); } catch (e) { user = null; }
  if (!user && window.__USER__) user = window.__USER__;

  if (sidebarDashboard) {
    var dash = 'dashboard.html';
    if (user && user.role === 'prestador') dash = 'dashboardPrestador.html';
    else if (user && user.role === 'cliente') dash = 'dashboardCliente.html';
    sidebarDashboard.setAttribute('href', resolve(dash));
  }
}
