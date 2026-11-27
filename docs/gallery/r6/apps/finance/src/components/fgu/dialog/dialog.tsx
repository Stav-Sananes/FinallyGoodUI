import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./dialog.css";
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";

export type DialogProps = {
  variant?: string;
  open?: boolean;
  initialFocus?: string;
  nativeValidation?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onOpenChange?: (value: boolean) => void;
} & Omit<ComponentPropsWithoutRef<"dialog">, "variant" | "open" | "initialFocus" | "nativeValidation" | "title" | "description" | "children" | "actions" | "onOpenChange">;

export function Dialog({ variant = "modal", open = false, initialFocus, nativeValidation = false, title, description, children, actions, onOpenChange, ...rest }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) openDialog(dialog); else closeDialog(dialog);
  }, [open]);
  // close: handed to onOpenChange.
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const handle = () => {
      onOpenChange?.(false);
    };
    target.addEventListener("close", handle);
    return () => target.removeEventListener("close", handle);
  }, [onOpenChange]);
  return (
    <dialog
      data-fgu="dialog"
      data-part="root"
      data-variant={variant}
      aria-labelledby={uid + '-title'}
      data-initial-focus={initialFocus}
      ref={ref}
      {...rest}
    >
      <h2 data-part="title" id={uid + '-title'}>{title}</h2>
      {description ? (
        <p data-part="description">{description}</p>
      ) : null}
      <button data-part="close" type="button" aria-label="Close">&times;</button>
      <form data-part="form" method="dialog" noValidate={!nativeValidation}>
        {children}
        {actions ? (
          <div data-part="actions">{actions}</div>
        ) : null}
      </form>
    </dialog>
  );
}
