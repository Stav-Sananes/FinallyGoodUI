export type Status = 'triage' | 'todo' | 'doing' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Member { id: string; name: string; initials: string; hue: number }
export interface Issue {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  labels: string[];
  created: string;
  reporter: string;
  archived: boolean;
}

export const TEAM: Member[] = [
  { id: 'priya', name: 'Priya Raman', initials: 'PR', hue: 262 },
  { id: 'tomas', name: 'Tomas Weber', initials: 'TW', hue: 200 },
  { id: 'amara', name: 'Amara Okafor', initials: 'AO', hue: 24 },
  { id: 'jun', name: 'Jun Matsuda', initials: 'JM', hue: 150 },
  { id: 'lena', name: 'Lena Kowalski', initials: 'LK', hue: 330 },
  { id: 'diego', name: 'Diego Alvarez', initials: 'DA', hue: 48 },
];
export const ME = 'priya';

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'triage', label: 'Triage' },
  { id: 'todo', label: 'Todo' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];
export const PRIORITIES: { id: Priority; label: string; rank: number }[] = [
  { id: 'urgent', label: 'Urgent', rank: 0 },
  { id: 'high', label: 'High', rank: 1 },
  { id: 'medium', label: 'Medium', rank: 2 },
  { id: 'low', label: 'Low', rank: 3 },
];
export const LABELS = ['bug', 'feature', 'perf', 'docs', 'billing', 'mobile'];

export const SEED: Issue[] = [
  { id: 412, title: 'Checkout fails with 502 when coupon code has a trailing space', description: 'Reported by 14 customers since Tuesday. The coupon service rejects the padded string and the gateway surfaces it as a 502. Trim on input and return a 422 with a readable message.', status: 'triage', priority: 'urgent', assignee: null, labels: ['bug', 'billing'], created: '2026-11-19', reporter: 'lena', archived: false },
  { id: 411, title: 'Invoice PDF drops the VAT line for Swiss customers', description: 'EU invoices show VAT correctly; CH invoices omit the line entirely. Finance needs this fixed before the month-end close on Nov 30.', status: 'triage', priority: 'high', assignee: null, labels: ['bug', 'billing'], created: '2026-11-19', reporter: 'diego', archived: false },
  { id: 409, title: 'Dark mode flashes white on first paint in Safari', description: 'Theme is read from localStorage after hydration. Move the theme bootstrap into an inline head script.', status: 'triage', priority: 'medium', assignee: null, labels: ['bug'], created: '2026-11-18', reporter: 'amara', archived: false },
  { id: 407, title: 'Add CSV export to the usage report', description: 'Three enterprise accounts asked for it. Columns: date, seat, project, minutes. Stream the response; reports can reach 200k rows.', status: 'triage', priority: 'medium', assignee: null, labels: ['feature'], created: '2026-11-18', reporter: 'tomas', archived: false },
  { id: 404, title: 'Search index rebuild takes 40 minutes after the schema change', description: 'Rebuild used to take 6 minutes. Suspect the new per-field analyzers; profile before changing anything.', status: 'todo', priority: 'high', assignee: 'jun', labels: ['perf'], created: '2026-11-17', reporter: 'priya', archived: false },
  { id: 401, title: 'Push notifications arrive twice on Android 14', description: 'Both the FCM data message and the notification message are being delivered. Drop the redundant notification payload.', status: 'doing', priority: 'high', assignee: 'amara', labels: ['bug', 'mobile'], created: '2026-11-16', reporter: 'lena', archived: false },
  { id: 398, title: 'Document the webhook retry schedule', description: 'Customers keep asking how long we retry. Add the 1m / 5m / 30m / 6h schedule and the signature header to the API docs.', status: 'todo', priority: 'low', assignee: 'diego', labels: ['docs'], created: '2026-11-14', reporter: 'tomas', archived: false },
  { id: 395, title: 'Seat count in billing page lags behind real usage by one day', description: 'The nightly job snapshots seats at 02:00 UTC. Customers adding people mid-day see stale numbers. Compute on read, cache for 5 minutes.', status: 'doing', priority: 'medium', assignee: 'tomas', labels: ['billing'], created: '2026-11-13', reporter: 'diego', archived: false },
  { id: 391, title: 'Onboarding checklist cannot be dismissed on mobile web', description: 'The close button sits under the sticky header at 390px width. Raise the z-index and add 44px hit area.', status: 'done', priority: 'low', assignee: 'lena', labels: ['bug', 'mobile'], created: '2026-11-11', reporter: 'amara', archived: false },
  { id: 388, title: 'Rate limiter counts health-check pings against customer quota', description: 'Load balancer probes hit the public API every 5 seconds. Exempt /healthz from the limiter.', status: 'done', priority: 'urgent', assignee: 'jun', labels: ['bug', 'perf'], created: '2026-11-10', reporter: 'priya', archived: false },
  { id: 384, title: 'Let admins reassign a project owner without support help', description: 'Today this needs a support ticket and a database edit. Add an Owner selector in project settings, admin role only.', status: 'todo', priority: 'medium', assignee: 'priya', labels: ['feature'], created: '2026-11-09', reporter: 'lena', archived: false },
  { id: 379, title: 'Timezone picker lists "Asia/Calcutta" and "Asia/Kolkata" twice', description: 'Dedupe by canonical IANA name and keep the friendlier label.', status: 'done', priority: 'low', assignee: 'diego', labels: ['bug'], created: '2026-11-06', reporter: 'jun', archived: false },
];
