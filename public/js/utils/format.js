export function toDateObj(d){
  if (!d) return null;
  if (d instanceof Date) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function formatDateReadable(input, opts = {}){
  try{
    const locale = opts.locale || 'pt-BR';
    const dt = toDateObj(input);
    if(!dt) return input || '';
    if(opts.dateOnly) return dt.toLocaleDateString(locale);
    if(opts.timeOnly) return dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }catch(e){ return input; }
}

export function formatMonthYear(year, month, locale = 'pt-BR'){
  try{
    const dt = new Date(year, month, 1);
    return dt.toLocaleString(locale, { month: 'long', year: 'numeric' });
  }catch(e){ return `${month+1}/${year}`; }
}

export function formatTimeShort(input, locale = 'pt-BR'){
  const dt = toDateObj(input);
  if(!dt) return '';
  return dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function toInputDatetimeLocal(input){
  const dt = toDateObj(input) || new Date();
  const pad = (n) => String(n).padStart(2,'0');
  const year = dt.getFullYear();
  const month = pad(dt.getMonth()+1);
  const day = pad(dt.getDate());
  const hour = pad(dt.getHours());
  const minute = pad(dt.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default { toDateObj, formatDateReadable, formatMonthYear, formatTimeShort, toInputDatetimeLocal };
