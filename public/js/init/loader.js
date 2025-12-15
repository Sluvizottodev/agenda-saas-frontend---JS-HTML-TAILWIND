async function fetchComponent(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      console.warn(`Failed to load component from ${path}: status ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) { 
    console.warn(`Failed to load component from ${path}:`, e.message);
    return null; 
  }
}

export async function loadComponents() {
  const components = document.querySelectorAll('[data-component]');
  
  if (components.length === 0) {
    console.log('No components found to load');
    return;
  }
  
  console.log(`Loading ${components.length} component(s)...`);
  
  for (const el of components) {
    const name = el.getAttribute('data-component');
    console.log(`Loading component: "${name}"`);
    
    const currentPath = window.location.pathname;
    const isInPages = currentPath.includes('/pages/');
    
    const tryPaths = [
      isInPages ? `../components/${name}.html` : `/components/${name}.html`,
      `/components/${name}.html`,

      `./components/${name}.html`,

      `/public/components/${name}.html`,
    ];
    
    let html = null;
    let loadedFrom = null;
    
    for (const p of tryPaths) {
      html = await fetchComponent(p);
      if (html) {
        loadedFrom = p;
        break;
      }
    }
    
    if (html) {
      console.log(`✓ Loaded component "${name}" from ${loadedFrom}`);
      el.innerHTML = html;
    } else {
      console.error(`✗ Component not found: "${name}". Tried paths:`, tryPaths);
      el.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <strong>Erro ao carregar:</strong> Componente "<strong>${name}</strong>" não encontrado.
          <br><small>Caminhos tentados: ${tryPaths.join(', ')}</small>
        </div>
      `;
    }
  }
}
