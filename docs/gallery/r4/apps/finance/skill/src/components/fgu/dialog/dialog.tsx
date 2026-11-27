import { useEffect, useId, useRef, type ReactNode } from "react";
import "./dialog.css";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: "modal" | "confirm";
  actions: ReactNode;
  children?: ReactNode;
};

/** Native <dialog> + showModal(): the platform traps focus, makes the page inert, closes on Escape, and returns focus to the opener. */
export function Dialog({ open, onClose, title, description, variant = "modal", actions, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      data-part="root"
      data-c="dialog"
      data-variant={variant}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onClose={onClose}
      onClick={(e) => { if (variant === "modal" && e.target === ref.current) onClose(); }}
    >
      <h2 data-part="title" data-c="dialog" id={`${id}-t`}>{title}</h2>
      {description ? <p data-part="description" data-c="dialog" id={`${id}-d`}>{description}</p> : null}
      {variant === "modal" ? (
        <button type="button" data-part="close" data-c="dialog" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      ) : null}
      {open ? children : null}
      <div data-part="actions" data-c="dialog">{actions}</div>
    </dialog>
  );
}
