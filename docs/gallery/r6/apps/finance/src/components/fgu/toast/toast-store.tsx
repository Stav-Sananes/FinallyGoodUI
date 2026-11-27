// Where the toast list lives. The component keeps the node and hands you the id (onDismiss / dismiss / ondismiss / dismissed): remove it here.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Toast } from "./toast";

export type ToastItem = { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void };
export type ToastInput = Omit<ToastItem, "id">;

type ToastApi = { toasts: ToastItem[]; push: (toast: ToastInput) => string; dismiss: (id: string) => void };
const ToastContext = createContext<ToastApi | null>(null);
let counter = 0;

/** Put it once near the root: it renders the live region and owns the list. */
export function ToastProvider({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback((toast: ToastInput) => {
    const id = `toast-${++counter}`;
    setToasts((all) => [...all, { ...toast, id }]);
    return id;
  }, []);
  const api = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** const { push } = useToast(); push({ message: "Saved" }) */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a <ToastProvider> above it");
  return api;
}
