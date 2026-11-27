import { Component, ElementRef, HostListener, Injector, ViewChild, ViewChildren, QueryList, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonComponent } from '../../components/fgu/button/button.component';
import { DialogComponent } from '../../components/fgu/dialog/dialog.component';
import { FieldComponent } from '../../components/fgu/field/field.component';
import { MenuComponent, MenuItem } from '../../components/fgu/menu/menu.component';
import { TabItem, TabsComponent } from '../../components/fgu/tabs/tabs.component';
import { CURRENT_USER_ID, Issue, PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, TEAM, ViewId, nextStatus, personInitials, personName } from '../domain/issue';
import { Command, SHORTCUTS, commandForKey } from '../domain/keys';
import { IssueStore } from '../state/issue-store';

const UNASSIGNED = 'unassigned';
const VIEWS: readonly ViewId[] = ['untriaged', 'mine', 'all'];
const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [DatePipe, ButtonComponent, DialogComponent, FieldComponent, MenuComponent, TabsComponent],
  templateUrl: './triage.component.html',
  styleUrl: './triage.component.css',
})
export class TriageComponent {
  protected readonly store = inject(IssueStore);
  private readonly injector = inject(Injector);

  protected readonly shortcuts = SHORTCUTS;
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabel = PRIORITY_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly initialsOf = personInitials;
  protected readonly nameOf = personName;
  protected readonly menuItems: readonly MenuItem[] = [
    ...TEAM.map((person) => ({ id: person.id, label: person.name, mark: person.initials })),
    { id: UNASSIGNED, label: 'Unassigned', mark: '--' },
  ];

  protected readonly cursorId = signal<string | null>(null);
  protected readonly openedId = signal<string | null>(null);
  protected readonly draftTitle = signal('');
  protected readonly draftArea = signal('');
  protected readonly renameDraft = signal('');

