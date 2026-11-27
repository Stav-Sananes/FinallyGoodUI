import { ACCOUNTS, CASH, INVOICES, PAYROLL, type Invoice } from './data'

export type Snapshot = { cash: number; accounts: typeof ACCOUNTS; invoices: Invoice[]; syncedAt: Date }

// Simulated bank + accounting sync. Fails when offline or with ?fail=1 in the URL.
export function loadSnapshot(): Promise<Snapshot> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const forced = new URLSearchParams(location.search).has('fail')
      if (forced || !navigator.onLine) reject(new Error('Could not reach Harbor Credit Union feed (bank connection timed out).'))
      else resolve({ cash: CASH, accounts: ACCOUNTS, invoices: INVOICES, syncedAt: new Date() })
    }, 1100)
  })
}

export function sendReminder(inv: Invoice): Promise<void> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (inv.bounces ? reject(new Error(`Email to ${inv.contact} bounced: mailbox not found. Call the client or update the contact.`)) : resolve()), 700))
}
export const payrollRows = PAYROLL
