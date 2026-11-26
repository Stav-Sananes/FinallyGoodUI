import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./toast.css";
import { attach } from "./toast.behaviour.js";

export type ToastProps = {
  toasts?: { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (toast: { id: string }) => void }[];
  label?: string;
  children?: ReactNode;
  /** Called with the toast id when one leaves: remove it from `toasts`. */
  onDismiss?: (id: string) => void;
} & Omit<ComponentPropsWithoutRef<"div">, "toasts" | "label" | "children" | "onDismiss">;

export function Toast({ toasts = [], label = "Notifications", children, onDismiss, ...rest }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  // A leaving toast fires a cancelable `dismiss`; the component keeps the node and hands the id to you, so React stays the owner of the list.
  useEffect(() => {
    const region = ref.current;
    if (!region) return;
    const handle = (event: Event) => {
      event.preventDefault();
      onDismiss?.((event.target as HTMLElement).dataset.id ?? "");
    };
    region.addEventListener("dismiss", handle);
    return () => region.removeEventListener("dismiss", handle);
  }, [onDismiss]);
  return (
    <div data-fgu="toast" data-part="root" role="status" aria-label={label} ref={ref} {...rest}>
      {toasts.map((t) => (
        <div
          key={t.id}
          data-part="toast"
          data-variant={t.variant ? t.variant : 'status'}
          data-id={t.id}
          data-timeout={t.timeout}
        >
          <p data-part="message">
            {t.message}
          </p>
          {t.action ? (
            <button data-part="action" type="button" onClick={() => t.onAction && t.onAction(t)}>
              {t.action}
            </button>
          ) : null}
          <button data-part="dismiss" type="button" aria-label="Dismiss">
            &times;
          </button>
        </div>
      ))}
      {children}
    </div>
  );
}
