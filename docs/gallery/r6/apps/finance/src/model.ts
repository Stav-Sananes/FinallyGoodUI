// Pure model: the studio's books and the 26-week cash projection. No React, no DOM.

export type InvoiceStatus = "overdue" | "upcoming" | "draft" | "paid";

export type Invoice = {
  id: string;
  number: string;
  client: string;
  contact: string;
  email: string;
  work: string;
  amount: number;
  issued: string; // ISO date
  due: string; // ISO date
  draft?: boolean;
  paidOn?: string;
  nudgedOn?: string;
};

export type PayLine = { id: string; name: string; role: string; cost: number; note: string };

export const TODAY = "2026-11-30"; // the Monday this demo studio is looking at
export const HORIZON_DAYS = 182; // 26 weeks
export const OPENING_CASH = 60360; // current account + tax pot, before anything below is paid
export const PAYROLL_FLOOR_LABEL = "one payroll";

export const INVOICES: Invoice[] = [
  { id: "i2041", number: "2041", client: "Harbour & Pine Coffee", contact: "Dee Okafor", email: "dee@harbourpine.example", work: "Packaging system, stage 2", amount: 8400, issued: "2026-10-07", due: "2026-11-06" },
  { id: "i2038", number: "2038", client: "Northlight Dental", contact: "Anil Rao", email: "anil@northlightdental.example", work: "Brand refresh, stage 2", amount: 6200, issued: "2026-10-14", due: "2026-11-13" },
  { id: "i2044", number: "2044", client: "Kiln Theatre", contact: "Sofia Brandt", email: "sofia@kilntheatre.example", work: "Season poster set", amount: 3150, issued: "2026-10-21", due: "2026-11-20" },
  { id: "i2046", number: "2046", client: "Mercer Cycles", contact: "Tom Mercer", email: "tom@mercercycles.example", work: "Web build, deposit", amount: 4800, issued: "2026-10-26", due: "2026-11-25" },
  { id: "i2047", number: "2047", client: "Fennel & Co", contact: "Ruth Fennel", email: "ruth@fennelco.example", work: "Menu design", amount: 2250, issued: "2026-11-04", due: "2026-12-04" },
  { id: "i2048", number: "2048", client: "Aldous Press", contact: "Greta Lund", email: "greta@aldouspress.example", work: "Book cover series", amount: 5400, issued: "2026-11-11", due: "2026-12-11" },
  { id: "i2049", number: "2049", client: "Tern Architects", contact: "Ibrahim Sy", email: "ibrahim@ternarch.example", work: "Wayfinding survey", amount: 7800, issued: "2026-11-18", due: "2026-12-18" },
  { id: "i2050", number: "2050", client: "Harbour & Pine Coffee", contact: "Dee Okafor", email: "dee@harbourpine.example", work: "Packaging system, stage 3", amount: 8400, issued: "2026-11-24", due: "2027-01-15" },
  { id: "i2051", number: "2051", client: "Northlight Dental", contact: "Anil Rao", email: "anil@northlightdental.example", work: "Signage, clinic two", amount: 5900, issued: "2026-11-26", due: "2027-01-22" },
  { id: "i2052", number: "2052", client: "Wren Health", contact: "Maya Quill", email: "maya@wrenhealth.example", work: "Identity, first half", amount: 9600, issued: "2026-11-27", due: "2027-02-12" },
  { id: "i2053", number: "2053", client: "Aldous Press", contact: "Greta Lund", email: "greta@aldouspress.example", work: "Catalogue layout", amount: 3600, issued: "2026-11-27", due: "2027-03-05" },
  { id: "d0001", number: "Draft", client: "Tern Architects", contact: "Ibrahim Sy", email: "ibrahim@ternarch.example", work: "Wayfinding, phase 2", amount: 11200, issued: "2026-11-30", due: "2027-04-30", draft: true },
  { id: "i2036", number: "2036", client: "Mercer Cycles", contact: "Tom Mercer", email: "tom@mercercycles.example", work: "Brand guidelines", amount: 4100, issued: "2026-10-20", due: "2026-11-19", paidOn: "2026-11-20" },
  { id: "i2035", number: "2035", client: "Fennel & Co", contact: "Ruth Fennel", email: "ruth@fennelco.example", work: "Logo and signage", amount: 1800, issued: "2026-10-16", due: "2026-11-15", paidOn: "2026-11-16" },
];

