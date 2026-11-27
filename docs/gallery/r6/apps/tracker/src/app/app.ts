import { Component, HostListener, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastComponent } from '../components/fgu/toast/toast.component';
import { ToastStore } from '../components/fgu/toast/toast-store.service';
import { Notify } from './notify';
import { DialogComponent } from '../components/fgu/dialog/dialog.component';
import { ButtonComponent } from '../components/fgu/button/button.component';
import { FieldComponent } from '../components/fgu/field/field.component';
import { SelectComponent } from '../components/fgu/select/select.component';
import { Hotkeys } from './hotkeys';
import { IssueStore } from './issue-store';
import { AREAS, Area, PRIORITY_NAME, Priority } from './model';
import { Theme } from './theme';
import { typing } from './util';

interface Strip { keys: string[]; label: string }

const TRIAGE_STRIP: Strip[] = [
  { keys: ['J', 'K'], label: 'move' },
  { keys: ['1–6'], label: 'sort to a person' },
  { keys: ['P'], label: 'priority' },
  { keys: ['S'], label: 'later' },
  { keys: ['X'], label: 'close' },
  { keys: ['Z'], label: 'undo' },
];
const ISSUES_STRIP: Strip[] = [
  { keys: ['/'], label: 'search' },
  { keys: ['J', 'K'], label: 'move' },
  { keys: ['Enter'], label: 'open' },
];
const ISSUE_STRIP: Strip[] = [
  { keys: ['1–6'], label: 'reassign' },
  { keys: ['P'], label: 'priority' },
  { keys: ['Esc'], label: 'back' },
];
const GLOBAL_STRIP: Strip[] = [
  { keys: ['C'], label: 'new issue' },
  { keys: ['G', 'T'], label: 'triage' },
  { keys: ['G', 'I'], label: 'issues' },
  { keys: ['?'], label: 'all keys' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, DialogComponent, ButtonComponent, FieldComponent, SelectComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected readonly store = inject(IssueStore);
  protected readonly toasts = inject(ToastStore);
  private readonly notify = inject(Notify);
  protected readonly theme = inject(Theme);
  private readonly hotkeys = inject(Hotkeys);
  private readonly router = inject(Router);

  protected readonly newOpen = signal(false);
  protected readonly keysOpen = signal(false);
  protected readonly title = signal('');
  protected readonly body = signal('');
  protected readonly area = signal<Area>('Billing');
  protected readonly priority = signal('2');
  protected readonly titleError = signal('');
  private gPending = false;

  private readonly url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  protected readonly strip = computed<Strip[]>(() => {
    const u = this.url();
    const page = u.startsWith('/issues/') ? ISSUE_STRIP : u.startsWith('/issues') ? ISSUES_STRIP : TRIAGE_STRIP;
    return [...page, ...GLOBAL_STRIP];
  });
  protected readonly unsorted = computed(() => this.store.inbox().length);

  protected readonly areaOptions = AREAS.map((a) => ({ value: a, label: a }));
  protected readonly priorityOptions = ([0, 1, 2, 3] as Priority[]).map((p) => ({ value: String(p), label: `P${p} ${PRIORITY_NAME[p]}` }));

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '?' && !typing(e)) {
      e.preventDefault();
      this.keysOpen.set(true);
      return;
    }
    if (typing(e)) return;
    if (this.gPending) {
      this.gPending = false;
      if (e.key === 't') { e.preventDefault(); void this.router.navigate(['/triage']); return; }
      if (e.key === 'i') { e.preventDefault(); void this.router.navigate(['/issues']); return; }
    }
    if (e.key === 'g') { this.gPending = true; setTimeout(() => (this.gPending = false), 900); return; }
    if (this.hotkeys.offer(e)) { e.preventDefault(); return; }
    if (e.key === 'c') { e.preventDefault(); this.openNew(); }
  }

  protected openNew(): void {
    this.titleError.set('');
    this.newOpen.set(true);
  }

  protected createIssue(): void {
    const title = this.title().trim();
    if (!title) {
      this.titleError.set('Give the issue a title so the team can recognise it.');
      return;
    }
    const issue = this.store.create({ title, body: this.body().trim(), area: this.area(), priority: Number(this.priority()) as Priority });
    this.title.set('');
    this.body.set('');
    this.newOpen.set(false);
    this.notify.say({ message: `HRB-${issue.num} is in the unsorted pile`, timeout: 4000 });
    void this.router.navigate(['/triage']);
  }

  protected resetDemo(): void {
    this.store.resetDemo();
    this.keysOpen.set(false);
    this.notify.say({ message: 'Demo issues restored', timeout: 3000 });
  }
}
