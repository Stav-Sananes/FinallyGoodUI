// A pretend booking back end: latency, closed Sundays, a busy pattern, one flaky Saturday, one slot that
// gets taken as you book. Everything is deterministic so the states are reachable on purpose.
import { parseISODay } from "./data.js";

export const OPEN_FROM = 8.5; // 8:30
export const BLOCKS = 17; // half-hour blocks, last one starts 16:30, salon closes 17:00
export const GROOMERS = ["Mara", "Tobias"];
const LATENCY_MS = 700; // pretend network time, not a motion value

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
const blockTime = (i) => { const t = OPEN_FROM + i / 2; return { h: Math.floor(t), m: (t % 1) * 60 }; };
export const blockLabel = (i) => { const { h, m } = blockTime(i); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };

const flaky = new Set(); // days whose first load already failed
let conflictSpent = false;
const taken = new Set(); // "iso|HH:MM" slots lost to someone else or booked here

export const isClosed = (iso) => parseISODay(iso).getDay() === 0;

function freeBlocks(iso, booked) {
  return Array.from({ length: BLOCKS }, (_, i) => {
    if (hash(`${iso}#${i}`) % 100 < 36) return false;
    if (taken.has(`${iso}|${blockLabel(i)}`)) return false;
    return !booked.some((b) => b.iso === iso && i >= b.block && i < b.block + b.blocks);
  });
}

/** Slots on a day where `minutes` fit. booked: [{iso, block, blocks}] from this owner's own visits. */
export function loadSlots(iso, minutes, booked = []) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return reject(new Error("offline"));
      if (parseISODay(iso).getDay() === 6 && !flaky.has(iso)) { flaky.add(iso); return reject(new Error("unavailable")); }
      if (isClosed(iso)) return resolve({ closed: true, slots: [] });
      const need = Math.ceil(minutes / 30);
      const free = freeBlocks(iso, booked);
      const slots = [];
      for (let i = 0; i + need <= BLOCKS; i++) {
        if (free.slice(i, i + need).every(Boolean)) slots.push({ time: blockLabel(i), block: i, blocks: need, groomer: GROOMERS[hash(`${iso}@${i}`) % 2] });
      }
      resolve({ closed: false, slots, anyFree: free.some(Boolean) });
    }, LATENCY_MS);
  });
}

/** Confirm a slot. The first 10:00 booking of the session is lost to someone else, once. */
export function confirmSlot(iso, time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (time === "10:00" && !conflictSpent) { conflictSpent = true; taken.add(`${iso}|${time}`); return resolve({ ok: false, reason: "taken" }); }
      if (typeof navigator !== "undefined" && navigator.onLine === false) return resolve({ ok: false, reason: "offline" });
      taken.add(`${iso}|${time}`);
      resolve({ ok: true });
    }, LATENCY_MS);
  });
}

export const releaseSlot = (iso, time) => taken.delete(`${iso}|${time}`);
