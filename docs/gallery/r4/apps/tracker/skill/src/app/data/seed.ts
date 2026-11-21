import { Issue } from '../domain/issue';

export const SEED_ISSUES: readonly Issue[] = [
  { id: 'TRK-401', title: 'Login loops back to the form on Safari 17 after a password reset', area: 'Auth', reporter: 'Ana Lindqvist', createdAt: '2026-11-21', priority: 'none', assignee: null, status: 'open' },
  { id: 'TRK-402', title: 'CSV export drops rows with a comma in the customer name', area: 'Reports', reporter: 'Kofi Mensah', createdAt: '2026-11-21', priority: 'none', assignee: null, status: 'open' },
  { id: 'TRK-403', title: 'Invoice PDF shows the previous month on the 1st', area: 'Billing', reporter: 'Priya Nair', createdAt: '2026-11-20', priority: 'high', assignee: null, status: 'open' },
  { id: 'TRK-404', title: 'Webhook retries hammer the receiver after a 429', area: 'API', reporter: 'Jonas Weber', createdAt: '2026-11-20', priority: 'none', assignee: 'jonas', status: 'open' },
  { id: 'TRK-405', title: 'Dark mode: focus ring vanishes on the sidebar links', area: 'Web app', reporter: 'Mara Okafor', createdAt: '2026-11-19', priority: 'low', assignee: null, status: 'open' },
  { id: 'TRK-406', title: 'Search returns archived projects first', area: 'Search', reporter: 'Tomás Reyes', createdAt: '2026-11-19', priority: 'normal', assignee: 'tomas', status: 'in-progress' },
  { id: 'TRK-407', title: 'Payment page times out on slow 3G', area: 'Billing', reporter: 'Ana Lindqvist', createdAt: '2026-11-18', priority: 'urgent', assignee: 'priya', status: 'in-progress' },
  { id: 'TRK-408', title: 'Seat count off by one after removing an invited user', area: 'Billing', reporter: 'Kofi Mensah', createdAt: '2026-11-18', priority: 'high', assignee: 'mara', status: 'open' },
  { id: 'TRK-409', title: 'Mobile nav drawer traps focus when closed', area: 'Web app', reporter: 'Priya Nair', createdAt: '2026-11-17', priority: 'normal', assignee: 'mara', status: 'open' },
  { id: 'TRK-410', title: 'Audit log timestamps ignore the workspace time zone', area: 'Admin', reporter: 'Jonas Weber', createdAt: '2026-11-14', priority: 'normal', assignee: 'ana', status: 'open' },
  { id: 'TRK-411', title: 'Typo in the onboarding email subject line', area: 'Email', reporter: 'Mara Okafor', createdAt: '2026-11-12', priority: 'low', assignee: 'kofi', status: 'closed' },
  { id: 'TRK-412', title: 'Upload progress bar jumps back to 0% on a retry', area: 'Files', reporter: 'Tomás Reyes', createdAt: '2026-11-11', priority: 'none', assignee: null, status: 'open' },
];
