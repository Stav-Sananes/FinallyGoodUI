import { Injectable, inject } from '@angular/core';
import { ToastInput, ToastStore } from '../components/fgu/toast/toast-store.service';

const MAX_VISIBLE = 2;

/** Toasts at keyboard speed pile up; keep the two newest so the case stays visible. */
@Injectable({ providedIn: 'root' })
export class Notify {
  private readonly toasts = inject(ToastStore);

  say(toast: ToastInput): string {
    const all = this.toasts.toasts();
    all.slice(0, Math.max(0, all.length - (MAX_VISIBLE - 1))).forEach((t) => this.toasts.dismiss(t.id));
    return this.toasts.push(toast);
  }

  dismiss(id: string): void {
    this.toasts.dismiss(id);
  }
}
