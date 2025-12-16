const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function isEmail(value) {
  const v = (value||'').toString().trim();
  const ok = v === '' ? true : emailRe.test(v); // leave required checks to `required` validator
  return {
    valid: ok,
    message: ok ? null : 'Email inválido'
  };
}
