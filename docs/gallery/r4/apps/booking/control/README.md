# Pawlish booking (control)
Svelte 5 + Vite (plain JS). Run `npm install && npm run dev`; `npm run build` for production.

Mobile-first flow for dog owners to book a groom: pick or add a dog, pick a service (9 services, price and
duration scale with dog size), pick a date, groomer and time, review, confirm. "My bookings" tab lists and cancels appointments.

- States: skeleton while times load, load-error with retry (first Saturday load fails, or offline), closed Sunday, fully booked, no bookings, slot-taken conflict on confirm (11:00 AM, once per session), offline on confirm.
- Shortcuts: the backend is simulated in `src/api.js` (deterministic availability, fake latency); dogs and bookings persist in localStorage. No tests.
