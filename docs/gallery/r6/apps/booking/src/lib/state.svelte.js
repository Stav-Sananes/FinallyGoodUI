import { bookableDays, addDays, today } from './dates.js';
import { dogs, services, serviceById, dogById, minutesFor, priceFor } from './data.js';
import { slotsFor } from './schedule.js';

const KEY = 'pawprint.bookings.v1';

function seed() {
  const t = today();
  return [
    { id: 'PP-0388', dogId: 'biscuit', dogName: 'Biscuit', serviceId: 'full-groom', serviceName: 'Full groom', day: addDays(t, -42), lane: 'mara', s: 4, len: 9, price: 62, owner: 'Sam Ferreira', phone: '07700 900412', notes: '', nervous: false, status: 'done' },
    { id: 'PP-0391', dogId: 'juno', dogName: 'Juno', serviceId: 'de-shed', serviceName: 'De-shedding treatment', day: addDays(t, -30), lane: 'tobias', s: 10, len: 8, price: 58, owner: 'Sam Ferreira', phone: '07700 900412', notes: '', nervous: false, status: 'done' },
    { id: 'PP-0402', dogId: 'pip', dogName: 'Pip', serviceId: 'nail-trim', serviceName: 'Nail trim and file', day: addDays(t, -19), lane: 'mara', s: 20, len: 1, price: 10, owner: 'Sam Ferreira', phone: '07700 900412', notes: 'Hates the file', nervous: true, status: 'done' },
    { id: 'PP-0409', dogId: 'biscuit', dogName: 'Biscuit', serviceId: 'bath-brush', serviceName: 'Bath and brush', day: addDays(t, -9), lane: 'tobias', s: 6, len: 5, price: 36, owner: 'Sam Ferreira', phone: '07700 900412', notes: '', nervous: false, status: 'done' },
    { id: 'PP-0415', dogId: 'juno', dogName: 'Juno', serviceId: 'teeth', serviceName: 'Teeth clean', day: addDays(t, 5), lane: 'mara', s: 24, len: 3, price: 20, owner: 'Sam Ferreira', phone: '07700 900412', notes: '', nervous: false, status: 'booked' },
  ];
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seed();
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export const app = $state({
  dogId: 'biscuit',
  serviceId: 'full-groom',
  day: bookableDays()[0],
  pick: null, // { lane, s }
  bookings: load(),
  draft: { owner: 'Sam Ferreira', phone: '07700 900412', notes: '', nervous: false },
  last: null,
});

export const days = bookableDays();

export function currentDog() { return dogById(app.dogId); }
export function currentService() { return serviceById(app.serviceId); }
export function currentMinutes() { return minutesFor(currentService(), currentDog()); }
export function currentLen() { return slotsFor(currentMinutes()); }
export function currentPrice() { return priceFor(currentService(), currentDog()); }

export function addBooking(b) {
  app.bookings = [...app.bookings, b];
  persist(app.bookings);
}
export function setStatus(id, status) {
  app.bookings = app.bookings.map((b) => (b.id === id ? { ...b, status } : b));
  persist(app.bookings);
}
export function nextId() {
  const n = app.bookings.reduce((m, b) => Math.max(m, Number(b.id.replace(/\D/g, '')) || 0), 400) + 1;
  return `PP-${String(n).padStart(4, '0')}`;
}
export { dogs, services };
