export default function isPasswordStrong(value, options = {}) {
  const v = (value||'').toString();
  const min = options.minLength || 6;
  const requireMixed = options.requireMixed || false; // letters + numbers
  let valid = v.length >= min;
  if (valid && requireMixed) {
    valid = /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
  }
  return {
    valid,
    message: valid ? null : `Senha fraca (mínimo ${min}${requireMixed?', letras e números':''})`
  };
}
