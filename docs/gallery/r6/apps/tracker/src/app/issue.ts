import { Component, OnDestroy, OnInit, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonComponent } from '../components/fgu/button/button.component';
import { SelectComponent } from '../components/fgu/select/select.component';
import { Notify } from './notify';
import { Hotkeys } from './hotkeys';
import { IssueStore } from './issue-store';
import { Issue, PEOPLE, PRIORITY_NAME, STATUS_NAME, Priority, Status, issueRef } from './model';
import { SlipComponent } from './slip';
import { clock } from './util';

@Component({
  selector: 'app-issue',
  imports: [RouterLink, ButtonComponent, SelectComponent, SlipComponent],
  templateUrl: './issue.html',
  styleUrl: './issue.css',
  encapsulation: ViewEncapsulation.None,
})
export class IssuePage implements OnInit, OnDestroy {
  readonly num = input<string>();
  protected readonly store = inject(IssueStore);
  private readonly toasts = inject(Notify);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hotkeys = inject(Hotkeys);
  private unregister?: () => void;

  protected readonly people = PEOPLE;
  protected readonly priorities = [0, 1, 2, 3] as Priority[];
  protected readonly priorityName = PRIORITY_NAME;
  protected readonly statusOptions = (Object.keys(STATUS_NAME) as Status[]).map((s) => ({ value: s, label: STATUS_NAME[s] }));
  protected readonly clock = clock;
  private readonly forced = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('state'))), { initialValue: null as string | null });

  protected readonly issue = computed<Issue | undefined>(() => this.store.issues().find((i) => String(i.num) === this.num()));
  protected readonly view = computed<'loading' | 'error' | 'missing' | 'full'>(() => {
    const f = this.forced();
    if (f === 'loading') return 'loading';
    if (f === 'error') return 'error';
    const s = this.store.loadState();
    if (s !== 'ready') return s;
    return this.issue() ? 'full' : 'missing';
  });
  protected readonly ref = issueRef;
  protected readonly status = computed(() => (this.issue()?.closed ? 'done' : this.issue()?.status ?? 'inbox'));

  ngOnInit(): void {
    this.store.load();
    this.unregister = this.hotkeys.register((e) => this.onKey(e));
  }
  ngOnDestroy(): void { this.unregister?.(); }

  protected retry(): void {
    this.store.retry();
    void this.router.navigate([], { relativeTo: this.route, queryParams: { state: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected assign(personId: string): void {
    const i = this.issue();
    if (!i) return;
    if (i.owner === personId) return;
    this.store.assign(i.num, personId);
    this.said(`${issueRef(i)} is with ${this.people.find((p) => p.id === personId)?.first}`);
  }
  protected unassign(): void {
    const i = this.issue();
    if (!i || !i.owner) return;
    this.store.unassign(i.num);
    this.said(`${issueRef(i)} is back in the unsorted pile`);
  }
  protected setPriority(p: Priority): void {
    const i = this.issue();
    if (i && i.priority !== p) this.store.setPriority(i.num, p);
  }
  protected setStatus(s: string): void {
    const i = this.issue();
    if (i && this.status() !== s) this.store.setStatus(i.num, s as Status);
  }

  private said(message: string): void {
    this.toasts.say({ message, timeout: 5000, action: 'Undo (Z)', onAction: (id) => { this.store.undo(); this.toasts.dismiss(id); } });
  }

  private onKey(e: KeyboardEvent): boolean {
    if (e.key === 'Escape') { void this.router.navigate(['/issues']); return true; }
    if (e.key === 'z') { this.store.undo(); return true; }
    const i = this.issue();
    if (!i || this.view() !== 'full') return false;
    const n = Number(e.key);
    if (n >= 1 && n <= 6) { this.assign(this.people[n - 1].id); return true; }
    if (e.key === 'p') { this.setPriority(((i.priority + 1) % 4) as Priority); return true; }
    return false;
  }
}
