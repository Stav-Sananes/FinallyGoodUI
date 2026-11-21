import { Component, inject } from '@angular/core';
import { ToastComponent } from '../components/fgu/toast/toast.component';
import { TriageComponent } from './triage/triage.component';
import { ToastStore } from './state/toast-store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TriageComponent, ToastComponent],
  template: `
    <a class="skip-link" href="#main">Skip to the rack</a>
    <div class="app" data-fgu-scope>
      <app-triage />
      <fgu-toast [toasts]="toasts.toasts()" (actionPressed)="toasts.runAction($event)" (dismissed)="toasts.remove($event)" />
    </div>
  `,
})
export class App {
  protected readonly toasts = inject(ToastStore);
}
