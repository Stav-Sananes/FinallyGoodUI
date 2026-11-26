import { Injectable, computed, inject, signal } from '@angular/core';
import { IssueGateway } from '../data/issue-gateway';
import {
  Issue,
  Priority,
  PRIORITY_LABEL,
  STATUS_LABEL,
  ViewId,
  VIEWS,
  compareForView,
  isInView,
  isUntriaged,
  matchesQuery,
  nextIssueId,
  nextStatus,
  personName,
} from '../domain/issue';
import { ToastStore } from './toast-store';

export type Phase = 'loading' | 'ready' | 'error';

interface UndoEntry {
  readonly before: Issue;
  readonly description: string;
}

const todayLabel = () => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date());

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private readonly gateway = inject(IssueGateway);
  private readonly toasts = inject(ToastStore);
  private readonly undoStack: UndoEntry[] = [];

  readonly phase = signal<Phase>('loading');
  readonly issues = signal<readonly Issue[]>([]);
  readonly view = signal<ViewId>(readUrl('view', VIEWS.map((v) => v.id), 'intake'));
  readonly query = signal(new URLSearchParams(location.search).get('q') ?? '');
  readonly showClosed = signal(false);
  readonly cursorId = signal<string | null>(null);
  readonly syncedAt = signal<Date | null>(null);
  /** True after the user's own action emptied intake; drives the one hero moment. */
  readonly justCleared = signal(false);

  readonly visible = computed(() =>
    this.issues()
      .filter((issue) => isInView(issue, this.view(), this.showClosed()) && matchesQuery(issue, this.query()))
      .sort(compareForView(this.view())),
  );
  readonly cursor = computed(() => this.issues().find((issue) => issue.id === this.cursorId()) ?? null);
  readonly counts = computed(() => {
    const open = this.issues().filter((issue) => issue.status !== 'closed');
    return { intake: open.filter(isUntriaged).length, mine: open.filter((issue) => isInView(issue, 'mine', false)).length, all: open.length };
  });

  async load(): Promise<void> {
    this.phase.set('loading');
    try {
      this.issues.set(await this.gateway.fetchAll());
      this.syncedAt.set(new Date());
      this.phase.set('ready');
      if (!this.cursor()) this.cursorId.set(this.visible()[0]?.id ?? null);
    } catch {
      this.phase.set('error');
    }
  }

  setView(view: ViewId): void {
    this.view.set(view);
    this.justCleared.set(false);
    this.cursorId.set(this.visible()[0]?.id ?? null);
    writeUrl({ view: view === 'intake' ? null : view });
  }

  stepView(delta: 1 | -1): ViewId {
    const index = VIEWS.findIndex((v) => v.id === this.view());
    const next = VIEWS[(index + delta + VIEWS.length) % VIEWS.length].id;
    this.setView(next);
    return next;
  }

  setQuery(query: string): void {
    this.query.set(query);
    writeUrl({ q: query || null });
    if (!this.cursor() || !this.visible().some((issue) => issue.id === this.cursorId())) this.cursorId.set(this.visible()[0]?.id ?? null);
  }

  toggleClosed(show: boolean): void {
    this.showClosed.set(show);
    this.settleCursor(this.visible().findIndex((i) => i.id === this.cursorId()));
  }

  select(id: string): void {
    this.cursorId.set(id);
  }

  move(delta: 1 | -1): void {
    const list = this.visible();
    if (!list.length) return;
    const index = list.findIndex((issue) => issue.id === this.cursorId());
    const next = index === -1 ? 0 : Math.min(list.length - 1, Math.max(0, index + delta));
    this.cursorId.set(list[next].id);
  }

  setPriority(id: string, priority: Priority): void {
    const now = this.find(id);
    if (!now || now.priority === priority) return;
    const text = priority === 'none' ? 'Priority stamp wiped' : `Stamped ${PRIORITY_LABEL[priority]}`;
    void this.change(id, { priority }, text, `${id}: ${text.toLowerCase()}`);
  }

  assign(id: string, assignee: string | null): void {
    const now = this.find(id);
    if (!now || now.assignee === assignee) return;
    const text = assignee ? `Handed to ${personName(assignee)}` : 'Put back in intake';
    void this.change(id, { assignee }, text, `${id}: ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
  }

  stepStatus(id: string): void {
    const now = this.find(id);
    if (!now) return;
    const status = nextStatus(now.status);
    void this.change(id, { status }, `Moved to ${STATUS_LABEL[status]}`, `${id} is now ${STATUS_LABEL[status].toLowerCase()}`);
  }

  close(id: string): void {
    const now = this.find(id);
    if (!now || now.status === 'closed') return;
    void this.change(id, { status: 'closed' }, 'Closed', `${id} closed`);
  }

  async create(title: string, area: string, reporterId: string): Promise<void> {
    const issue: Issue = {
      id: nextIssueId(this.issues()),
      title,
      area: area || 'General',
      reporter: personName(reporterId),
      createdAt: new Date().toISOString().slice(0, 10),
      priority: 'none',
      assignee: null,
      status: 'open',
      log: [{ at: todayLabel(), text: `${personName(reporterId)} filed it` }],
    };
    const before = this.visible().findIndex((i) => i.id === this.cursorId());
    this.issues.update((list) => [...list, issue]);
    this.justCleared.set(false);
    this.view.set('intake');
    this.query.set('');
    writeUrl({ view: null, q: null });
    this.cursorId.set(issue.id);
    try {
      await this.gateway.save(issue);
      this.toasts.show(`${issue.id} landed in intake`);
    } catch {
      this.issues.update((list) => list.filter((row) => row.id !== issue.id));
      this.settleCursor(before);
      this.toasts.showError(`${issue.id} was not saved. You are offline.`, { label: 'Retry', run: () => void this.create(title, area, reporterId) });
    }
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) {
      this.toasts.show('Nothing to undo');
      return;
    }
    const current = this.find(entry.before.id);
    this.cursorId.set(entry.before.id);
    if (current) void this.write(entry.before, `Undid: ${entry.description}`, current, () => this.undoStack.push(entry), false);
  }

  find(id: string | null): Issue | undefined {
    return this.issues().find((issue) => issue.id === id);
  }

  private async change(id: string, patch: Partial<Issue>, logText: string, toastText: string): Promise<void> {
    const before = this.find(id);
    if (!before) return;
    const next: Issue = { ...before, ...patch, log: [...before.log, { at: todayLabel(), text: logText }] };
    this.undoStack.push({ before, description: toastText });
    await this.write(next, toastText, before, () => this.undoStack.pop());
  }

  private async write(next: Issue, toastText: string, rollbackTo: Issue, onFail: () => void, canUndo = true): Promise<void> {
    const index = this.visible().findIndex((issue) => issue.id === this.cursorId());
    const hadIntake = this.counts().intake > 0;
    this.replace(next);
    this.settleCursor(index);
    if (hadIntake && this.counts().intake === 0 && this.view() === 'intake') this.justCleared.set(true);
    try {
      await this.gateway.save(next);
      this.toasts.show(toastText, canUndo ? { label: 'Undo', run: () => this.undo() } : undefined);
    } catch {
      this.replace(rollbackTo);
      onFail();
      this.justCleared.set(false);
      this.cursorId.set(next.id);
      this.toasts.showError(`Not saved: ${toastText}. You are offline.`, { label: 'Retry', run: () => void this.change(next.id, { priority: next.priority, assignee: next.assignee, status: next.status }, next.log.at(-1)?.text ?? 'Changed', toastText) });
    }
  }

  private replace(next: Issue): void {
    this.issues.update((list) => list.map((issue) => (issue.id === next.id ? next : issue)));
  }

  /** Keep the cursor on a letter that is still in the tray: the one now at the old position. */
  private settleCursor(previousIndex: number): void {
    const list = this.visible();
    if (list.some((issue) => issue.id === this.cursorId())) return;
    this.cursorId.set(list[Math.min(Math.max(previousIndex, 0), list.length - 1)]?.id ?? null);
  }
}

function readUrl<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(location.search).get(key);
  return allowed.find((item) => item === value) ?? fallback;
}

function writeUrl(changes: Record<string, string | null>): void {
  const params = new URLSearchParams(location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const search = params.toString();
  history.replaceState(null, '', `${location.pathname}${search ? `?${search}` : ''}`);
}
