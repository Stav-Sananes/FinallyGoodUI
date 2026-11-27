import { DOGS, SERVICES, dogById, serviceById, priceFor, minutesFor, isoDay, parseISODay } from "./data.js";
import { blockLabel, releaseSlot } from "./slots.js";

const KEY = "tailwag.visits.v1";
let toastId = 0;

function seedVisits() {
  const at = (days, hh, mm) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hh, mm, 0, 0); return d.toISOString(); };
  const v = (id, dogId, serviceId, days, hh, mm, status = "booked") => {
    const dog = dogById(dogId), s = serviceById(serviceId);
    return { id, dogId, serviceId, start: at(days, hh, mm), minutes: minutesFor(s, dog), price: priceFor(s, dog), status };
  };
  return [
    v("v1", "juno", "full", 9, 10, 30), v("v2", "biscuit", "bath", 23, 14, 0),
    v("v3", "juno", "full", -41, 9, 0), v("v4", "biscuit", "full", -62, 13, 30), v("v5", "pepper", "nails", -83, 11, 0),
    v("v6", "juno", "deshed", -104, 15, 0), v("v7", "pepper", "face", -127, 10, 0, "cancelled"),
  ];
}

function readVisits() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { visits: seedVisits(), error: false };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("shape");
    return { visits: parsed, error: false };
  } catch (e) {
    return { visits: [], error: e instanceof SyntaxError || e.message === "shape" };
  }
}

const initial = readVisits();

export const app = $state({
  route: "book",
  dogId: DOGS[0].id,
  serviceId: null,
  dayISO: null,
  slot: null, // { time, block, blocks, groomer }
  form: { name: "Priya Raman", phone: "", notes: "", nervous: false, reminder: true },
  visits: initial.visits,
  visitsError: initial.error,
  visitsLoading: true,
  lastBooked: null,
  conflict: null, // message shown on the When step after a lost slot
  toasts: [],
  dir: 1,
});

export const dog = () => dogById(app.dogId);
export const service = () => (app.serviceId ? serviceById(app.serviceId) : null);
export const minutes = () => (service() ? minutesFor(service(), dog()) : 0);
export const price = () => (service() ? priceFor(service(), dog()) : 0);

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(app.visits)); } catch { /* private mode: keep in memory */ }
}

export function resetVisits() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  app.visits = seedVisits();
  app.visitsError = false;
  persist();
}

export function toast(message, opts = {}) {
  app.toasts.push({ id: ++toastId, message, ...opts });
}
export const dismissToast = (id) => { app.toasts = app.toasts.filter((t) => String(t.id) !== String(id)); };

export function startBooking({ dogId, serviceId } = {}) {
  if (dogId) app.dogId = dogId;
  if (serviceId !== undefined) app.serviceId = serviceId;
  app.dayISO = null;
  app.slot = null;
  app.conflict = null;
}

export function bookedBlocks() {
  return app.visits.filter((v) => v.status === "booked").map((v) => {
    const d = new Date(v.start);
    const half = Math.round(((d.getHours() * 60 + d.getMinutes()) - 510) / 30);
    return { iso: isoDay(d), block: half, blocks: Math.ceil(v.minutes / 30) };
  });
}

export function addVisit() {
  const start = parseISODay(app.dayISO);
  const [h, m] = app.slot.time.split(":").map(Number);
  start.setHours(h, m, 0, 0);
  const visit = { id: `v${Date.now()}`, dogId: app.dogId, serviceId: app.serviceId, start: start.toISOString(), minutes: minutes(), price: price(), status: "booked", groomer: app.slot.groomer, nervous: app.form.nervous, notes: app.form.notes.trim() };
  app.visits = [visit, ...app.visits];
  app.lastBooked = visit;
  persist();
  return visit;
}

export function cancelVisit(id) {
  const v = app.visits.find((x) => x.id === id);
  if (!v) return;
  const d = new Date(v.start);
  releaseSlot(isoDay(d), blockLabel(Math.round(((d.getHours() * 60 + d.getMinutes()) - 510) / 30)));
  app.visits = app.visits.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x));
  persist();
}

export const isLate = (v) => new Date(v.start).getTime() - Date.now() < 24 * 3600 * 1000;
