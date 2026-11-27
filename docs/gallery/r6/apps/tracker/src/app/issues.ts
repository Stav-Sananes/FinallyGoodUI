import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonComponent } from '../components/fgu/button/button.component';
import { FieldComponent } from '../components/fgu/field/field.component';
import { SelectComponent } from '../components/fgu/select/select.component';
import { TableComponent } from '../components/fgu/table/table.component';
import { Hotkeys } from './hotkeys';
import { IssueStore } from './issue-store';
import { Issue, PEOPLE, PRIORITY_NAME, STATUS_NAME, Status, issueRef, personOf } from './model';
import { ago } from './util';

const COLUMNS = [
  { key: 'ref', label: 'Issue', sortable: true },
  { key: 'title', label: 'Title' },
  { key: 'owner', label: 'Owner' },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'age', label: 'Reported', sortable: true, align: 'end' as const },
];

@Component({
  selector: 'app-issues',
  imports: [ButtonComponent, FieldComponent, SelectComponent, TableComponent],
  templateUrl: './issues.html',
  styleUrl: './issues.css',
  encapsulation: ViewEncapsulation.None,
})
export class IssuesPage implements OnInit, AfterViewInit, OnDestroy {
  protected readonly store = inject(IssueStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hotkeys = inject(Hotkeys);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private unregister?: () => void;
  private cursor = -1;

  private readonly narrow = signal(matchMedia('(max-width: 48rem)').matches);
  protected readonly columns = computed(() => (this.narrow() ? COLUMNS.filter((c) => ['ref', 'title', 'priority'].includes(c.key)) : COLUMNS));
  private readonly params = toSignal(this.route.queryParamMap.pipe(map((p) => ({ q: p.get('q') ?? '', status: p.get('status') ?? 'all', owner: p.get('owner') ?? 'all', sort: p.get('sort') ?? 'age:ascending', state: p.get('state') }))), {
    initialValue: { q: '', status: 'all', owner: 'all', sort: 'age:ascending', state: null as string | null },
  });
  protected readonly q = computed(() => this.params().q);
  protected readonly status = computed(() => this.params().status);
  protected readonly owner = computed(() => this.params().owner);
  protected readonly sort = computed(() => this.params().sort);
  protected readonly filtered = computed(() => this.params().q !== '' || this.params().status !== 'all' || this.params().owner !== 'all');

  protected readonly statusOptions = [{ value: 'all', label: 'Any status' }, ...(Object.keys(STATUS_NAME) as Status[]).map((s) => ({ value: s, label: STATUS_NAME[s] }))];
  protected readonly ownerOptions = [{ value: 'all', label: 'Anyone' }, { value: 'none', label: 'Unassigned' }, ...PEOPLE.map((p) => ({ value: p.id, label: p.name }))];

  protected readonly view = computed<'loading' | 'error' | 'ready'>(() => {
    const f = this.params().state;
    if (f === 'loading' || f === 'error') return f;
    const s = this.store.loadState();
    return s === 'ready' ? 'ready' : s;
  });

  private readonly matches = computed<Issue[]>(() => {
    const { q, status, owner, sort, state } = this.params();
    if (state === 'empty') return [];
    const needle = q.trim().toLowerCase();
    const [key, dir] = sort.split(':');
    const rows = this.store.issues().filter((i) => {
      if (status !== 'all' && (i.closed ? 'done' : i.status) !== status) return false;
      if (owner === 'none' ? i.owner !== null : owner !== 'all' && i.owner !== owner) return false;
      if (!needle) return true;
      return `${issueRef(i)} ${i.title} ${i.area} ${i.reporter}`.toLowerCase().includes(needle);
    });
    const sign = dir === 'descending' ? -1 : 1;
    const by: Record<string, (a: Issue, b: Issue) => number> = {
      ref: (a, b) => a.num - b.num,
      priority: (a, b) => a.priority - b.priority || b.createdAt - a.createdAt,
      age: (a, b) => b.createdAt - a.createdAt,
    };
    return [...rows].sort((a, b) => sign * (by[key] ?? by['age'])(a, b));
  });
  protected readonly rows = computed(() =>
    this.matches().map((i) => ({
      id: String(i.num),
      ref: issueRef(i),
      title: i.title,
      owner: personOf(i.owner)?.name ?? 'Unassigned',
      priority: `P${i.priority} ${PRIORITY_NAME[i.priority]}`,
      status: i.closed ? 'Closed' : STATUS_NAME[i.status],
      age: ago(i.createdAt),
    })),
  );
  protected readonly total = computed(() => this.store.issues().length);

  constructor() {
    const mq = matchMedia('(max-width: 48rem)');
    mq.addEventListener('change', (e) => this.narrow.set(e.matches));
    effect(() => {
      this.rows();
      this.cursor = -1;
      queueMicrotask(() => this.paintCursor());
    });
  }

  ngAfterViewInit(): void {
    // Rows are plain table rows from the component; make each one a reachable, openable record.
    const tbl = this.el.nativeElement.querySelector<HTMLElement>('.tbl');
    if (!tbl) return;
    tbl.addEventListener('click', (e) => this.rowClick(e));
    tbl.addEventListener('keydown', (e) => {
      const tr = (e.target as HTMLElement).closest<HTMLElement>('tr[data-row-id]');
      if (tr && tr === e.target && e.key === 'Enter') { e.preventDefault(); this.open(tr); }
    });
    tbl.addEventListener('focusin', (e) => {
      const tr = (e.target as HTMLElement).closest<HTMLElement>('tbody tr[data-row-id]');
      if (tr) this.cursor = Array.from(tbl.querySelectorAll('tbody tr[data-row-id]')).indexOf(tr);
    });
  }

  ngOnInit(): void {
    this.store.load();
    this.unregister = this.hotkeys.register((e) => this.onKey(e));
  }
  ngOnDestroy(): void {
    this.unregister?.();
  }

  protected setParam(key: string, value: string): void {
    const neutral = (key === 'status' || key === 'owner') ? 'all' : '';
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [key]: value === neutral ? null : value }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  protected clear(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { q: null, status: null, owner: null, state: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  protected retry(): void {
    this.store.retry();
    void this.router.navigate([], { relativeTo: this.route, queryParams: { state: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  protected onSort(value: string): void { this.setParam('sort', value); }

  private rowClick(e: Event): void {
    const tr = (e.target as HTMLElement).closest<HTMLElement>('tbody tr[data-row-id]');
    if (tr) this.open(tr);
  }
  private open(tr: HTMLElement): void {
    void this.router.navigate(['/issues', tr.dataset['rowId']]);
  }

  private onKey(e: KeyboardEvent): boolean {
    const n = this.rows().length;
    if (e.key === '/') {
      this.el.nativeElement.querySelector<HTMLInputElement>('#issues-q')?.focus();
      return true;
    }
    if (!n) return false;
    if (e.key === 'j' || e.key === 'ArrowDown') { this.cursor = Math.min(n - 1, this.cursor + 1); this.paintCursor(); return true; }
    if (e.key === 'k' || e.key === 'ArrowUp') { this.cursor = this.cursor < 0 ? n - 1 : Math.max(0, this.cursor - 1); this.paintCursor(); return true; }
    if (e.key === 'Enter' && this.cursor >= 0 && !(e.target as HTMLElement | null)?.closest('button, a')) {
      void this.router.navigate(['/issues', this.rows()[this.cursor].id]);
      return true;
    }
    return false;
  }

  private paintCursor(): void {
    const trs = this.el.nativeElement.querySelectorAll<HTMLElement>('tbody tr[data-row-id]');
    trs.forEach((tr, i) => {
      tr.tabIndex = 0;
      if (i === this.cursor) {
        tr.setAttribute('data-cursor', '');
        tr.scrollIntoView({ block: 'nearest' });
      } else tr.removeAttribute('data-cursor');
    });
  }
}
