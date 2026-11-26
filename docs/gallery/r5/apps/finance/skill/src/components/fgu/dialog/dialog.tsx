import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./dialog.css";
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";

export type DialogProps = {
  variant?: string;
  open?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"dialog">, "variant" | "open" | "title" | "description" | "children" | "actions">;

export function Dialog({ variant = "modal", open = false, title, description, children, actions, ...rest }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) openDialog(dialog); else closeDialog(dialog);
  }, [open]);
  return (
    <dialog
      data-fgu="dialog"
      data-part="root"
      data-variant={variant}
      aria-labelledby={uid + '-title'}
      ref={ref}
      {...rest}
    >
      <h2 data-part="title" id={uid + '-title'}>
        {title}
      </h2>
      {description ? (
        <p data-part="description">
          {description}
        </p>
      ) : null}
      <button data-part="close" type="button" aria-label="Close">
        &times;
      </button>
      {children}
      {actions ? (
        <div data-part="actions">
          {actions}
        </div>
      ) : null}
    </dialog>
  );
}
