import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  message: string;
  variant: 'status' | 'error';
  timeout?: number;
  action?: string;
  onAction?: () => void;
}

const UNDO_TOAST_MS = 8000; // an Undo toast must stay long enough to be read and reached: reading time, not motion

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private nextId = 1;
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, action?: { label: string; run: () => void }): void {
    this.push({ message, variant: 'status', timeout: action ? UNDO_TOAST_MS : undefined, action: action?.label, onAction: action && (() => this.runAndClose(action.run)) });
  }

  showError(message: string, action?: { label: string; run: () => void }): void {
    this.push({ message, variant: 'error', action: action?.label, onAction: action && (() => this.runAndClose(action.run)) });
  }

  remove(id: string): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private runAndClose(run: () => void): void {
    this.toasts.set([]);
    run();
  }

  private push(item: Omit<ToastItem, 'id'>): void {
    this.toasts.update((list) => [...list.slice(-2), { ...item, id: String(this.nextId++) }]);
  }
}
