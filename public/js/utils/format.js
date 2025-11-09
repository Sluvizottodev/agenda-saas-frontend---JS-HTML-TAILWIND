export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}
