// A small stand-in for the salon's server: slow enough to show a loading state, able to fail on request.
// The forced states (?state=loading|error|empty|saveerror in the hash) make every state reachable without tools.
import { dayData } from './schedule.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loadDay(iso, forced) {
  if (forced === 'loading') return new Promise(() => {});
  await wait(320);
  if (forced === 'error') throw new Error('The salon did not answer.');
  if (forced === 'empty') return { closed: true, lanes: [] };
  return dayData(iso);
}

export async function loadList(forced) {
  if (forced === 'loading') return new Promise(() => {});
  await wait(260);
  if (forced === 'error') throw new Error('The salon did not answer.');
  return true;
}

export async function saveBooking(booking, forced) {
  await wait(520);
  if (forced === 'saveerror') throw new Error('Could not save the booking.');
  return booking;
}
