// Simulated booking backend: deterministic availability, latency, and two failure modes.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HOURS = [9, 9.5, 10, 10.5, 11, 11.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5];

export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isClosed = (d) => d.getDay() === 0;

function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}
export const fmtTime = (h) => {
  const hh = Math.floor(h), mm = h % 1 ? '30' : '00';
  return `${((hh + 11) % 12) + 1}:${mm} ${hh >= 12 ? 'PM' : 'AM'}`;
};

let failedOnce = new Set();
let conflictOnce = false;

export async function loadSlots(date, groomer, mins, taken) {
  await wait(650);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
  // Saturdays: the first load of each session fails, to prove the error path
  const k = dayKey(date);
  if (date.getDay() === 6 && !failedOnce.has(k)) { failedOnce.add(k); throw new Error('timeout'); }
  if (isClosed(date)) return [];
  const slotsNeeded = Math.ceil(mins / 30);
  const today = dayKey(new Date()) === k;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const free = HOURS.map((h) => {
    const busy = hash(`${k}|${groomer}|${h}`) < (date.getDay() === 6 ? 0.55 : 0.32);
    const mine = taken.some((b) => b.day === k && b.time === h);
    const past = today && h <= nowH + 1;
    const fits = HOURS.slice(HOURS.indexOf(h), HOURS.indexOf(h) + slotsNeeded).length === slotsNeeded &&
      h + slotsNeeded * 0.5 <= 17.5 && !(h < 12 && h + slotsNeeded * 0.5 > 12.5);
    return { time: h, open: !busy && !mine && !past && fits };
  });
  return free;
}

export async function createBooking(payload) {
  await wait(900);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw Object.assign(new Error('offline'), { code: 'offline' });
  // The 11:00 AM slot is "grabbed by someone else" once per session
  if (payload.time === 11 && !conflictOnce) { conflictOnce = true; throw Object.assign(new Error('taken'), { code: 'taken' }); }
  return { id: 'B' + Math.random().toString(36).slice(2, 7).toUpperCase(), ...payload };
}
