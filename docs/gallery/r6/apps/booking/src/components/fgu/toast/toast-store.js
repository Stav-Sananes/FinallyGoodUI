// Where the toast list lives. The component keeps the node and hands you the id (onDismiss / dismiss / ondismiss / dismissed): remove it here.
import { writable } from "svelte/store";

// <Toast toasts={$toasts} ondismiss={dismissToast} /> once, near the root; pushToast() anywhere.
export const toasts = writable([]);
let counter = 0;

export function pushToast(toast) {
  const id = `toast-${++counter}`;
  toasts.update((all) => [...all, { ...toast, id }]);
  return id;
}

export function dismissToast(id) {
  toasts.update((all) => all.filter((t) => t.id !== id));
}
