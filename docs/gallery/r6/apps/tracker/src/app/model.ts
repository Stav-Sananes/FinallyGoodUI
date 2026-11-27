export type Priority = 0 | 1 | 2 | 3;
export type Status = 'inbox' | 'todo' | 'doing' | 'done';
export type Area = 'Billing' | 'Mobile' | 'Platform' | 'Web' | 'Data' | 'Support';

export interface Person {
  id: string;
  key: number;
  name: string;
  first: string;
  initials: string;
  area: Area;
}

export interface ActivityEntry {
  at: number;
  text: string;
}

export interface Issue {
  num: number;
  title: string;
  body: string;
  area: Area;
  reporter: string;
  reports: number;
  createdAt: number;
  priority: Priority;
  owner: string | null;
  status: Status;
  later: boolean;
  closed: boolean;
  activity: ActivityEntry[];
}

export const PEOPLE: readonly Person[] = [
  { id: 'maya', key: 1, name: 'Maya Okafor', first: 'Maya', initials: 'MO', area: 'Billing' },
  { id: 'dev', key: 2, name: 'Dev Rao', first: 'Dev', initials: 'DR', area: 'Mobile' },
  { id: 'ines', key: 3, name: 'Ines Duarte', first: 'Ines', initials: 'ID', area: 'Platform' },
  { id: 'tomas', key: 4, name: 'Tomas Weiss', first: 'Tomas', initials: 'TW', area: 'Web' },
  { id: 'priya', key: 5, name: 'Priya Nair', first: 'Priya', initials: 'PN', area: 'Data' },
  { id: 'kofi', key: 6, name: 'Kofi Mensah', first: 'Kofi', initials: 'KM', area: 'Support' },
];

export const AREAS: readonly Area[] = ['Billing', 'Mobile', 'Platform', 'Web', 'Data', 'Support'];

export const PRIORITY_NAME: Record<Priority, string> = { 0: 'Urgent', 1: 'High', 2: 'Normal', 3: 'Low' };
export const STATUS_NAME: Record<Status, string> = { inbox: 'Unsorted', todo: 'To do', doing: 'In progress', done: 'Done' };

export const PROJECT_KEY = 'HRB';
export const issueRef = (i: Pick<Issue, 'num'>) => `${PROJECT_KEY}-${i.num}`;
export const personOf = (id: string | null) => PEOPLE.find((p) => p.id === id) ?? null;
export const suggestedFor = (area: Area) => PEOPLE.find((p) => p.area === area) ?? null;
export const isOpen = (i: Issue) => i.status !== 'done' && !i.closed;

const MIN = 60_000;
type Seed = Omit<Issue, 'createdAt' | 'later' | 'closed' | 'activity'> & { minutesAgo: number };

