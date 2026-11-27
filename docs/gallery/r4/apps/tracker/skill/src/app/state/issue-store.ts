import { Injectable, computed, inject, signal } from '@angular/core';
import { IssueGateway } from '../data/issue-gateway';
import {
  Issue,
  Priority,
  PRIORITY_LABEL,
  STATUS_LABEL,
  ViewId,
  compareForRack,
  countByPriority,
  isInView,
  isUntriaged,
  matchesQuery,
  nextIssueId,
  personName,
} from '../domain/issue';
import { ToastStore } from './toast-store';

export type Phase = 'loading' | 'ready' | 'error';

interface UndoEntry {
  readonly before: Issue;
  readonly description: string;
}

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private readonly gateway = inject(IssueGateway);
  private readonly toasts = inject(ToastStore);
  private readonly undoStack: UndoEntry[] = [];

  readonly phase = signal<Phase>('loading');
  readonly issues = signal<readonly Issue[]>([]);
  readonly view = signal<ViewId>('untriaged');
  readonly query = signal('');
  readonly syncedAt = signal<Date | null>(null);
  readonly saveFailed = signal(false);

  readonly visible = computed(() =>
    this.issues()
      .filter((issue) => isInView(issue, this.view()) && matchesQuery(issue, this.query()))
      .sort(compareForRack),
  );
  readonly untriagedCount = computed(() => this.issues().filter(isUntriaged).length);
  readonly mineCount = computed(() => this.issues().filter((issue) => isInView(issue, 'mine')).length);
  readonly allCount = computed(() => this.issues().length);
  readonly priorityCounts = computed(() => countByPriority(this.issues()));

  async load(): Promise<void> {
    this.phase.set('loading');
    try {
      this.issues.set(await this.gateway.fetchAll());
      this.syncedAt.set(new Date());
      this.phase.set('ready');
    } catch {
      this.phase.set('error');
    }
  }

  setPriority(id: string, priority: Priority): void {
    void this.change(id, { priority }, `${id} set to ${PRIORITY_LABEL[priority].toLowerCase()}`);
  }

  assign(id: string, assignee: string | null): void {
    void this.change(id, { assignee }, `${id} handed to ${personName(assignee)}`);
  }

  setStatus(id: string, status: Issue['status']): void {
    void this.change(id, { status }, `${id} marked ${STATUS_LABEL[status].toLowerCase()}`);
  }

  rename(id: string, title: string): void {
    void this.change(id, { title }, `${id} renamed`);
  }

  async create(title: string, area: string, reporter: string): Promise<string> {
    const issue: Issue = {
      id: nextIssueId(this.issues()),
      title,
      area: area || 'General',
      reporter,
      createdAt: new Date().toISOString().slice(0, 10),
      priority: 'none',
      assignee: null,
      status: 'open',
    };
    this.issues.update((list) => [...list, issue]);
    try {
      await this.gateway.save(issue);
      this.toasts.show(`${issue.id} added to the bay`);
    } catch {
      this.issues.update((list) => list.filter((row) => row.id !== issue.id));
      this.toasts.showError(`${issue.id} was not saved. You are offline.`, { label: 'Retry', run: () => void this.create(title, area, reporter) });
    }
    return issue.id;
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) {
      this.toasts.show('Nothing to undo');
      return;
    }
    void this.write(entry.before, `Undid: ${entry.description}`, false);
  }

  find(id: string | null): Issue | undefined {
    return this.issues().find((issue) => issue.id === id);
  }

  private async change(id: string, patch: Partial<Issue>, description: string): Promise<void> {
    const before = this.find(id);
    if (!before) return;
    this.undoStack.push({ before, description });
    await this.write({ ...before, ...patch }, description, true, before);
  }

  private async write(next: Issue, description: string, offerUndo: boolean, before?: Issue): Promise<void> {
    const rollback = before ?? this.find(next.id);
    this.replace(next);
    try {
      await this.gateway.save(next);
      this.saveFailed.set(false);
      this.toasts.show(description, offerUndo ? { label: 'Undo', run: () => this.undo() } : undefined);
    } catch {
      if (rollback) this.replace(rollback);
      if (offerUndo) this.undoStack.pop();
      this.saveFailed.set(true);
      this.toasts.showError(`Not saved: ${description}. You are offline.`, { label: 'Retry', run: () => void this.change(next.id, next, description) });
    }
  }

  private replace(next: Issue): void {
    this.issues.update((list) => list.map((issue) => (issue.id === next.id ? next : issue)));
  }
}
