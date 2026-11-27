// Where the toast list lives. The component keeps the node and hands you the id (onDismiss / dismiss / ondismiss / dismissed): remove it here.
import { Injectable, signal } from "@angular/core";

export type ToastItem = { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void };
export type ToastInput = Omit<ToastItem, "id">;

// <fgu-toast [toasts]="store.toasts()" (dismissed)="store.dismiss($event)" /> once, near the root; inject(ToastStore).push(...) anywhere.
@Injectable({ providedIn: "root" })
export class ToastStore {
  readonly toasts = signal<ToastItem[]>([]);
  private counter = 0;

  push(toast: ToastInput): string {
    const id = `toast-${++this.counter}`;
    this.toasts.update((all) => [...all, { ...toast, id }]);
    return id;
  }

  dismiss(id: string) {
    this.toasts.update((all) => all.filter((t) => t.id !== id));
  }
}
