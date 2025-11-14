import { resolvePath, dashboardForUser } from '../utils/roleRouter.js';

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

  if (linkLogin) linkLogin.setAttribute('href', resolvePath('login.html'));
  if (linkRegister) linkRegister.setAttribute('href', resolvePath('register.html'));
  if (linkAgenda) linkAgenda.setAttribute('href', resolvePath('agenda.html'));
  if (linkProfile) linkProfile.setAttribute('href', resolvePath('profile.html'));
  if (headerLogo) headerLogo.setAttribute('href', resolvePath('agenda.html'));

  const toggleBtn = header.querySelector('#header-toggle');
  const menu = header.querySelector('#header-menu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function(){
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      menu.classList.toggle('hidden');
    });
    // close menu when a link inside is clicked (mobile)
    menu.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (a && window.getComputedStyle(toggleBtn).display !== 'none'){
        menu.classList.add('hidden');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
    // close on Escape key
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !menu.classList.contains('hidden')){
        menu.classList.add('hidden');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
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
      const dash = dashboardForUser(user);
      linkDashboard.setAttribute('href', resolvePath(dash));
    }
    if (btnLogout) btnLogout.addEventListener('click', function(){ localStorage.removeItem('user'); window.location.href = resolvePath('login.html'); });

    try{
      const actionsContainerId = 'header-quick-actions';
      let actions = header.querySelector('#' + actionsContainerId);
      if(!actions){
        actions = document.createElement('div');
        actions.id = actionsContainerId;
        actions.className = 'hidden md:flex items-center gap-2 ml-4';
        if(headerUsername && headerUsername.parentNode) headerUsername.parentNode.insertBefore(actions, headerUsername.nextSibling);
      }
      actions.innerHTML = '';
      const aAgenda = document.createElement('a'); aAgenda.href = resolvePath('agenda.html'); aAgenda.className = 'px-3 py-1 rounded bg-blue-600 text-white text-sm'; aAgenda.textContent = 'Agenda';
      const aDash = document.createElement('a'); aDash.href = resolvePath(dashboardForUser(user)); aDash.className = 'px-3 py-1 rounded border text-sm'; aDash.textContent = 'Dashboard';
      actions.appendChild(aAgenda); actions.appendChild(aDash);
    }catch(e){}
  } else {
    if (navLoggedOut) navLoggedOut.classList.remove('hidden');
    if (navLoggedIn) navLoggedIn.classList.add('hidden');
  }
}
