// Local-date helpers. A day is an ISO string "YYYY-MM-DD" in the salon's (the user's) time zone.
export function isoOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function dateOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}
export function addDays(iso, n) {
  const d = dateOf(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
export function today() {
  return isoOf(new Date());
}
export function bookableDays(count = 7) {
  const start = addDays(today(), 1);
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}
const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' });
const long = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const mid = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const dayShort = (iso) => short.format(dateOf(iso));
export const dayLong = (iso) => long.format(dateOf(iso));
export const dayMid = (iso) => mid.format(dateOf(iso));
export const isSunday = (iso) => dateOf(iso).getDay() === 0;
export const dayIndex = (iso) => Math.round(dateOf(iso).getTime() / 86400000);
