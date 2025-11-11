export default function isISODate(value) {
  if (!value) return { valid: true, message: null }; // non-required
  try {
    const d = new Date(value);
    const ok = !Number.isNaN(d.getTime());
    return { valid: ok, message: ok ? null : 'Data inválida' };
  } catch (e) {
    return { valid: false, message: 'Data inválida' };
  }
}
