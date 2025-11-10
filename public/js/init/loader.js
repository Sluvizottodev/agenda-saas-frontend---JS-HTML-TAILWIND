async function fetchComponent(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) { return null; }
}

export async function loadComponents() {
  const components = document.querySelectorAll('[data-component]');
  for (const el of components) {
    const name = el.getAttribute('data-component');
      const tryPaths = [`/components/${name}.html`, `/public/components/${name}.html`, `/src/components/${name}.html`, `/public/src/components/${name}.html`, `../components/${name}.html`, `./components/${name}.html`];
    let html = null;
    for (const p of tryPaths) {
      html = await fetchComponent(p);
      if (html) break;
    }
    if (html) el.innerHTML = html;
  }
}
