export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type Status = 'open' | 'in-progress' | 'closed';
export type ViewId = 'intake' | 'mine' | 'all';

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  /** The digit key that sorts a letter into this person's pigeonhole. */
  readonly slot: number;
}

export interface Entry {
  readonly at: string;
  readonly text: string;
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
  readonly log: readonly Entry[];
}

export const TEAM: readonly Person[] = [
  { id: 'mara', name: 'Mara Okafor', initials: 'MO', slot: 1 },
  { id: 'tomas', name: 'Tomás Reyes', initials: 'TR', slot: 2 },
  { id: 'priya', name: 'Priya Nair', initials: 'PN', slot: 3 },
  { id: 'jonas', name: 'Jonas Weber', initials: 'JW', slot: 4 },
  { id: 'ana', name: 'Ana Lindqvist', initials: 'AL', slot: 5 },
  { id: 'kofi', name: 'Kofi Mensah', initials: 'KM', slot: 6 },
];

export const CURRENT_USER_ID = 'mara';

export const VIEWS: readonly { id: ViewId; label: string }[] = [
  { id: 'intake', label: 'Intake' },
  { id: 'mine', label: 'Mine' },
  { id: 'all', label: 'All' },
];

export const PRIORITIES: readonly Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];

export const PRIORITY_LABEL: Readonly<Record<Priority, string>> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
};

/** The single letter stamped in the postmark ring: never colour alone. */
export const PRIORITY_MARK: Readonly<Record<Priority, string>> = { urgent: 'U', high: 'H', medium: 'M', low: 'L', none: '·' };

export const STATUS_LABEL: Readonly<Record<Status, string>> = {
  open: 'Open',
  'in-progress': 'In progress',
  closed: 'Closed',
};

const STATUS_CYCLE: readonly Status[] = ['open', 'in-progress', 'closed'];

export function nextStatus(status: Status): Status {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];
}

export function person(id: string | null): Person | undefined {
  return TEAM.find((member) => member.id === id);
}

export function personName(id: string | null): string {
  return person(id)?.name ?? 'Nobody yet';
}

export function personBySlot(slot: number): Person | undefined {
  return TEAM.find((member) => member.slot === slot);
}

/** A letter is in intake until it has both a priority and an owner. */
export function isUntriaged(issue: Issue): boolean {
  return issue.status !== 'closed' && (issue.priority === 'none' || issue.assignee === null);
}

export function isInView(issue: Issue, view: ViewId, showClosed: boolean): boolean {
  if (issue.status === 'closed' && !showClosed && view !== 'all') return false;
  if (view === 'intake') return isUntriaged(issue);
  if (view === 'mine') return issue.assignee === CURRENT_USER_ID;
  return showClosed || issue.status !== 'closed';
}

export function matchesQuery(issue: Issue, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${issue.id} ${issue.title} ${issue.area} ${personName(issue.assignee)} ${issue.reporter}`.toLowerCase().includes(needle);
}

const PRIORITY_RANK: Readonly<Record<Priority, number>> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

/** Intake keeps arrival order (oldest first, like a queue); other views put the heaviest first. */
export function compareForView(view: ViewId): (a: Issue, b: Issue) => number {
  return (a, b) => {
    const closed = Number(a.status === 'closed') - Number(b.status === 'closed');
    if (closed !== 0) return closed;
    if (view === 'intake') return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    return rank !== 0 ? rank : b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
  };
}

export interface Load {
  readonly open: number;
  readonly urgent: number;
}

export function loadOf(issues: readonly Issue[], personId: string): Load {
  const mine = issues.filter((issue) => issue.assignee === personId && issue.status !== 'closed');
  return { open: mine.length, urgent: mine.filter((issue) => issue.priority === 'urgent').length };
}

export function nextIssueId(issues: readonly Issue[]): string {
  const highest = issues.reduce((max, issue) => Math.max(max, Number(issue.id.split('-')[1])), 0);
  return `TRK-${highest + 1}`;
}

/** "26 Nov" in the viewer's locale. */
export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
}
