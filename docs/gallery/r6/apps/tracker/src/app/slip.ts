import { Component, Input, ViewEncapsulation } from '@angular/core';
import { RecordCardComponent } from '../components/fgu/record-card/record-card.component';
import { Issue, PRIORITY_NAME, STATUS_NAME, issueRef, personOf } from './model';
import { ago } from './util';

/** One issue as a slip of paper: the case number is the lead, torn off at the perforation. */
@Component({
  selector: 'app-slip',
  imports: [RecordCardComponent],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <fgu-record-card [attr.data-hero]="hero ? '' : null" class="slip" [class.slip-hero]="hero">
      <span slot="lead" class="slip-no">
        <span class="slip-key caps">{{ key }}</span>
        <span class="slip-num">{{ issue.num }}</span>
      </span>
      <span class="slip-title">{{ issue.title }}</span>
      <span slot="meta" class="slip-meta">
        <span class="slip-body">{{ issue.body }}</span>
        <span class="slip-facts">
          <span>{{ issue.area }}</span>
          <span>{{ issue.reporter }}, {{ when }}</span>
          <span>{{ issue.reports }} {{ issue.reports === 1 ? 'report' : 'reports' }}</span>
          @if (owner) { <span>With {{ owner.name }}</span> }
        </span>
      </span>
      <span slot="status" class="slip-status">
        <span class="chip" [attr.data-p]="issue.priority">P{{ issue.priority }} {{ priorityName }}</span>
        <span class="slip-state caps">{{ statusName }}</span>
      </span>
      <span slot="action" class="slip-actions"><ng-content /></span>
    </fgu-record-card>
  `,
})
export class SlipComponent {
  @Input({ required: true }) issue!: Issue;
  @Input() hero = false;
  get key() { return 'HRB'; }
  get ref() { return issueRef(this.issue); }
  get when() { return ago(this.issue.createdAt); }
  get owner() { return personOf(this.issue.owner); }
  get priorityName() { return PRIORITY_NAME[this.issue.priority]; }
  get statusName() { return this.issue.closed ? 'Closed' : STATUS_NAME[this.issue.status]; }
}
