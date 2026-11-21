import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  readonly id: number;
  readonly text: string;
  readonly variant: 'status' | 'error';
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly timeoutMs?: number;
}

const ACTION_TOAST_MS = 10_000; // an Undo toast stays long enough to be read and reached: reading time, not motion

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private nextId = 1;
  readonly toasts = signal<readonly ToastMessage[]>([]);

  show(text: string, action?: { label: string; run: () => void }): void {
    this.push({ text, variant: 'status', actionLabel: action?.label, onAction: action?.run, timeoutMs: action ? ACTION_TOAST_MS : undefined });
  }

  showError(text: string, action?: { label: string; run: () => void }): void {
    this.push({ text, variant: 'error', actionLabel: action?.label, onAction: action?.run });
  }

  runAction(id: number): void {
    this.toasts().find((toast) => toast.id === id)?.onAction?.();
    this.remove(id);
  }

  remove(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(message: Omit<ToastMessage, 'id'>): void {
    this.toasts.update((list) => [...list.slice(-2), { ...message, id: this.nextId++ }]);
  }
}
