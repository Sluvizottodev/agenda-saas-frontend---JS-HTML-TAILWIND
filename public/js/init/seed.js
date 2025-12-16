export function seedDefault() {
  try {
    const base = window.API_BASE || window.__API_BASE__ || '';

    if (base) return;

    if (localStorage.getItem('seeded')) return;

    // Users
    const users = [
      { id: 1, name: 'Usuário Teste', email: 'test@example.com', role: 'cliente', password: 'test123' },
      { id: 2, name: 'Prestador Demo', email: 'prestador@example.com', role: 'prestador', password: 'demo123' }
    ];
    localStorage.setItem('mock_users', JSON.stringify(users));

    // Appointments
    const now = new Date();
    const appts = [
      { id: 101, title: 'Corte de cabelo - João', client: 'Usuário Teste', providerId: 201, date: new Date(now.getTime() + 24*60*60*1000).toISOString() },
      { id: 102, title: 'Manicure - Maria', client: 'Usuário Teste', providerId: 202, date: new Date(now.getTime() + 48*60*60*1000).toISOString() },
      { id: 103, title: 'Coloração - Carlos', client: 'Outro Cliente', providerId: 201, date: new Date(now.getTime() + 72*60*60*1000).toISOString() }
    ];
    localStorage.setItem('mock_appointments', JSON.stringify(appts));

    // Providers
    const providers = [
      { id: 201, name: 'João Cabeleireiro', specialty: 'Corte' },
      { id: 202, name: 'Maria Manicure', specialty: 'Manicure' }
    ];
    localStorage.setItem('mock_providers', JSON.stringify(providers));


    localStorage.setItem('seeded', String(Date.now()));
    console.info('Seed data applied: users, appointments, providers');
  } catch (e) {
    console.warn('Seed failed', e);
  }
}

export default { seedDefault };
