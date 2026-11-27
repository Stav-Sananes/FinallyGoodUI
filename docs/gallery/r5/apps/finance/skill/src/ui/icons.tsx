import type { ReactNode } from "react";

const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false } as const;
const icon = (d: ReactNode) => () => <svg {...base}>{d}</svg>;

export const BellIcon = icon(<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></>);
export const CheckIcon = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const AlertIcon = icon(<><path d="M12 4 3 19h18z" /><path d="M12 10v4M12 17v.5" /></>);
export const RefreshIcon = icon(<><path d="M20 11a8 8 0 0 0-14-4L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4l2-2" /><path d="M20 20v-5h-5" /></>);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>);
export const MoreIcon = icon(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>);
export const MoonIcon = icon(<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />);

/** The studio mark: two waves under a hull line. Also the favicon. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="mark">
      <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
      <path d="M4 18c3-4 5-4 8 0s5 4 8 0 5-4 8 0v10H4z" fill="var(--color-primary-foreground)" />
      <path d="M4 12c3-3 5-3 8 0s5 3 8 0 5-3 8 0" fill="none" stroke="var(--color-primary-foreground)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The waterline: the one motif. A wavy rule under headings, in empty states and the gauge. */
export function Waterline({ className = "" }: { className?: string }) {
  return <span className={`waterline ${className}`} aria-hidden="true" />;
}
