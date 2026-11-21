import { reactive } from "vue";
import type { ToastItem } from "./components/fgu/types";

let next = 1;
export const toasts = reactive<ToastItem[]>([]);
const undoers = new Map<number, () => void>();

export function pushToast(message: string, opts: { undo?: () => void; variant?: "info" | "error" } = {}): number {
  const id = next++;
  toasts.push({ id, message, variant: opts.variant, actionLabel: opts.undo ? "Undo" : undefined, timeout: opts.undo ? 8000 : opts.variant === "error" ? 0 : 5000 });
  if (opts.undo) undoers.set(id, opts.undo);
  return id;
}
export function dismissToast(id: number) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
  undoers.delete(id);
}
export function runToastAction(id: number) {
  undoers.get(id)?.();
  dismissToast(id);
}
