import { Component, computed, input } from '@angular/core';
import { PRIORITY_LABEL, PRIORITY_MARK, Priority } from '../domain/issue';

/** The priority stamp: a round cancellation ring with one letter. Never colour alone. */
@Component({
  selector: 'app-postmark',
  template: `<span class="mark" [attr.data-priority]="priority()" [attr.data-size]="size()" role="img" [attr.aria-label]="label()">{{ mark() }}</span>`,
  styleUrl: './postmark.component.css',
})
export class PostmarkComponent {
  readonly priority = input.required<Priority>();
  readonly size = input<'sm' | 'lg'>('sm');
  readonly mark = computed(() => PRIORITY_MARK[this.priority()]);
  readonly label = computed(() => `Priority: ${PRIORITY_LABEL[this.priority()]}`);
}
