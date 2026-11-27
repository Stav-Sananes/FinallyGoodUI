const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbpShort = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const fix = (s: string) => s.replace("-", "−"); // true minus
export const money = (n: number) => fix(gbp.format(n));
export const moneyShort = (n: number) => fix(gbpShort.format(n));
const d = (iso: string) => new Date(iso + "T00:00:00Z");
export const dayLabel = (iso: string) => dayFmt.format(d(iso));
export const shortDate = (iso: string) => shortFmt.format(d(iso));
export const monthLabel = (iso: string) => monthFmt.format(d(iso));
export const longDate = (iso: string) => longFmt.format(d(iso));
export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
