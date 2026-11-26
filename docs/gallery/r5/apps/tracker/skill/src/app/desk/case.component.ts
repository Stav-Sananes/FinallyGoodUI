import { Component, computed, input, output } from '@angular/core';
import { Issue, Load, TEAM, loadOf } from '../domain/issue';

/** The pigeonhole case: one cell per teammate, keyed 1-6. */
@Component({
  selector: 'app-case',
  templateUrl: './case.component.html',
  styleUrl: './case.component.css',
})
export class CaseComponent {
  readonly issues = input.required<readonly Issue[]>();
  readonly holderId = input<string | null>(null);
  readonly canSort = input(false);
  readonly sorted = output<string>();

  protected readonly cells = computed(() => TEAM.map((member) => ({ member, load: loadOf(this.issues(), member.id) as Load })));
}
