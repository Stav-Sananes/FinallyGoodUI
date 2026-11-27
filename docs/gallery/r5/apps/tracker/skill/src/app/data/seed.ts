import { Issue } from '../domain/issue';

const log = (...rows: [string, string][]) => rows.map(([at, text]) => ({ at, text }));

export const SEED_ISSUES: readonly Issue[] = [
  { id: 'TRK-401', title: 'Login loops back to the form on Safari 17 after a password reset', area: 'Auth', reporter: 'Ana Lindqvist', createdAt: '2026-11-21', priority: 'none', assignee: null, status: 'open', log: log(['21 Nov', 'Ana Lindqvist filed it from a support ticket']) },
  { id: 'TRK-402', title: 'CSV export drops rows with a comma in the customer name', area: 'Reports', reporter: 'Kofi Mensah', createdAt: '2026-11-21', priority: 'none', assignee: null, status: 'open', log: log(['21 Nov', 'Kofi Mensah filed it'], ['22 Nov', 'Three customers hit it this week']) },
  { id: 'TRK-403', title: 'Invoice PDF shows the previous month on the 1st', area: 'Billing', reporter: 'Priya Nair', createdAt: '2026-11-20', priority: 'high', assignee: null, status: 'open', log: log(['20 Nov', 'Priya Nair filed it'], ['20 Nov', 'Stamped High by Priya Nair']) },
  { id: 'TRK-404', title: 'Webhook retries hammer the receiver after a 429', area: 'API', reporter: 'Jonas Weber', createdAt: '2026-11-20', priority: 'none', assignee: 'jonas', status: 'open', log: log(['20 Nov', 'Jonas Weber filed it and took it']) },
  { id: 'TRK-405', title: 'Dark mode: focus ring vanishes on the sidebar links', area: 'Web app', reporter: 'Mara Okafor', createdAt: '2026-11-19', priority: 'low', assignee: null, status: 'open', log: log(['19 Nov', 'Mara Okafor filed it']) },
  { id: 'TRK-406', title: 'Search returns archived projects first', area: 'Search', reporter: 'Tomás Reyes', createdAt: '2026-11-19', priority: 'medium', assignee: 'tomas', status: 'in-progress', log: log(['19 Nov', 'Tomás Reyes filed it'], ['22 Nov', 'Moved to In progress']) },
  { id: 'TRK-407', title: 'Payment page times out on slow 3G', area: 'Billing', reporter: 'Ana Lindqvist', createdAt: '2026-11-18', priority: 'urgent', assignee: 'priya', status: 'in-progress', log: log(['18 Nov', 'Ana Lindqvist filed it'], ['18 Nov', 'Stamped Urgent and handed to Priya Nair'], ['23 Nov', 'Moved to In progress']) },
  { id: 'TRK-408', title: 'Seat count off by one after removing an invited user', area: 'Billing', reporter: 'Kofi Mensah', createdAt: '2026-11-18', priority: 'high', assignee: 'mara', status: 'open', log: log(['18 Nov', 'Kofi Mensah filed it'], ['19 Nov', 'Handed to Mara Okafor']) },
  { id: 'TRK-409', title: 'Mobile nav drawer traps focus when closed', area: 'Web app', reporter: 'Priya Nair', createdAt: '2026-11-17', priority: 'medium', assignee: 'mara', status: 'open', log: log(['17 Nov', 'Priya Nair filed it']) },
  { id: 'TRK-410', title: 'Audit log timestamps ignore the workspace time zone', area: 'Admin', reporter: 'Jonas Weber', createdAt: '2026-11-14', priority: 'medium', assignee: 'ana', status: 'open', log: log(['14 Nov', 'Jonas Weber filed it']) },
  { id: 'TRK-411', title: 'Typo in the onboarding email subject line', area: 'Email', reporter: 'Mara Okafor', createdAt: '2026-11-12', priority: 'low', assignee: 'kofi', status: 'closed', log: log(['12 Nov', 'Mara Okafor filed it'], ['13 Nov', 'Closed by Kofi Mensah']) },
  { id: 'TRK-412', title: 'Upload progress bar jumps back to 0% on a retry', area: 'Files', reporter: 'Tomás Reyes', createdAt: '2026-11-11', priority: 'none', assignee: null, status: 'open', log: log(['11 Nov', 'Tomás Reyes filed it']) },
  { id: 'TRK-413', title: 'Export button stays disabled for read-only members', area: 'Reports', reporter: 'Ana Lindqvist', createdAt: '2026-11-24', priority: 'none', assignee: null, status: 'open', log: log(['24 Nov', 'Ana Lindqvist filed it']) },
];
