import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import "./toast.css";

type ToastInput = { message: string; action?: { label: string; onAction: () => void }; variant?: "status" | "error"; ms?: number };
type ToastItem = ToastInput & { id: number; leaving: boolean };

const ToastContext = createContext<(t: ToastInput) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

const LEAVE_MS = 150; // matches --duration-short in the leave transition
const DEFAULT_MS = 7000;

function ToastView({ t, onDone }: { t: ToastItem; onDone: (id: number) => void }) {
  const paused = useRef(false);
  const left = useRef(t.ms ?? DEFAULT_MS);
  useEffect(() => {
    let last = Date.now();
    const tick = window.setInterval(() => {
      const now = Date.now();
      if (!paused.current) left.current -= now - last;
      last = now;
      if (left.current <= 0) onDone(t.id);
    }, 200);
    return () => window.clearInterval(tick);
  }, [t.id, onDone]);
  const pause = (p: boolean) => () => { paused.current = p; };
  return (
    <div data-part="toast" data-c="toast" data-variant={t.variant ?? "status"} data-leaving={t.leaving ? "" : undefined} onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      <p data-part="message" data-c="toast">{t.message}</p>
      {t.action ? <button type="button" data-part="action" data-c="toast" onClick={() => { t.action?.onAction(); onDone(t.id); }}>{t.action.label}</button> : null}
      <button type="button" data-part="dismiss" data-c="toast" aria-label="Dismiss" onClick={() => onDone(t.id)}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}

/** An always-present role="status" region; toasts never take focus and pause their timer on hover and focus. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), LEAVE_MS);
  }, []);
  const push = useCallback((t: ToastInput) => {
    seq.current += 1;
    setItems((xs) => [...xs.slice(-2), { ...t, id: seq.current, leaving: false }]);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div data-part="root" data-c="toast" role="status" aria-label="Notifications">
        {items.map((t) => <ToastView key={t.id} t={t} onDone={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
