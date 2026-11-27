import type { ReactNode } from "react";

// One family: 24 grid, 1.75 stroke, square caps (drafting pen).
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "square", strokeLinejoin: "miter", "aria-hidden": true, focusable: false } as const;
const I = ({ children }: { children: ReactNode }) => <svg {...base}>{children}</svg>;

export const IconMonday = () => <I><path d="M3 5h18v14H3zM9 5v14M15 5v14M3 12h18" /></I>;
export const IconSlip = () => <I><path d="M6 3h12v18H6zM6 8h12" strokeDasharray="1 3" /><path d="M9.5 12h5M9.5 16h5" /></I>;
export const IconPay = () => <I><path d="M4 8h16v10H4zM8 8V5h8v3" /><path d="M12 11v4M10 13h4" /></I>;
export const IconSun = () => <I><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></I>;
export const IconMoon = () => <I><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></I>;
export const IconCheck = () => <I><path d="M4 12.5l5 5L20 6.5" /></I>;
export const IconAlert = () => <I><path d="M12 3l10 18H2zM12 10v5M12 18v.5" /></I>;
export const IconSend = () => <I><path d="M3 11l18-8-8 18-2-8z" /></I>;
export const Cross = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="1.5" /></svg>;
