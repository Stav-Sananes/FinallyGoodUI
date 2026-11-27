import type { ReactNode } from "react";

// One family, hand-set on a 24 grid at --icon-stroke; sized by CSS from --icon-md. No icon library is installed.
const wrap = (d: ReactNode) => (props: { size?: "sm" | "md" | "lg" }) => (
  <svg className={`icon icon-${props.size ?? "md"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export const IconBell = wrap(<><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
export const IconCheck = wrap(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const IconPlus = wrap(<path d="M12 5v14M5 12h14" />);
export const IconChevron = wrap(<path d="M7 10l5 5 5-5" />);
export const IconSearch = wrap(<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2" /></>);
export const IconWarn = wrap(<><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.2v.1" /></>);
export const IconRefresh = wrap(<><path d="M20 11a8 8 0 0 0-14-4.5L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4.5L20 15" /><path d="M20 20v-5h-5" /></>);
export const IconDots = wrap(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>);
export const IconStudio = wrap(<><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M9 5v14" /></>);
