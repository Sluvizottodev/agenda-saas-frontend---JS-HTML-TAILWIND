export default function required(value) {
  const exists = value !== null && value !== undefined && String(value).trim() !== '';
  return {
    valid: exists,
    message: exists ? null : 'Campo obrigatório'
  };
}
