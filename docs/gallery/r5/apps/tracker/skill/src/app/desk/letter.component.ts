import { Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../../components/fgu/button/button.component';
import { DisclosureComponent } from '../../components/fgu/disclosure/disclosure.component';
import { MenuComponent } from '../../components/fgu/menu/menu.component';
import { Issue, PRIORITIES, PRIORITY_LABEL, Priority, STATUS_LABEL, TEAM, person, personName, shortDate } from '../domain/issue';
import { PostmarkComponent } from './postmark.component';

@Component({
  selector: 'app-letter',
  imports: [ButtonComponent, DisclosureComponent, MenuComponent, PostmarkComponent],
  templateUrl: './letter.component.html',
  styleUrl: './letter.component.css',
})
export class LetterComponent {
  readonly issue = input<Issue | null>(null);
  readonly stamped = output<{ id: string; priority: Priority }>();
  readonly handed = output<{ id: string; assignee: string | null }>();
  readonly stepped = output<string>();
  readonly closed = output<string>();

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly date = shortDate;
  protected readonly holder = (id: string | null) => personName(id);
  protected readonly holderInitials = (id: string | null) => person(id)?.initials ?? '';

  protected readonly priorityItems = computed(() => {
    const issue = this.issue();
    return PRIORITIES.map((priority) => ({
      label: PRIORITY_LABEL[priority],
      disabled: issue?.priority === priority,
      onSelect: () => issue && this.stamped.emit({ id: issue.id, priority }),
    }));
  });

  protected readonly holderItems = computed(() => {
    const issue = this.issue();
    return [
      ...TEAM.map((member) => ({
        label: `${member.name} (${member.slot})`,
        disabled: issue?.assignee === member.id,
        onSelect: () => issue && this.handed.emit({ id: issue.id, assignee: member.id }),
      })),
      { label: 'Back to intake (0)', disabled: issue?.assignee === null, onSelect: () => issue && this.handed.emit({ id: issue.id, assignee: null }) },
    ];
  });
}
