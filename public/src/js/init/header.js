export function initHeader() {
  const header = document.querySelector('[data-component="header"]');
  if (!header) return;
  const navLoggedOut = header.querySelector('#nav-logged-out');
  const navLoggedIn = header.querySelector('#nav-logged-in');
  const linkLogin = header.querySelector('#link-login');
  const linkRegister = header.querySelector('#link-register');
  const linkAgenda = header.querySelector('#link-agenda');
  const linkDashboard = header.querySelector('#link-dashboard');
  const linkProfile = header.querySelector('#link-profile');
  const btnLogout = header.querySelector('#btn-logout');
  const headerLogo = header.querySelector('#header-logo');
  const headerUsername = header.querySelector('#header-username');

  function resolve(p) { const path = location.pathname || ''; const inPages = path.includes('/pages/') || path.includes('/src/pages/'); return inPages ? p : '/src/pages/' + p; }

  if (linkLogin) linkLogin.setAttribute('href', resolve('login.html'));
  if (linkRegister) linkRegister.setAttribute('href', resolve('register.html'));
  if (linkAgenda) linkAgenda.setAttribute('href', resolve('agenda.html'));
  if (linkProfile) linkProfile.setAttribute('href', resolve('profile.html'));
  if (headerLogo) headerLogo.setAttribute('href', resolve('agenda.html'));

  const toggleBtn = header.querySelector('#header-toggle');
  const menu = document.getElementById('header-menu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function(){
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      menu.classList.toggle('hidden');
    });
  }

  var user = null;
  try { var s = localStorage.getItem('user'); if (s) user = JSON.parse(s); } catch (e) { user = null; }
  if (!user && window.__USER__) user = window.__USER__;

  if (user) {
    if (navLoggedOut) navLoggedOut.classList.add('hidden');
    if (navLoggedIn) navLoggedIn.classList.remove('hidden');
    if (headerUsername) headerUsername.textContent = user.name || user.email || 'Usuário';
    if (linkDashboard) {
      var dash = 'dashboard.html';
      if (user.role === 'prestador') dash = 'dashboardPrestador.html';
      else if (user.role === 'cliente') dash = 'dashboardCliente.html';
      linkDashboard.setAttribute('href', resolve(dash));
    }
    if (btnLogout) btnLogout.addEventListener('click', function(){ localStorage.removeItem('user'); window.location.href = resolve('login.html'); });
  } else {
    if (navLoggedOut) navLoggedOut.classList.remove('hidden');
    if (navLoggedIn) navLoggedIn.classList.add('hidden');
  }
}
