import type { Books, Invoice } from "../data/seed";
import { addDays, daysBetween } from "./format";

export const outstanding = (i: Invoice) => i.amount - i.paid;
export const isOpen = (i: Invoice) => outstanding(i) > 0;
export const isOverdue = (i: Invoice, asOf: string) => isOpen(i) && i.due < asOf;
export const daysLate = (i: Invoice, asOf: string) => Math.max(0, daysBetween(i.due, asOf));

export const PAYDAY = "2026-11-27";
export const NEXT_PAYDAY = "2026-12-24";

export const monthlyPayroll = (b: Books) => b.people.reduce((s, p) => s + p.cost, 0);
export const monthlyFixed = (b: Books) => b.costs.reduce((s, c) => s + c.monthly, 0);
export const monthlyRetainers = (b: Books) => b.retainers.reduce((s, r) => s + r.monthly, 0);
export const countedCash = (b: Books) => b.accounts.filter((a) => a.counted).reduce((s, a) => s + a.balance, 0);
export const operatingCash = (b: Books) => b.accounts.find((a) => a.id === "operating")?.balance ?? 0;

export type MonthPoint = { key: string; label: string; end: string; balance: number; covered: boolean };
export type Forecast = {
  months: MonthPoint[];
  runwayMonths: number | null; // null: cash lasts the whole horizon
  zeroDate: string | null;
  horizon: number;
};

const monthEnd = (year: number, month0: number) => new Date(Date.UTC(year, month0 + 1, 0)).toISOString().slice(0, 10);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Month-end cash for the next 12 month-ends. Counted accounts plus open invoices on their due date plus retainers,
 * minus payroll and fixed costs every month. Overdue invoices are left out unless `overduePaid` brings them in 14 days from now.
 * No new work is assumed: that is the honest worst case, and the screen says so.
 */
export function forecast(b: Books, overduePaid: boolean): Forecast {
  const payroll = monthlyPayroll(b);
  const fixed = monthlyFixed(b);
  const retainers = monthlyRetainers(b);
  const start = new Date(`${b.asOf}T00:00:00Z`);
  const months: MonthPoint[] = [];
  let balance = countedCash(b);
  let prevEnd = b.asOf;
  let zeroDate: string | null = null;
  let runwayMonths: number | null = null;

  for (let k = 0; k < 12; k++) {
    const y = start.getUTCFullYear() + Math.floor((start.getUTCMonth() + k) / 12);
    const m = (start.getUTCMonth() + k) % 12;
    const end = monthEnd(y, m);
    const first = k === 0;
    // Retainers have landed for this month already; costs and payroll in the first month are still to leave.
    const incomeRetainers = first ? 0 : retainers;
    let invoices = 0;
    for (const i of b.invoices) {
      if (!isOpen(i)) continue;
      const overdue = isOverdue(i, b.asOf);
      const lands = overdue ? (overduePaid ? addDays(b.asOf, 14) : null) : i.due;
      if (lands && lands > prevEnd && lands <= end) invoices += outstanding(i);
    }
    const before = balance;
    balance = balance + incomeRetainers + invoices - payroll - fixed;
    months.push({ key: `${y}-${m}`, label: MONTHS[m], end, balance, covered: balance >= 0 });
    if (zeroDate === null && balance < 0) {
      const net = before - balance; // how far the month pulled the balance down
      const share = net > 0 ? before / net : 0;
      zeroDate = addDays(prevEnd, Math.max(1, Math.round(share * daysBetween(prevEnd, end))));
      runwayMonths = daysBetween(b.asOf, zeroDate) / 30.4;
    }
    prevEnd = end;
  }
  return { months, runwayMonths, zeroDate, horizon: months.length };
}

/** Operating cash left after the pay run, and whether it clears. */
export function payrollCover(b: Books) {
  const total = monthlyPayroll(b);
  const operating = operatingCash(b);
  return { total, operating, left: operating - total, covered: operating >= total };
}

/** What should be in operating by the December run, if open non-overdue invoices land on time. */
export function expectedBeforeNextRun(b: Books) {
  const after = operatingCash(b) - monthlyPayroll(b) - monthlyFixed(b);
  const inflow = b.invoices.filter((i) => isOpen(i) && !isOverdue(i, b.asOf) && i.due <= NEXT_PAYDAY).reduce((s, i) => s + outstanding(i), 0);
  const balance = after + inflow + (b.retainers.length ? monthlyRetainers(b) : 0);
  return { balance, inflow, covered: balance >= monthlyPayroll(b) };
}
