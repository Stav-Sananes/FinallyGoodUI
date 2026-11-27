import { useEffect, useState } from "react";

let played = false; // the runway entrance plays once per page load, not on every visit to Monday

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts a figure up from zero the first time it is shown. Returns the value to render and whether the entrance is playing. */
export function useFirstView(target: number, ms: number) {
  const [first] = useState(() => !played && !reduced());
  const [value, setValue] = useState(first ? 0 : target);
  useEffect(() => {
    played = true;
    if (!first) { setValue(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setValue(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, first, ms]);
  return { value, first };
}
