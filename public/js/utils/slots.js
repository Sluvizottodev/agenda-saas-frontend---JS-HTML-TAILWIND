export const DEFAULT_SLOT_MINUTES = 30;
export const DEFAULT_WORK_START = 9;
export const DEFAULT_WORK_END = 17;

export function toDateObj(d){
  if(!d) return null;
  if (d instanceof Date) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function getAppointmentIntervalsForProvider(provider, appointments){
  const intervals = [];
  for (const a of appointments || []){
    try{
      if (String(a.providerId || a.provider) !== String(provider.id)) continue;
      const start = toDateObj(a.date);
      if(!start) continue;
      let duration = DEFAULT_SLOT_MINUTES;
      if (a.duration) duration = Number(a.duration) || duration;
      else if (a.service && Array.isArray(provider.services)){
        const s = provider.services.find(x => String(x.id) === String(a.service) || String(x.name) === String(a.service));
        if (s && s.duration) duration = Number(s.duration) || duration;
      }
      const end = new Date(start.getTime() + duration * 60 * 1000);
      intervals.push({ start, end });
    }catch(e){ }
  }
  return intervals;
}

export function isSlotAvailable(slotStart, durationMinutes, provider, appointments){
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
  const intervals = getAppointmentIntervalsForProvider(provider, appointments);
  for (const iv of intervals){
    if (slotStart < iv.end && slotEnd > iv.start) return false;
  }
  return true;
}

export function generateSlotsForDay(year, month, day, options = {}){
  const start = options.start || DEFAULT_WORK_START;
  const end = options.end || DEFAULT_WORK_END;
  const interval = options.interval || DEFAULT_SLOT_MINUTES;
  const slots = [];
  for (let h = start; h < end; h++){
    for (let m = 0; m < 60; m += interval){
      slots.push(new Date(year, month, day, h, m, 0, 0));
    }
  }
  return slots;
}

export default { toDateObj, getAppointmentIntervalsForProvider, isSlotAvailable, generateSlotsForDay };
