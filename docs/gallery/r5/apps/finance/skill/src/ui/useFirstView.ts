import { useEffect, useState } from "react";

const SEEN = "saltmarsh-rook-seen";
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True only for the first Monday view of this browser session: the expressive moment runs once. */
export function firstViewThisSession(): boolean {
  try {
    if (sessionStorage.getItem(SEEN)) return false;
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* storage blocked: treat every view as seen, no animation */
    return false;
  }
  return !reduced();
}

/** Counts from 0 to `target` over `ms` (the hero duration), once, when `play` is true. */
export function useCountUp(target: number, play: boolean, ms = 600) {
  const [value, setValue] = useState(play ? 0 : target);
  useEffect(() => {
    if (!play) { setValue(target); return; }
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setValue(target * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, play, ms]);
  return value;
}
