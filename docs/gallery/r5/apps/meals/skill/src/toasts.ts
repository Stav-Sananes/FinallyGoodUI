import { reactive } from "vue";

// Shape the scaffolded toast region takes (toast.vue props).
export interface ToastItem { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (toast: { id: string }) => void }

let next = 1;
export const toasts = reactive<ToastItem[]>([]);

export function dismissToast(id: string) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}

export function pushToast(message: string, opts: { undo?: () => void; variant?: "status" | "error" } = {}): string {
  const id = `t${next++}`;
  toasts.push({
    id,
    message,
    variant: opts.variant ?? "status",
    timeout: opts.undo ? 8000 : opts.variant === "error" ? 0 : 5000,
    action: opts.undo ? "Undo" : undefined,
    onAction: opts.undo ? () => { opts.undo!(); dismissToast(id); } : undefined,
  });
  return id;
}
