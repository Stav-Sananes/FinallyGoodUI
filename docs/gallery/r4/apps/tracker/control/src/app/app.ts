import { Component, ElementRef, HostListener, OnInit, computed, signal, viewChild } from '@angular/core';
import { Issue, LABELS, ME, PRIORITIES, Priority, SEED, STATUSES, Status, TEAM, Member } from './issues.data';

type View = 'triage' | 'open' | 'mine' | 'done' | 'all';
type PickerKind = 'status' | 'priority' | 'assignee' | 'label';
interface Option { id: string; label: string; hue?: number }
interface Picker { kind: PickerKind; options: Option[]; active: number }

const VIEWS: { id: View; label: string }[] = [
  { id: 'triage', label: 'Triage' },
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'Mine' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];
const STORE = 'tracker.issues.v1';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly views = VIEWS;
  readonly statuses = STATUSES;
  readonly team = TEAM;
  readonly me = ME;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly offline = signal(typeof navigator !== 'undefined' && !navigator.onLine);
  readonly issues = signal<Issue[]>([]);
  readonly view = signal<View>('triage');
  readonly query = signal('');
  readonly cursor = signal(0);
  readonly selected = signal<ReadonlySet<number>>(new Set());
  readonly picker = signal<Picker | null>(null);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly helpOpen = signal(false);
  readonly toast = signal<{ text: string; undoable: boolean } | null>(null);

  private undoStack: Issue[][] = [];
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private failNextLoad = typeof location !== 'undefined' && location.search.includes('fail');

  readonly searchEl = viewChild<ElementRef<HTMLInputElement>>('search');
  readonly titleEl = viewChild<ElementRef<HTMLInputElement>>('newTitle');

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const v = this.view();
    return this.issues()
      .filter((i) => {
        if (v === 'triage') return i.status === 'triage' && !i.archived;
        if (v === 'open') return i.status !== 'done' && !i.archived;
        if (v === 'mine') return i.assignee === ME && i.status !== 'done' && !i.archived;
        if (v === 'done') return i.status === 'done' && !i.archived;
        return !i.archived;
      })
      .filter((i) => !q || this.haystack(i).includes(q))
      .sort((a, b) => this.rank(a.priority) - this.rank(b.priority) || b.id - a.id);
  });
  readonly counts = computed(() => {
    const live = this.issues().filter((i) => !i.archived);
    return {
      triage: live.filter((i) => i.status === 'triage').length,
      open: live.filter((i) => i.status !== 'done').length,
      mine: live.filter((i) => i.assignee === ME && i.status !== 'done').length,
      done: live.filter((i) => i.status === 'done').length,
      all: live.length,
    } as Record<View, number>;
  });
  readonly current = computed(() => this.visible()[this.cursor()] ?? null);
  readonly targets = computed(() => {
    const sel = this.selected();
    return sel.size ? this.visible().filter((i) => sel.has(i.id)) : this.current() ? [this.current()!] : [];
  });
  readonly emptyKind = computed(() => {
    if (this.visible().length) return null;
    if (this.query().trim()) return 'search';
    if (this.issues().filter((i) => !i.archived).length === 0) return 'none';
    return this.view();
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.loadError.set(false);
    setTimeout(() => {
      if (this.failNextLoad) {
        this.failNextLoad = false;
        this.loadError.set(true);
        this.loading.set(false);
        return;
      }
      this.issues.set(this.read());
      this.loading.set(false);
    }, 900);
  }

  private read(): Issue[] {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) return JSON.parse(raw) as Issue[];
    } catch { /* fall through to seed */ }
    return SEED;
  }

  private commit(next: Issue[], message: string) {
    this.undoStack.push(this.issues());
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.issues.set(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* storage full or blocked */ }
    this.showToast(message, true);
    this.clampCursor();
  }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return this.showToast('Nothing to undo', false);
    this.issues.set(prev);
    try { localStorage.setItem(STORE, JSON.stringify(prev)); } catch { /* ignore */ }
    this.showToast('Undone', false);
    this.clampCursor();
  }

  resetDemo() {
    try { localStorage.removeItem(STORE); } catch { /* ignore */ }
    this.undoStack = [];
    this.selected.set(new Set());
    this.issues.set(SEED);
    this.showToast('Demo data restored', false);
  }

  private showToast(text: string, undoable: boolean) {
    clearTimeout(this.toastTimer);
    this.toast.set({ text, undoable });
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }

  private clampCursor() {
    const max = Math.max(0, this.visible().length - 1);
    if (this.cursor() > max) this.cursor.set(max);
  }

  private haystack(i: Issue) {
    return `#${i.id} ${i.title} ${i.labels.join(' ')} ${this.memberName(i.assignee)}`.toLowerCase();
  }
  private rank(p: Priority) { return PRIORITIES.find((x) => x.id === p)!.rank; }

  member(id: string | null): Member | null { return TEAM.find((m) => m.id === id) ?? null; }
  memberName(id: string | null) { return this.member(id)?.name ?? 'Unassigned'; }
  statusLabel(s: Status) { return STATUSES.find((x) => x.id === s)!.label; }
  priorityLabel(p: Priority) { return PRIORITIES.find((x) => x.id === p)!.label; }
  formatDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  // ---- navigation & selection
  setView(v: View) {
    this.view.set(v);
    this.cursor.set(0);
    this.selected.set(new Set());
  }
  move(delta: number) {
    const n = this.visible().length;
    if (!n) return;
    this.cursor.set(Math.min(n - 1, Math.max(0, this.cursor() + delta)));
    this.scrollToCursor();
  }
  jump(index: number) {
    const n = this.visible().length;
    if (!n) return;
    this.cursor.set(index < 0 ? n - 1 : 0);
    this.scrollToCursor();
  }
  private scrollToCursor() {
    queueMicrotask(() => document.querySelector('.row.cursor')?.scrollIntoView({ block: 'nearest' }));
  }
  toggleSelect(id: number) {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }
  selectAll() {
    const all = this.visible();
    this.selected.set(this.selected().size === all.length ? new Set() : new Set(all.map((i) => i.id)));
  }
  clickRow(index: number, event: MouseEvent) {
    this.cursor.set(index);
    if (event.metaKey || event.ctrlKey) this.toggleSelect(this.visible()[index].id);
  }
  onSearch(value: string) {
    this.query.set(value);
    this.cursor.set(0);
  }

  // ---- mutations
  private change(patch: (i: Issue) => Issue, what: string) {
    const ids = new Set(this.targets().map((t) => t.id));
    if (!ids.size) return;
    const n = ids.size;
    this.commit(this.issues().map((i) => (ids.has(i.id) ? patch(i) : i)), `${what} on ${n === 1 ? '#' + [...ids][0] : n + ' issues'}`);
    this.selected.set(new Set());
  }
  setStatus(s: Status) { this.change((i) => ({ ...i, status: s }), `Status: ${this.statusLabel(s)}`); }
  setPriority(p: Priority) { this.change((i) => ({ ...i, priority: p }), `Priority: ${this.priorityLabel(p)}`); }
  setAssignee(id: string | null) {
    this.change((i) => ({ ...i, assignee: id, status: id && i.status === 'triage' ? 'todo' : i.status }), id ? `Assigned to ${this.memberName(id).split(' ')[0]}` : 'Unassigned');
  }
  toggleLabel(label: string) {
    const all = this.targets().every((t) => t.labels.includes(label));
    this.change((i) => ({ ...i, labels: all ? i.labels.filter((l) => l !== label) : i.labels.includes(label) ? i.labels : [...i.labels, label] }), all ? `Removed "${label}"` : `Labelled "${label}"`);
  }
  archive() { this.change((i) => ({ ...i, archived: true }), 'Archived'); }

  // ---- pickers
  openPicker(kind: PickerKind) {
    if (!this.targets().length) return;
    const options: Option[] =
      kind === 'status' ? STATUSES.map((s) => ({ id: s.id, label: s.label })) :
      kind === 'priority' ? PRIORITIES.map((p) => ({ id: p.id, label: p.label })) :
      kind === 'assignee' ? [{ id: '', label: 'Unassigned' }, ...TEAM.map((m) => ({ id: m.id, label: m.name, hue: m.hue }))] :
      LABELS.map((l) => ({ id: l, label: l }));
    this.picker.set({ kind, options, active: 0 });
  }
  applyPicker(index: number) {
    const p = this.picker();
    if (!p || !p.options[index]) return;
    const id = p.options[index].id;
    this.picker.set(null);
    if (p.kind === 'status') this.setStatus(id as Status);
    else if (p.kind === 'priority') this.setPriority(id as Priority);
    else if (p.kind === 'assignee') this.setAssignee(id || null);
    else this.toggleLabel(id);
  }
  pickerNumber(index: number) { return p0(index, this.picker()?.kind === 'assignee'); }

  // ---- create
  openCreate() {
    this.creating.set(true);
    this.createError.set('');
    queueMicrotask(() => this.titleEl()?.nativeElement.focus());
  }
  submitCreate(title: string, priority: string) {
    const t = title.trim();
    if (!t) {
      this.createError.set('Give the issue a title.');
      return;
    }
    const id = Math.max(0, ...this.issues().map((i) => i.id)) + 1;
    const issue: Issue = { id, title: t, description: '', status: 'triage', priority: priority as Priority, assignee: null, labels: [], created: new Date().toISOString().slice(0, 10), reporter: ME, archived: false };
    this.creating.set(false);
    this.view.set('triage');
    this.query.set('');
    this.commit([issue, ...this.issues()], `Created #${id} in Triage`);
    this.cursor.set(this.visible().findIndex((i) => i.id === id));
  }

  // ---- keyboard
  @HostListener('window:online') onOnline() { this.offline.set(false); }
  @HostListener('window:offline') onOffline() { this.offline.set(true); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const typing = (e.target as HTMLElement)?.matches?.('input, textarea, select');
    if (e.key === 'Escape') return this.escape();
    if (this.loading() || this.loadError()) return;

    if (this.picker()) return this.pickerKey(e);
    if (this.creating() || this.helpOpen()) return;
    if (typing) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { (e.target as HTMLElement).blur(); e.preventDefault(); }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') { e.preventDefault(); this.selectAll(); }
      return;
    }
    const k = e.key;
    const handled = this.run(k, e.shiftKey);
    if (handled) e.preventDefault();
  }

  private run(k: string, shift: boolean): boolean {
    switch (k) {
      case 'j': case 'ArrowDown': this.move(1); return true;
      case 'k': case 'ArrowUp': this.move(-1); return true;
      case 'g': case 'Home': this.jump(0); return true;
      case 'G': case 'End': this.jump(-1); return true;
      case 'J': this.extend(1); return true;
      case 'K': this.extend(-1); return true;
      case 'x': case ' ': if (this.current()) { this.toggleSelect(this.current()!.id); } return true;
      case 's': this.openPicker('status'); return true;
      case 'p': this.openPicker('priority'); return true;
      case 'a': this.openPicker('assignee'); return true;
      case 'l': this.openPicker('label'); return true;
      case 'm': if (this.current()) this.setAssignee(ME); return true;
      case 'd': this.setStatus('done'); return true;
      case 'e': case '#': case 'Delete': case 'Backspace': this.archive(); return true;
      case 'u': case 'z': this.undo(); return true;
      case 'c': this.openCreate(); return true;
      case 'f': this.cycleView(shift ? -1 : 1); return true;
      case '/': this.searchEl()?.nativeElement.focus(); return true;
      case '?': this.helpOpen.set(true); return true;
      case '1': case '2': case '3': case '4': case '5': this.setView(VIEWS[+k - 1].id); return true;
    }
    return false;
  }

  private extend(delta: number) {
    const cur = this.current();
    if (!cur) return;
    const sel = new Set(this.selected());
    sel.add(cur.id);
    this.selected.set(sel);
    this.move(delta);
    const next = this.current();
    if (next) { const s2 = new Set(this.selected()); s2.add(next.id); this.selected.set(s2); }
  }
  private cycleView(dir: number) {
    const i = VIEWS.findIndex((v) => v.id === this.view());
    this.setView(VIEWS[(i + dir + VIEWS.length) % VIEWS.length].id);
  }

  private pickerKey(e: KeyboardEvent) {
    const p = this.picker()!;
    const set = (active: number) => this.picker.set({ ...p, active });
    if (e.key === 'ArrowDown' || e.key === 'j') set(Math.min(p.options.length - 1, p.active + 1));
    else if (e.key === 'ArrowUp' || e.key === 'k') set(Math.max(0, p.active - 1));
    else if (e.key === 'Enter') this.applyPicker(p.active);
    else if (/^[0-9]$/.test(e.key)) {
      const idx = p.kind === 'assignee' ? +e.key : +e.key - 1;
      if (idx >= 0 && idx < p.options.length) this.applyPicker(idx);
    } else return;
    e.preventDefault();
  }

  escape() {
    if (this.picker()) this.picker.set(null);
    else if (this.creating()) this.creating.set(false);
    else if (this.helpOpen()) this.helpOpen.set(false);
    else if (document.activeElement === this.searchEl()?.nativeElement) {
      this.query.set('');
      (document.activeElement as HTMLElement).blur();
    } else if (this.selected().size) this.selected.set(new Set());
    else if (this.query()) this.query.set('');
  }
}

function p0(index: number, zeroBased: boolean) { return zeroBased ? index : index + 1; }
