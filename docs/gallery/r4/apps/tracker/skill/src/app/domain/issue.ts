export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'none';
export type Status = 'open' | 'in-progress' | 'closed';
export type ViewId = 'untriaged' | 'mine' | 'all';

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
}

export interface Issue {
  readonly id: string;
  readonly title: string;
  readonly area: string;
  readonly reporter: string;
  readonly createdAt: string;
  readonly priority: Priority;
  readonly assignee: string | null;
  readonly status: Status;
}

export const TEAM: readonly Person[] = [
  { id: 'mara', name: 'Mara Okafor', initials: 'MO' },
  { id: 'tomas', name: 'Tomás Reyes', initials: 'TR' },
  { id: 'priya', name: 'Priya Nair', initials: 'PN' },
  { id: 'jonas', name: 'Jonas Weber', initials: 'JW' },
  { id: 'ana', name: 'Ana Lindqvist', initials: 'AL' },
  { id: 'kofi', name: 'Kofi Mensah', initials: 'KM' },
];

export const CURRENT_USER_ID = 'mara';

/** Priority keys 1-4 map to these, 0 clears. */
export const PRIORITY_BY_KEY: Readonly<Record<string, Priority>> = {
  '1': 'urgent',
  '2': 'high',
  '3': 'normal',
  '4': 'low',
  '0': 'none',
};

export const PRIORITY_LABEL: Readonly<Record<Priority, string>> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
  none: 'No priority',
};

export const PRIORITIES: readonly Priority[] = ['urgent', 'high', 'normal', 'low', 'none'];

export const STATUS_LABEL: Readonly<Record<Status, string>> = {
  open: 'Open',
  'in-progress': 'In progress',
  closed: 'Closed',
};

const STATUS_CYCLE: readonly Status[] = ['open', 'in-progress', 'closed'];

export function nextStatus(status: Status): Status {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];
}

export function personName(id: string | null): string {
  return TEAM.find((person) => person.id === id)?.name ?? 'Unassigned';
}

export function personInitials(id: string | null): string {
  return TEAM.find((person) => person.id === id)?.initials ?? '--';
}

export function isUntriaged(issue: Issue): boolean {
  return issue.status !== 'closed' && (issue.priority === 'none' || issue.assignee === null);
}

export function isInView(issue: Issue, view: ViewId): boolean {
  if (view === 'untriaged') return isUntriaged(issue);
  if (view === 'mine') return issue.assignee === CURRENT_USER_ID && issue.status !== 'closed';
  return true;
}

export function matchesQuery(issue: Issue, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = `${issue.id} ${issue.title} ${issue.area} ${personName(issue.assignee)}`.toLowerCase();
  return haystack.includes(needle);
}

const PRIORITY_RANK: Readonly<Record<Priority, number>> = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };

/** Open work first, then by priority, then newest first. Closed issues sink. */
export function compareForRack(a: Issue, b: Issue): number {
  const closed = Number(a.status === 'closed') - Number(b.status === 'closed');
  if (closed !== 0) return closed;
  const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (rank !== 0) return rank;
  return b.createdAt.localeCompare(a.createdAt);
}

export function countByPriority(issues: readonly Issue[]): Record<Priority, number> {
  const counts: Record<Priority, number> = { urgent: 0, high: 0, normal: 0, low: 0, none: 0 };
  for (const issue of issues) if (issue.status !== 'closed') counts[issue.priority] += 1;
  return counts;
}

export function nextIssueId(issues: readonly Issue[]): string {
  const highest = issues.reduce((max, issue) => Math.max(max, Number(issue.id.split('-')[1])), 0);
  return `TRK-${highest + 1}`;
}
