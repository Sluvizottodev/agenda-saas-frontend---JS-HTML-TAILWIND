export function showToast(message, kind = 'info') {
  const evt = new CustomEvent('app:toast', { detail: { message, kind } });
  window.dispatchEvent(evt);
}

export function showToastExternal(message, kind = 'info') {
  showToast(message, kind);
}
