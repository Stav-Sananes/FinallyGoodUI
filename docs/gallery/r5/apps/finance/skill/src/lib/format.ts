const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dayMonth = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayDay = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const full = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const MINUS = "−";

/** Dollars with a true minus, whole dollars. */
export const money = (n: number) => usd0.format(n).replace("-", MINUS);
export const money2 = (n: number) => usd2.format(n).replace("-", MINUS);
export const plainNumber = (n: number) => num0.format(n);
/** "$12.4K" for tight spots. */
export const moneyShort = (n: number) => (Math.abs(n) >= 1000 ? `${n < 0 ? MINUS : ""}$${(Math.abs(n) / 1000).toFixed(Math.abs(n) % 1000 === 0 ? 0 : 1)}K` : money(n));

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const shortDate = (iso: string) => dayMonth.format(utc(iso));
export const dayDate = (iso: string) => weekdayDay.format(utc(iso));
export const longDate = (iso: string) => full.format(utc(iso));
export const monthName = (iso: string) => monthShort.format(utc(iso));

export const daysBetween = (fromIso: string, toIso: string) => Math.round((utc(toIso).getTime() - utc(fromIso).getTime()) / 86_400_000);
export const addDays = (iso: string, days: number) => new Date(utc(iso).getTime() + days * 86_400_000).toISOString().slice(0, 10);

export const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("");
