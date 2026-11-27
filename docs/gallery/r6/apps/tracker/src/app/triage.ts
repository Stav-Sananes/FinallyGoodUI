import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonComponent } from '../components/fgu/button/button.component';
import { RecordRowComponent } from '../components/fgu/record-row/record-row.component';
import { Notify } from './notify';
import { Hotkeys } from './hotkeys';
import { IssueStore } from './issue-store';
import { Issue, PEOPLE, PRIORITY_NAME, Person, Priority, isOpen, issueRef, personOf, suggestedFor } from './model';
import { SlipComponent } from './slip';
import { ago } from './util';
import { cssEase, msMotion, reduced } from './motion-tokens.js';

type View = 'loading' | 'error' | 'empty' | 'full';
let filledOnce = false;

@Component({
  selector: 'app-triage',
  imports: [ButtonComponent, RecordRowComponent, SlipComponent],
  templateUrl: './triage.html',
  styleUrl: './triage.css',
  encapsulation: ViewEncapsulation.None,
})
export class TriagePage implements OnInit, OnDestroy {
  protected readonly store = inject(IssueStore);
  private readonly toasts = inject(Notify);
  private readonly hotkeys = inject(Hotkeys);
  private readonly router = inject(Router);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly route = inject(ActivatedRoute);
  private unregister?: () => void;

  protected readonly people = PEOPLE;
  protected readonly priorityName = PRIORITY_NAME;
  protected readonly fill = !filledOnce;
  private readonly forced = toSignal(this.route.queryParamMap.pipe(map((q) => q.get('state'))), { initialValue: this.route.snapshot.queryParamMap.get('state') });

  protected readonly queue = computed<Issue[]>(() => (this.forced() === 'empty' ? [] : this.store.inbox()));
  protected readonly view = computed<View>(() => {
    const f = this.forced();
    if (f === 'loading') return 'loading';
    if (f === 'error') return 'error';
    const s = this.store.loadState();
    if (s !== 'ready') return s;
    return this.queue().length ? 'full' : 'empty';
  });
  private readonly cursor = signal<number | null>(null);
  protected readonly current = computed<Issue | null>(() => this.queue().find((i) => i.num === this.cursor()) ?? this.queue()[0] ?? null);
  protected readonly position = computed(() => {
    const c = this.current();
    return c ? this.queue().findIndex((i) => i.num === c.num) + 1 : 0;
  });
  protected readonly suggested = computed(() => {
    const c = this.current();
    return c ? suggestedFor(c.area) : null;
  });
  protected readonly loads = computed(() =>
    this.people.map((p) => {
      const mine = this.store.open().filter((i) => i.owner === p.id).sort((a, b) => a.priority - b.priority);
      return { person: p, mine, urgent: mine.filter((i) => i.priority === 0).length };
    }),
  );
  protected readonly canAssign = computed(() => this.view() === 'full' && !!this.current());
  protected readonly dealt = computed(() => this.store.issues().filter((i) => i.owner && isOpen(i)).length);

  private busy = false;
  private readonly acted: number[] = [];

  ngOnInit(): void {
    this.store.load();
    this.unregister = this.hotkeys.register((e) => this.onKey(e));
    filledOnce = true;
  }
  ngOnDestroy(): void {
    this.unregister?.();
  }

  protected ago = ago;
  protected ref = issueRef;
  protected retry(): void { this.store.retry(); void this.router.navigate([], { queryParams: { state: null }, queryParamsHandling: 'merge' }); }
  protected select(i: Issue): void { this.cursor.set(i.num); }
  protected openCurrent(): void {
    const c = this.current();
    if (c) void this.router.navigate(['/issues', c.num]);
  }

