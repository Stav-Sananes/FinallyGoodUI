import { AfterViewInit, Component, ElementRef, HostListener, computed, effect, inject, viewChild } from '@angular/core';
import { ButtonComponent } from '../../components/fgu/button/button.component';
import { DialogComponent } from '../../components/fgu/dialog/dialog.component';
import { FieldComponent } from '../../components/fgu/field/field.component';
import { TabsComponent } from '../../components/fgu/tabs/tabs.component';
import { ToastComponent } from '../../components/fgu/toast/toast.component';
import { ToggleComponent } from '../../components/fgu/toggle/toggle.component';
import { selectTab } from '../../components/fgu/tabs/tabs.behaviour.js';
import { Command, SHORTCUTS, commandForKey } from '../domain/keys';
import { CURRENT_USER_ID, VIEWS, personBySlot } from '../domain/issue';
import { IssueStore } from '../state/issue-store';
import { ToastStore } from '../state/toast-store';
import { signal } from '@angular/core';
import { CaseComponent } from './case.component';
import { LetterComponent } from './letter.component';
import { TrayComponent } from './tray.component';

const TYPING = 'input, textarea, select, [contenteditable="true"]';

@Component({
  selector: 'app-desk',
  imports: [ButtonComponent, CaseComponent, DialogComponent, FieldComponent, LetterComponent, TabsComponent, ToastComponent, ToggleComponent, TrayComponent],
  templateUrl: './desk.component.html',
  styleUrl: './desk.component.css',
})
export class DeskComponent implements AfterViewInit {
  protected readonly store = inject(IssueStore);
  protected readonly toasts = inject(ToastStore);
  private readonly tabsHost = viewChild.required<ElementRef<HTMLElement>>('tabsHost');
  private readonly composeForm = viewChild<ElementRef<HTMLFormElement>>('composeForm');
  private readonly searchHost = viewChild.required<ElementRef<HTMLElement>>('searchHost');

  protected readonly shortcuts = SHORTCUTS;
  protected readonly composeOpen = signal(false);
  protected readonly helpOpen = signal(false);
  protected readonly titleError = signal('');

  protected readonly tabLabels = computed(() => {
    const counts = this.store.counts();
    return VIEWS.map((view) => `${view.label} ${counts[view.id]}`);
  });
  protected readonly viewIndex = computed(() => VIEWS.findIndex((view) => view.id === this.store.view()));
  protected readonly syncedLabel = computed(() => {
    const at = this.store.syncedAt();
    return at ? `Synced ${new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(at)}` : 'Not synced yet';
  });
  protected readonly holderId = computed(() => this.store.cursor()?.assignee ?? null);

  constructor() {
    void this.store.load();
    // Opening the compose dialog: land the caret in the title (the dialog's first focusable is its close button).
    effect(() => {
      if (!this.composeOpen()) return;
      setTimeout(() => document.querySelector<HTMLInputElement>('#compose-title')?.focus());
    });
  }

  ngAfterViewInit(): void {
    // The URL may ask for a tray other than the first; the tabs and the store start in agreement.
    selectTab(this.tabsHost().nativeElement, this.viewIndex());
    const query = this.store.query();
    const search = this.searchHost().nativeElement.querySelector<HTMLInputElement>('input');
    if (search && query) search.value = query;
  }

  /** Tabs own their keys and clicks; the desk learns the choice when focus lands on a tab. */
  protected onTabsFocus(event: Event): void {
    const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    if (!tab) return;
    const index = [...this.tabsHost().nativeElement.querySelectorAll('[role="tab"]')].indexOf(tab);
    if (index !== -1 && VIEWS[index].id !== this.store.view()) this.store.setView(VIEWS[index].id);
  }

  protected onSearch(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  protected onToggleClosed(event: Event): void {
    this.store.toggleClosed((event.target as HTMLInputElement).checked);
  }

  protected openCompose(): void {
    this.titleError.set('');
    this.composeOpen.set(true);
  }

  protected submitCompose(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const title = (form.querySelector<HTMLInputElement>('#compose-title')?.value ?? '').trim();
    const area = (form.querySelector<HTMLInputElement>('#compose-area')?.value ?? '').trim();
    if (!title) {
      this.titleError.set('Give the issue a title so the team can tell it apart.');
      form.querySelector<HTMLInputElement>('#compose-title')?.focus();
      return;
    }
    this.composeOpen.set(false);
    void this.store.create(title, area, CURRENT_USER_ID);
  }

  protected onComposeClosed(): void {
    this.composeOpen.set(false);
    this.titleError.set('');
    this.composeForm()?.nativeElement.reset();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (event.defaultPrevented || event.isComposing) return;
    if (target?.closest(TYPING) || document.querySelector('dialog[open]') || target?.closest('[role="menu"]')) return;
    const command = commandForKey(event);
    if (!command) return;
    // Enter on a button or link is that control's own job.
    if (command.kind === 'open' && target?.closest('button, a')) return;
    event.preventDefault();
    this.run(command);
  }

  private run(command: Command): void {
    const cursor = this.store.cursor();
    switch (command.kind) {
      case 'move': this.store.move(command.delta); this.focusRow(); break;
      case 'view': {
        const next = this.store.stepView(command.delta);
        selectTab(this.tabsHost().nativeElement, VIEWS.findIndex((view) => view.id === next));
        break;
      }
      case 'priority': if (cursor) this.store.setPriority(cursor.id, command.priority); break;
      case 'sort': {
        const member = personBySlot(command.slot);
        if (cursor && member) this.store.assign(cursor.id, member.id);
        break;
      }
      case 'return': if (cursor) this.store.assign(cursor.id, null); break;
      case 'status': if (cursor) this.store.stepStatus(cursor.id); break;
      case 'close': if (cursor) this.store.close(cursor.id); break;
      case 'undo': this.store.undo(); break;
      case 'compose': this.openCompose(); break;
      case 'search': this.searchHost().nativeElement.querySelector<HTMLInputElement>('input')?.focus(); break;
      case 'help': this.helpOpen.set(true); break;
      case 'refresh': void this.store.load(); break;
      case 'open': document.querySelector<HTMLElement>('#letter')?.focus(); break;
    }
  }

  private focusRow(): void {
    const id = this.store.cursorId();
    if (id) queueMicrotask(() => document.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus({ preventScroll: true }));
  }

  protected sortInto(personId: string): void {
    const cursor = this.store.cursor();
    if (cursor) this.store.assign(cursor.id, personId);
  }
}
