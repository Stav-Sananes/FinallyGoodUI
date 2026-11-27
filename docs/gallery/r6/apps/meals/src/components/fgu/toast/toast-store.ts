// Where the toast list lives. The component keeps the node and hands you the id (onDismiss / dismiss / ondismiss / dismissed): remove it here.
import { reactive } from "vue";

export type ToastItem = { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void };
export type ToastInput = Omit<ToastItem, "id">;

// One list for the app: <Toast :toasts="toasts" @dismiss="dismiss" /> once, near the root; useToast() anywhere.
const toasts = reactive<ToastItem[]>([]);
let counter = 0;

export function useToast() {
  function push(toast: ToastInput): string {
    const id = `toast-${++counter}`;
    toasts.push({ ...toast, id });
    return id;
  }
  function dismiss(id: string) {
    const at = toasts.findIndex((t) => t.id === id);
    if (at >= 0) toasts.splice(at, 1);
  }
  return { toasts, push, dismiss };
}
