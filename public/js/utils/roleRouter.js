export function resolvePath(p) {
  const path = location.pathname || '';
  const inPages = path.includes('/pages/')
  if (inPages) return p;
  return 'pages/' + p;
}

export function dashboardForUser(user) {
  if (!user) return 'dashboard.html';
  if (user.role === 'prestador') return 'dashboardPrestador.html';
  if (user.role === 'cliente') return 'dashboardCliente.html';
  return 'dashboard.html';
}

export default { resolvePath, dashboardForUser };
