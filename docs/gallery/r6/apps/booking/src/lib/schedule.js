// The day tape: 15-minute slots from 08:00 to 17:00. Pure functions, no DOM.
import { dayIndex, isSunday } from './dates.js';
import { groomers, otherDogs, services } from './data.js';

export const OPEN = 8 * 60;
export const CLOSE = 17 * 60;
export const STEP = 15;
export const SLOTS = (CLOSE - OPEN) / STEP;
export const START_EVERY = 2; // a start every 30 minutes

export const slotMinutes = (s) => OPEN + s * STEP;
export function clock(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export const slotClock = (s) => clock(slotMinutes(s));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Other owners' bookings for one groomer on one day, deterministic from the date. */
function busyBlocks(iso, laneIndex) {
  const rand = rng(dayIndex(iso) * 31 + laneIndex * 977 + 7);
  const blocks = [];
  // Every fifth day is a busy one (short gaps); the rest leave a few long stretches open.
  const busyDay = dayIndex(iso) % 5 === 2;
  let cursor = Math.floor(rand() * 3);
  let n = 0;
  while (cursor < SLOTS - 3) {
    const gap = busyDay ? 1 + Math.floor(rand() * 5) : 3 + Math.floor(rand() * 12);
    const start = cursor + gap;
    const l = busyDay ? 4 + Math.floor(rand() * 5) : 2 + Math.floor(rand() * 5);
    if (start + l > SLOTS) break;
    const dog = otherDogs[Math.floor(rand() * otherDogs.length)];
    const svc = services[Math.floor(rand() * 5)];
    blocks.push({ s: start, l, dog, service: svc.name, mine: false, id: `x-${laneIndex}-${n++}` });
    cursor = start + l;
  }
  return blocks;
}

/** What the salon says about a day: closed flag and one lane per groomer with its booked blocks. */
export function dayData(iso) {
  if (isSunday(iso)) return { closed: true, lanes: [] };
  return { closed: false, lanes: groomers.map((g, i) => ({ id: g.id, name: g.name, first: g.first, blocks: busyBlocks(iso, i) })) };
}

/** Merge the owner's own bookings onto a day's lanes. */
export function withMine(data, bookings, iso) {
  if (data.closed) return data;
  const lanes = data.lanes.map((lane) => ({
    ...lane,
    blocks: [
      ...lane.blocks,
      ...bookings
        .filter((b) => b.day === iso && b.lane === lane.id && b.status === 'booked')
        .map((b) => ({ s: b.s, l: b.len, dog: b.dogName, service: b.serviceName, mine: true, id: b.id })),
    ],
  }));
  return { ...data, lanes };
}

/** Starts (slot numbers) where a groom of `len` slots fits in this lane. */
export function validStarts(blocks, len) {
  const busy = new Array(SLOTS).fill(false);
  for (const b of blocks) for (let i = b.s; i < b.s + b.l && i < SLOTS; i++) busy[i] = true;
  const out = [];
  for (let s = 0; s + len <= SLOTS; s += START_EVERY) {
    let free = true;
    for (let i = s; i < s + len; i++) if (busy[i]) { free = false; break; }
    if (free) out.push(s);
  }
  return out;
}

export const slotsFor = (minutes) => Math.ceil(minutes / STEP);

/** The earliest opening in a day, as {lane, s}, or null. */
export function earliest(data, len) {
  let best = null;
  for (const lane of data.lanes) {
    const starts = validStarts(lane.blocks, len);
    if (starts.length && (best === null || starts[0] < best.s)) best = { lane: lane.id, s: starts[0] };
  }
  return best;
}
