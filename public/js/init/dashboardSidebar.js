import { resolvePath, dashboardForUser } from '../utils/roleRouter.js';

export function initDashboardSidebar() {
  const dashboard = document.querySelector('[data-component="dashboard"]');
  if (!dashboard) return;
  const sidebarAgenda = dashboard.querySelector('#sidebar-agenda-link');
  const sidebarDashboard = dashboard.querySelector('#sidebar-dashboard-link');
  const sidebarProfile = dashboard.querySelector('#sidebar-profile-link');

  if (sidebarAgenda) sidebarAgenda.setAttribute('href', resolvePath('agenda.html'));
  if (sidebarProfile) sidebarProfile.setAttribute('href', resolvePath('profile.html'));

  var user = null;
  try { var s = localStorage.getItem('user'); if (s) user = JSON.parse(s); } catch (e) { user = null; }
  if (!user && window.__USER__) user = window.__USER__;

  if (sidebarDashboard) {
    const dash = dashboardForUser(user);
    sidebarDashboard.setAttribute('href', resolvePath(dash));
  }
}
