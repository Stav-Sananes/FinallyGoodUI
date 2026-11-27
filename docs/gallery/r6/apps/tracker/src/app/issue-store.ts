import { Injectable, computed, signal } from '@angular/core';
import { Issue, Priority, Status, personOf, seedIssues, issueRef, Area } from './model';

export type LoadState = 'loading' | 'ready' | 'error';
const KEY = 'pigeonhole.issues.v1';
const LOAD_MS = 450;

@Injectable({ providedIn: 'root' })
export class IssueStore {
  readonly issues = signal<Issue[]>([]);
  readonly loadState = signal<LoadState>('loading');
  private history: Issue[][] = [];
  private loadedOnce = false;
  /** Bumped on every successful undo/assign so views can react. */
  readonly revision = signal(0);

  readonly inbox = computed(() => this.issues().filter((i) => i.status === 'inbox' && !i.closed));
  readonly open = computed(() => this.issues().filter((i) => i.status !== 'done' && !i.closed));

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loadedOnce) {
      this.loadState.set('ready');
      return;
    }
    this.loadState.set('loading');
    setTimeout(() => {
      this.issues.set(this.read() ?? seedIssues(Date.now()));
      this.loadedOnce = true;
      this.loadState.set('ready');
    }, LOAD_MS);
  }

  retry(): void {
    this.loadedOnce = false;
    this.load();
  }

  get(num: number): Issue | undefined {
    return this.issues().find((i) => i.num === num);
  }

  assign(num: number, personId: string): string {
    const person = personOf(personId);
    this.change(num, (i) => ({
      ...i,
      owner: personId,
      status: i.status === 'inbox' ? 'todo' : i.status,
      later: false,
      activity: [...i.activity, { at: Date.now(), text: `Sorted to ${person?.first ?? personId}` }],
    }));
    return `${issueRef({ num })} sorted to ${person?.first}`;
  }

  unassign(num: number): void {
    this.change(num, (i) => ({
      ...i,
      owner: null,
      status: i.status === 'todo' ? 'inbox' : i.status,
      activity: [...i.activity, { at: Date.now(), text: 'Taken out of the case' }],
    }));
  }

  setPriority(num: number, priority: Priority): void {
    this.change(num, (i) => ({ ...i, priority, activity: [...i.activity, { at: Date.now(), text: `Priority set to P${priority}` }] }));
  }

  setStatus(num: number, status: Status): void {
    this.change(num, (i) => ({
      ...i,
      status,
      closed: false,
      activity: [...i.activity, { at: Date.now(), text: `Status set to ${status}` }],
    }));
  }

  close(num: number): void {
    this.change(num, (i) => ({ ...i, closed: true, status: 'done', activity: [...i.activity, { at: Date.now(), text: 'Closed at triage' }] }));
  }

  snooze(num: number): void {
    this.issues.update((all) => {
      this.push(all);
      const target = all.find((i) => i.num === num);
      if (!target) return all;
      const moved: Issue = { ...target, later: true, activity: [...target.activity, { at: Date.now(), text: 'Put aside for later' }] };
      return [...all.filter((i) => i.num !== num), moved];
    });
    this.persist();
  }

  create(input: { title: string; body: string; area: Area; priority: Priority }): Issue {
    const num = Math.max(0, ...this.issues().map((i) => i.num)) + 1;
    const now = Date.now();
    const issue: Issue = {
      num,
      title: input.title,
      body: input.body || 'No details yet.',
      area: input.area,
      reporter: 'You',
      reports: 1,
      createdAt: now,
      priority: input.priority,
      owner: null,
      status: 'inbox',
      later: false,
      closed: false,
      activity: [{ at: now, text: 'Reported by You' }],
    };
    this.issues.update((all) => {
      this.push(all);
      return [issue, ...all];
    });
    this.persist();
    return issue;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.issues.set(prev);
    this.revision.update((n) => n + 1);
    this.persist();
    return true;
  }

  resetDemo(): void {
    this.history = [];
    this.issues.set(seedIssues(Date.now()));
    this.revision.update((n) => n + 1);
    this.persist();
  }

  private change(num: number, fn: (i: Issue) => Issue): void {
    this.issues.update((all) => {
      this.push(all);
      return all.map((i) => (i.num === num ? fn(i) : i));
    });
    this.revision.update((n) => n + 1);
    this.persist();
  }

  private push(snapshot: Issue[]): void {
    this.history.push(snapshot);
    if (this.history.length > 30) this.history.shift();
  }

  private read(): Issue[] | null {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Issue[]) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.issues()));
    } catch {
      /* private mode: the session still works */
    }
  }
}
