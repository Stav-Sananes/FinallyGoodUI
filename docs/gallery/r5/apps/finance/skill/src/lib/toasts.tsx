import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast } from "../components/fgu/toast/toast";

type Push = { message: string; variant?: "status" | "error"; action?: { label: string; onAction: () => void } };
type Item = { id: string; message: string; variant?: "status" | "error"; action?: string; onAction?: () => void };

const ToastContext = createContext<(t: Push) => void>(() => undefined);
let seq = 0;

/** Owns the list of toasts; the scaffolded Toast region renders and auto-dismisses them. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((t: Push) => {
    const id = `t${++seq}`;
    setItems((cur) => [...cur.slice(-2), { id, message: t.message, variant: t.variant, action: t.action?.label, onAction: t.action ? () => t.action!.onAction() : undefined }]);
  }, []);
  const drop = useCallback((id: string) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const toasts = useMemo(
    () => items.map((i) => ({ ...i, onAction: i.onAction ? () => { i.onAction!(); drop(i.id); } : undefined })),
    [items, drop],
  );
  return (
    <ToastContext.Provider value={push}>
      {children}
      <Toast toasts={toasts} onDismiss={drop} label="Notifications" />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