const seeds: Seed[] = [
  { num: 231, title: 'Invoice PDF drops the currency symbol for JPY accounts', body: 'Customers on yen plans see 12,400 instead of ¥12,400 on the PDF. The dashboard and the email receipt are correct, so it is the PDF template.', area: 'Billing', reporter: 'Aoife Byrne', reports: 9, minutesAgo: 14, priority: 1, owner: null, status: 'inbox' },
  { num: 230, title: 'iOS app crashes on launch after 4.12 when the phone is offline', body: 'Crash on cold start with no network. Started with the 4.12 release; 31 reports in the last hour, all iOS 18. Crash log points at the cached session decode.', area: 'Mobile', reporter: 'Hana Sato', reports: 31, minutesAgo: 38, priority: 0, owner: null, status: 'inbox' },
  { num: 229, title: 'Webhook retries stop after the third failure instead of the tenth', body: 'A partner endpoint that returned 503 twice and recovered never got the event. The retry policy in the docs says ten attempts with backoff.', area: 'Platform', reporter: 'Luca Ferri', reports: 6, minutesAgo: 66, priority: 1, owner: null, status: 'inbox' },
  { num: 228, title: 'Dashboard date picker resets to today when the time zone changes', body: 'Switching the workspace time zone while a custom range is selected snaps the range back to today. Range should survive the change.', area: 'Web', reporter: 'Sofia Marin', reports: 4, minutesAgo: 131, priority: 2, owner: null, status: 'inbox' },
  { num: 227, title: 'Weekly revenue export is missing refunds issued on Sundays', body: 'Finance noticed the Monday export is short by the Sunday refunds. The export window closes at 00:00 Sunday UTC and drops the last day.', area: 'Data', reporter: 'Marcus Oyelaran', reports: 3, minutesAgo: 190, priority: 2, owner: null, status: 'inbox' },
  { num: 226, title: 'Customers cannot find where to download past receipts', body: 'Twelve tickets this week asking how to get a receipt from March. They exist under Billing > History but the page is not linked from the account menu.', area: 'Support', reporter: 'Aoife Byrne', reports: 12, minutesAgo: 305, priority: 3, owner: null, status: 'inbox' },
  { num: 225, title: 'Android back button closes the app from the payment sheet', body: 'Pressing back on the payment sheet exits the whole app instead of dismissing the sheet, so a half-entered card is lost.', area: 'Mobile', reporter: 'Hana Sato', reports: 8, minutesAgo: 372, priority: 1, owner: null, status: 'inbox' },
  { num: 224, title: 'Rate limiter returns 500 instead of 429 for burst traffic', body: 'Burst traffic above the per-key limit gets an unhandled exception from the limiter middleware, so clients never see Retry-After.', area: 'Platform', reporter: 'Luca Ferri', reports: 5, minutesAgo: 1500, priority: 1, owner: 'ines', status: 'doing' },
  { num: 223, title: 'Tax rounding differs by a cent between invoice and dashboard', body: 'Line-level rounding on the invoice and total-level rounding on the dashboard disagree on multi-line EU invoices.', area: 'Billing', reporter: 'Marcus Oyelaran', reports: 2, minutesAgo: 1700, priority: 2, owner: 'maya', status: 'doing' },
  { num: 222, title: 'Search ignores diacritics in customer names', body: 'Searching for "Jose" does not find "José Álvarez". Needs accent-insensitive collation on the customer index.', area: 'Web', reporter: 'Sofia Marin', reports: 3, minutesAgo: 2900, priority: 3, owner: 'tomas', status: 'todo' },
  { num: 221, title: 'Churn cohort query times out for accounts older than five years', body: 'The cohort job scans the full event table for long-lived accounts and hits the 60 second limit.', area: 'Data', reporter: 'Marcus Oyelaran', reports: 1, minutesAgo: 3100, priority: 1, owner: 'priya', status: 'doing' },
  { num: 219, title: 'Push notifications arrive twice on Android 15', body: 'Two identical pushes per event on Android 15 devices only. Looks like the token is registered under two channels.', area: 'Mobile', reporter: 'Hana Sato', reports: 7, minutesAgo: 4300, priority: 2, owner: 'dev', status: 'todo' },
  { num: 218, title: 'Proration double-charges on a mid-cycle downgrade', body: 'Downgrading on day 12 of the cycle charges the new plan in full and the old plan prorated. Refunds are being issued by hand.', area: 'Billing', reporter: 'Aoife Byrne', reports: 14, minutesAgo: 5100, priority: 0, owner: 'maya', status: 'doing' },
  { num: 216, title: 'Migration tool locks the orders table for 40 seconds', body: 'Adding the new index takes an exclusive lock. Needs to run concurrently or in batches before the next release.', area: 'Platform', reporter: 'Luca Ferri', reports: 1, minutesAgo: 7200, priority: 2, owner: 'ines', status: 'todo' },
  { num: 215, title: 'Mobile login loops after a password reset', body: 'Fixed in 4.11.2: the reset token was cached across sessions. Kept for the record.', area: 'Mobile', reporter: 'Hana Sato', reports: 22, minutesAgo: 9800, priority: 1, owner: 'dev', status: 'done' },
];

export function seedIssues(now: number): Issue[] {
  return seeds.map(({ minutesAgo, ...s }) => ({
    ...s,
    createdAt: now - minutesAgo * MIN,
    later: false,
    closed: false,
    activity: [
      { at: now - minutesAgo * MIN, text: `Reported by ${s.reporter}` },
      ...(s.owner ? [{ at: now - (minutesAgo - 20) * MIN, text: `Sorted to ${personOf(s.owner)?.first} at triage` }] : []),
    ],
  }));
}