  protected readonly tabs = computed<readonly TabItem[]>(() => [
    { id: 'untriaged', label: 'Untriaged', count: this.store.untriagedCount() },
    { id: 'mine', label: 'Mine', count: this.store.mineCount() },
    { id: 'all', label: 'All', count: this.store.allCount() },
  ]);
  protected readonly opened = computed(() => this.store.find(this.openedId()));
  protected readonly cursorIndex = computed(() => this.store.visible().findIndex((issue) => issue.id === this.cursorId()));
  protected readonly syncLabel = computed(() => {
    if (this.store.saveFailed() || this.store.phase() === 'error') return 'Offline: not saved';
    const at = this.store.syncedAt();
    return at ? `Synced ${at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing';
  });

  @ViewChildren(MenuComponent) private menus!: QueryList<MenuComponent>;
  @ViewChild('search') private search!: FieldComponent;
  @ViewChild('newTitle') private newTitle!: FieldComponent;
  @ViewChild('newDialog') private newDialog!: DialogComponent;
  @ViewChild('issueDialog') private issueDialog!: DialogComponent;
  @ViewChild('newOpener', { read: ElementRef }) private newOpener!: ElementRef<HTMLElement>;
  @ViewChild('helpOpener', { read: ElementRef }) private helpOpener!: ElementRef<HTMLElement>;

  constructor() {
    this.readUrl();
    effect(() => this.writeUrl(this.store.view(), this.store.query()));
    effect(() => this.keepCursorOnAStrip());
    void this.store.load();
  }

  // ---- keyboard ----

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.isTyping(event.target) || this.isInsideOverlay(event.target)) return;
    const command = commandForKey(event);
    if (!command) return;
    event.preventDefault();
    this.run(command);
  }

  private run(command: Command): void {
    switch (command.kind) {
      case 'move': return this.moveCursor(command.delta);
      case 'priority': return this.onCursor((issue) => this.store.setPriority(issue.id, command.priority));
      case 'assign': return this.openAssignMenu();
      case 'status': return this.onCursor((issue) => this.store.setStatus(issue.id, nextStatus(issue.status)));
      case 'close': return this.onCursor((issue) => this.store.setStatus(issue.id, 'closed'));
      case 'undo': return this.store.undo();
      case 'new': return this.newOpener.nativeElement.querySelector('button')?.click();
      case 'search': return this.search.focus();
      case 'help': return this.helpOpener.nativeElement.querySelector('button')?.click();
      case 'refresh': return this.refresh();
    }
  }

  private isTyping(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable]');
  }

  private isInsideOverlay(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('dialog[open], [role="menu"]') !== null;
  }

  // ---- cursor ----

  private moveCursor(delta: 1 | -1): void {
    const list = this.store.visible();
    if (!list.length) return;
    const next = Math.min(list.length - 1, Math.max(0, this.cursorIndex() + delta));
    this.setCursor(list[next].id);
  }

  protected setCursor(id: string, focus = true): void {
    this.cursorId.set(id);
    if (focus) this.focusCursor();
  }

  private focusCursor(): void {
    afterNextRender(() => document.querySelector<HTMLElement>('[data-cursor="true"] .open-issue')?.focus(), { injector: this.injector });
  }

  private keepCursorOnAStrip(): void {
    const list = this.store.visible();
    if (list.some((issue) => issue.id === this.cursorId())) return;
    this.cursorId.set(list[0]?.id ?? null);
  }

  /** Runs a change on the strip under the cursor, then lands the cursor on the next strip if that one left the view. */
  private onCursor(change: (issue: Issue) => void): void {
    const index = this.cursorIndex();
    const issue = this.store.visible()[index];
    if (!issue) return;
    change(issue);
    this.settleCursorAfter(issue.id, index);
  }

  private settleCursorAfter(id: string, index: number): void {
    const list = this.store.visible();
    if (list.some((issue) => issue.id === id)) return;
    this.cursorId.set(list[Math.min(index, list.length - 1)]?.id ?? null);
    this.focusCursor();
  }

  private openAssignMenu(): void {
    this.menus.get(this.cursorIndex())?.open();
  }

  // ---- list events ----

  protected pickAssignee(issue: Issue, choice: string): void {
    const index = this.store.visible().findIndex((row) => row.id === issue.id);
    this.store.assign(issue.id, choice === UNASSIGNED ? null : choice);
    this.settleCursorAfter(issue.id, index);
  }

  protected onTabChange(id: string): void {
    this.store.view.set(id as ViewId);
  }

  protected openIssue(issue: Issue): void {
    this.cursorId.set(issue.id);
    this.openedId.set(issue.id);
    this.renameDraft.set(issue.title);
  }

  protected setPriorityInDialog(issue: Issue, priority: Issue['priority']): void {
    this.store.setPriority(issue.id, priority);
  }

  protected saveRename(issue: Issue): void {
    const title = this.renameDraft().trim();
    if (title.length < 8 || title === issue.title) return;
    this.store.rename(issue.id, title);
    this.issueDialog.close();
  }

  protected closeFromDialog(issue: Issue): void {
    this.store.setStatus(issue.id, 'closed');
    this.issueDialog.close();
  }

  protected refresh(): void {
    void this.store.load();
  }

  protected clearSearch(): void {
    this.store.query.set('');
  }

  protected showAll(): void {
    this.store.view.set('all');
    this.store.query.set('');
  }

  // ---- new issue ----

  protected async submitNew(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.newTitle.validate()) return;
    this.newDialog.close();
    await this.store.create(this.draftTitle().trim(), this.draftArea().trim(), personName(CURRENT_USER_ID));
    this.draftTitle.set('');
    this.draftArea.set('');
  }

  // ---- url state ----

  private readUrl(): void {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (VIEWS.includes(view as ViewId)) this.store.view.set(view as ViewId);
    this.store.query.set(params.get('q') ?? '');
  }

  private writeUrl(view: ViewId, query: string): void {
    const params = new URLSearchParams(location.search);
    view === 'untriaged' ? params.delete('view') : params.set('view', view);
    query ? params.set('q', query) : params.delete('q');
    const search = params.toString();
    history.replaceState(null, '', `${location.pathname}${search ? `?${search}` : ''}`);
  }
}
