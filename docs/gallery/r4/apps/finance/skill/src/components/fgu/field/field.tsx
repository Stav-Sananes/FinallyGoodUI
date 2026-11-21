import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import "./field.css";

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  variant?: "stacked";
  /** The control: pass an <input>/<select> props object instead for the default text input. */
  control?: ComponentPropsWithoutRef<"input"> & { as?: "input" | "select"; children?: ReactNode };
};

/** Label above, hint, native control, error in a polite live region. The error line is always in the box, so nothing shifts. */
export function Field({ label, hint, error, variant = "stacked", control = {} }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const { as = "input", children, ...rest } = control;
  const invalid = error ? ("true" as const) : undefined;
  const describedBy = [hint ? hintId : "", errId].filter(Boolean).join(" ");
  return (
    <div data-part="root" data-c="field" data-variant={variant}>
      <label data-part="label" data-c="field" htmlFor={id}>{label}</label>
      {hint ? <p data-part="hint" data-c="field" id={hintId}>{hint}</p> : null}
      {as === "select" ? (
        <select {...(rest as ComponentPropsWithoutRef<"select">)} data-part="control" data-c="field" id={id} aria-invalid={invalid} aria-describedby={describedBy}>{children}</select>
      ) : (
        <input type="text" {...rest} data-part="control" data-c="field" id={id} aria-invalid={invalid} aria-describedby={describedBy} />
      )}
      <p data-part="error" data-c="field" id={errId} aria-live="polite">{error ?? ""}</p>
    </div>
  );
}
