// "Today" is Monday 23 Nov 2026
export const TODAY = new Date('2026-11-23T09:00:00')

export type Invoice = {
  id: string; client: string; project: string; amount: number
  due: string; contact: string; reminders: number; lastReminder?: string
  bounces?: boolean
}
export const INVOICES: Invoice[] = [
  { id: 'INV-1042', client: 'Northwind Outfitters', project: 'Brand refresh, phase 2', amount: 18400, due: '2026-10-09', contact: 'priya@northwind.example', reminders: 2, lastReminder: '2026-11-06' },
  { id: 'INV-1047', client: 'Halvorsen Dental', project: 'Website redesign', amount: 12750, due: '2026-10-23', contact: 'accounts@halvorsen-dental.example', reminders: 1, lastReminder: '2026-11-02', bounces: true },
  { id: 'INV-1051', client: 'Kiln & Co. Ceramics', project: 'Packaging system', amount: 6200, due: '2026-10-30', contact: 'mara@kilnco.example', reminders: 0 },
  { id: 'INV-1053', client: 'Meridian Health Group', project: 'Patient portal UX audit', amount: 24900, due: '2026-11-04', contact: 'ap@meridianhg.example', reminders: 1, lastReminder: '2026-11-12' },
  { id: 'INV-1058', client: 'Fjord Coffee Roasters', project: 'Identity + menus', amount: 4850, due: '2026-11-11', contact: 'ola@fjordcoffee.example', reminders: 0 },
  { id: 'INV-1061', client: 'Atlas Freight Labs', project: 'Dashboard design sprint', amount: 15300, due: '2026-11-16', contact: 'finance@atlasfreight.example', reminders: 0 },
  { id: 'INV-1064', client: 'Lumen Theatre', project: 'Season campaign', amount: 3900, due: '2026-11-18', contact: 'box@lumentheatre.example', reminders: 0 },
  { id: 'INV-1066', client: 'Birchwood Realty', project: 'Signage & wayfinding', amount: 8600, due: '2026-11-20', contact: 'jen@birchwood.example', reminders: 0 },
  { id: 'INV-1069', client: 'Northwind Outfitters', project: 'Brand refresh, phase 3', amount: 9200, due: '2026-12-04', contact: 'priya@northwind.example', reminders: 0 },
  { id: 'INV-1070', client: 'Tidewater Brewing', project: 'Can label series', amount: 7400, due: '2026-12-11', contact: 'hello@tidewater.example', reminders: 0 },
]

export type Payroll = { name: string; role: string; gross: number; type: 'Salary' | 'Contractor' }
export const PAYROLL: Payroll[] = [
  { name: 'Ines Duarte', role: 'Design director', gross: 7800, type: 'Salary' },
  { name: 'Tomás Okafor', role: 'Senior designer', gross: 6100, type: 'Salary' },
  { name: 'Hana Lindqvist', role: 'Product designer', gross: 5600, type: 'Salary' },
  { name: 'Rui Matsuda', role: 'Motion designer', gross: 5200, type: 'Salary' },
  { name: 'Clara Whitfield', role: 'Studio manager', gross: 4900, type: 'Salary' },
  { name: 'Dev Raman', role: 'Front-end developer', gross: 3400, type: 'Contractor' },
]
export const PAYROLL_DATE = '2026-11-27'
export const PAYROLL_ONCOST = 0.14 // employer taxes & benefits on salaried

export const CASH = 142300
export const FIXED_MONTHLY = 14800 // rent, software, insurance, accountant
export const ACCOUNTS = [
  { name: 'Operating — Harbor Credit Union', balance: 96400 },
  { name: 'Tax reserve', balance: 31200 },
  { name: 'Savings', balance: 14700 },
]

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const daysBetween = (a: string | Date, b: Date) =>
  Math.round((b.getTime() - new Date(a).getTime()) / 86400000)
export const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function payrollTotal(rows: Payroll[]) {
  return rows.reduce((s, r) => s + r.gross * (r.type === 'Salary' ? 1 + PAYROLL_ONCOST : 1), 0)
}