  private onKey(e: KeyboardEvent): boolean {
    if (e.key === 'z') { this.undo(); return true; }
    if (!this.canAssign()) return false;
    const idx = Number(e.key);
    if (idx >= 1 && idx <= 6) { void this.assign(this.people[idx - 1]); return true; }
    switch (e.key) {
      case 'j': case 'ArrowDown': this.move(1); return true;
      case 'k': case 'ArrowUp': this.move(-1); return true;
      case 'p': this.bump(1); return true;
      case 'P': this.bump(-1); return true;
      case 's': this.later(); return true;
      case 'x': this.close(); return true;
      case 'Enter':
        if ((e.target as HTMLElement | null)?.closest('button, a')) return false;
        this.openCurrent();
        return true;
      default: return false;
    }
  }

  protected move(step: number): void {
    const q = this.queue();
    if (!q.length) return;
    const at = this.position() - 1;
    // ArrowUp with no current item goes to the last one, like the behaviours in the component set.
    const next = at < 0 ? (step < 0 ? q.length - 1 : 0) : Math.min(q.length - 1, Math.max(0, at + step));
    this.cursor.set(q[next].num);
  }

  protected bump(step: number): void {
    const c = this.current();
    if (!c) return;
    this.store.setPriority(c.num, ((c.priority + step + 4) % 4) as Priority);
    this.acted.push(c.num);
  }

  protected async assign(person: Person): Promise<void> {
    const c = this.current();
    if (!c || this.busy || !this.canAssign()) return;
    this.busy = true;
    const q = this.queue();
    const at = q.findIndex((i) => i.num === c.num);
    await this.flight(person);
    this.store.assign(c.num, person.id);
    this.acted.push(c.num);
    const rest = this.queue();
    this.cursor.set(rest.length ? rest[Math.min(at, rest.length - 1)].num : null);
    this.say(`${issueRef(c)} sorted to ${person.first}, P${c.priority}`);
    this.busy = false;
  }

  protected later(): void {
    const c = this.current();
    if (!c) return;
    const at = this.position() - 1;
    this.store.snooze(c.num);
    this.acted.push(c.num);
    const rest = this.queue();
    this.cursor.set(rest.length ? rest[Math.min(at, rest.length - 1)].num : null);
    this.say(`${issueRef(c)} put aside for later`);
  }

  protected close(): void {
    const c = this.current();
    if (!c) return;
    const at = this.position() - 1;
    this.store.close(c.num);
    this.acted.push(c.num);
    const rest = this.queue();
    this.cursor.set(rest.length ? rest[Math.min(at, rest.length - 1)].num : null);
    this.say(`${issueRef(c)} closed without an owner`);
  }

  protected undo(): void {
    if (!this.store.undo()) {
      this.toasts.say({ message: 'Nothing to undo', timeout: 2500 });
      return;
    }
    const back = this.acted.pop();
    if (back !== undefined) this.cursor.set(back);
  }

  private say(message: string): void {
    this.toasts.say({
      message,
      timeout: 6000,
      action: 'Undo (Z)',
      onAction: (id) => { this.undo(); this.toasts.dismiss(id); },
    });
  }

  /** The one real transition: the slip drops into the chosen pigeonhole. */
  private async flight(person: Person): Promise<void> {
    const root = this.el.nativeElement;
    const slip = root.querySelector<HTMLElement>('.stage .slip-wrap');
    const hole = root.querySelector<HTMLElement>(`[data-hole="${person.id}"]`);
    if (!slip || !hole) return;
    const a = slip.getBoundingClientRect();
    const b = hole.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const move = !reduced();
    const frames: Keyframe[] = move
      ? [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.22)`, opacity: 0.35 }]
      : [{ opacity: 1 }, { opacity: 0 }];
    const anim = slip.animate(frames, { duration: move ? msMotion('short') : 100, easing: move ? cssEase('snappy') : 'linear', fill: 'forwards' });
    if (move) hole.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: msMotion('short') * 1.6, easing: cssEase('move') });
    try { await anim.finished; } catch { /* cancelled */ }
    anim.cancel();
  }

  protected personOf = personOf;
}
