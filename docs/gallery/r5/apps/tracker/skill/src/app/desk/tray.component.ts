import { Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../components/fgu/button/button.component';
import { Phase } from '../state/issue-store';
import { Issue, STATUS_LABEL, ViewId, person, personName, shortDate } from '../domain/issue';
import { PostmarkComponent } from './postmark.component';

@Component({
  selector: 'app-tray',
  imports: [ButtonComponent, PostmarkComponent],
  templateUrl: './tray.component.html',
  styleUrl: './tray.component.css',
})
export class TrayComponent {
  readonly phase = input.required<Phase>();
  readonly issues = input.required<readonly Issue[]>();
  readonly total = input.required<number>();
  readonly view = input.required<ViewId>();
  readonly query = input('');
  readonly cursorId = input<string | null>(null);
  readonly cleared = input(false);

  readonly picked = output<string>();
  readonly retry = output<void>();
  readonly compose = output<void>();

  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6];
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly date = shortDate;
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Keep the lit letter in view as j/k move it.
    effect(() => {
      const id = this.cursorId();
      this.issues();
      if (!id) return;
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest' }));
    });
  }

  protected initials(id: string | null): string {
    return person(id)?.initials ?? '';
  }

  protected holder(id: string | null): string {
    return personName(id);
  }
}