export const PAYROLL: PayLine[] = [
  { id: "p1", name: "Ines Marlow", role: "Owner, creative director", cost: 5200, note: "Salary and employer pension" },
  { id: "p2", name: "Jonah Pike", role: "Partner, strategy", cost: 4900, note: "Salary and employer pension" },
  { id: "p3", name: "Priya Nandakumar", role: "Senior designer", cost: 4300, note: "Salary and employer pension" },
  { id: "p4", name: "Luca Ferrante", role: "Designer", cost: 3900, note: "Salary and employer pension" },
  { id: "p5", name: "Beatrix Oyelaran", role: "Front-end developer", cost: 3600, note: "Salary and employer pension" },
  { id: "p6", name: "Sam Whitlock", role: "Studio manager, part-time", cost: 2700, note: "Salary and employer pension" },
];
export const PAYROLL_TOTAL = PAYROLL.reduce((n, p) => n + p.cost, 0);
export const PAY_DATES = ["2026-12-24", "2027-01-29", "2027-02-26", "2027-03-31", "2027-04-28", "2027-05-28"];

const RENT = 3400; // 1st of the month
const RUNNING = 4300; // 15th: software, freelancers, insurance
const VAT = 9800; // 7 Feb and 7 May

/* ---------- dates (UTC days, so no time-zone drift) ---------- */
const DAY = 86400000;
export const toDay = (iso: string) => Math.round(Date.parse(iso + "T00:00:00Z") / DAY);
export const fromDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
export const TODAY_DAY = toDay(TODAY);

export function statusOf(inv: Invoice): InvoiceStatus {
  if (inv.paidOn) return "paid";
  if (inv.draft) return "draft";
  return toDay(inv.due) < TODAY_DAY ? "overdue" : "upcoming";
}
export const daysLate = (inv: Invoice) => TODAY_DAY - toDay(inv.due);

/* ---------- projection ---------- */
export type Scenario = "never" | "two-weeks" | "four-weeks";
export const SCENARIOS: { id: Scenario; label: string; days: number | null }[] = [
  { id: "never", label: "Never", days: null },
  { id: "two-weeks", label: "In 2 weeks", days: 14 },
  { id: "four-weeks", label: "In 4 weeks", days: 28 },
];

export type CashEvent = { day: number; kind: "invoice" | "payroll" | "rent" | "running" | "vat"; label: string; amount: number; ref?: string };

export type Projection = {
  balances: number[]; // balance at end of day i (i = 0 is today), length HORIZON_DAYS + 1
  events: CashEvent[];
  runwayDays: number | null; // first day the balance drops below zero, null when it never does in the horizon
  floorDay: number | null; // first day the balance is under one payroll
};

export function openingCash(invoices: Invoice[]): number {
  // paid-in-app invoices (paidOn = today) land in the bank now
  return OPENING_CASH + invoices.filter((i) => i.paidOn === TODAY).reduce((n, i) => n + i.amount, 0);
}

export function project(invoices: Invoice[], scenario: Scenario, approvedPayroll = false): Projection {
  const days = SCENARIOS.find((s) => s.id === scenario)?.days ?? null;
  const events: CashEvent[] = [];
  const end = TODAY_DAY + HORIZON_DAYS;
  const add = (e: CashEvent) => { if (e.day >= TODAY_DAY && e.day <= end) events.push(e); };

  for (const inv of invoices) {
    const st = statusOf(inv);
    if (st === "paid" || st === "draft") continue;
    const day = st === "overdue" ? (days === null ? null : TODAY_DAY + days) : toDay(inv.due);
    if (day !== null) add({ day, kind: "invoice", label: inv.client, amount: inv.amount, ref: inv.id });
  }
  for (const d of PAY_DATES) add({ day: toDay(d), kind: "payroll", label: "Payroll", amount: -PAYROLL_TOTAL });
  for (let m = 0; m < 8; m++) {
    const first = new Date(Date.UTC(2026, 11 + m, 1));
    const y = first.getUTCFullYear(), mo = first.getUTCMonth();
    add({ day: Math.round(Date.UTC(y, mo, 1) / DAY), kind: "rent", label: "Rent", amount: -RENT });
    add({ day: Math.round(Date.UTC(y, mo, 15) / DAY), kind: "running", label: "Running costs", amount: -RUNNING });
  }
  add({ day: toDay("2027-02-07"), kind: "vat", label: "VAT", amount: -VAT });
  add({ day: toDay("2027-05-07"), kind: "vat", label: "VAT", amount: -VAT });
  events.sort((a, b) => a.day - b.day);

  const balances: number[] = [];
  let bal = openingCash(invoices);
  let runwayDays: number | null = null;
  let floorDay: number | null = null;
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const day = TODAY_DAY + i;
    for (const e of events) if (e.day === day) bal += e.amount;
    balances.push(bal);
    if (runwayDays === null && bal < 0) runwayDays = i;
    if (floorDay === null && bal < PAYROLL_TOTAL) floorDay = i;
  }
  void approvedPayroll;
  return { balances, events, runwayDays, floorDay };
}

export const runwayWeeks = (p: Projection): number | null => (p.runwayDays === null ? null : Math.floor(p.runwayDays / 7));

export function nextPayday(): { day: number; iso: string } {
  const d = PAY_DATES.map(toDay).find((x) => x >= TODAY_DAY) ?? toDay(PAY_DATES[0]);
  return { day: d, iso: fromDay(d) };
}
