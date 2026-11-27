import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef, useId } from "react";
import "./field.css";
import { attach } from "./field.behaviour.js";

export type FieldProps = {
  variant?: string;
  label?: string;
  hint?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: AutoFill;
  rows?: number;
  multiline?: boolean;
  hideLabel?: boolean;
} & Omit<ComponentPropsWithoutRef<"input">, "variant" | "label" | "hint" | "error" | "invalid" | "disabled" | "required" | "type" | "name" | "id" | "placeholder" | "autocomplete" | "rows" | "multiline" | "hideLabel" | "children">;

export function Field({ variant = "stacked", label, hint, error, invalid = false, disabled = false, required = false, type = "text", name, id, placeholder, autocomplete, rows, multiline = false, hideLabel = false, ...rest }: FieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <div data-fgu="field" data-part="root" data-variant={variant} ref={ref}>
      <label data-part="label" htmlFor={(id ? id : uid + '-control')} data-hidden={hideLabel ? '' : undefined}>{label}</label>
      {hint ? (
        <p data-part="hint" id={uid + '-hint'}>{hint}</p>
      ) : null}
      {multiline ? (
        <textarea
          data-part="control"
          id={(id ? id : uid + '-control')}
          name={name}
          placeholder={placeholder}
          autoComplete={autocomplete}
          required={required}
          disabled={disabled}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={(hint ? uid + '-hint ' : '') + uid + '-error'}
          rows={rows}
          {...(rest as object)}
        ></textarea>
      ) : (
        <input
          data-part="control"
          id={(id ? id : uid + '-control')}
          name={name}
          placeholder={placeholder}
          autoComplete={autocomplete}
          required={required}
          disabled={disabled}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={(hint ? uid + '-hint ' : '') + uid + '-error'}
          type={type}
          {...rest}
        />
      )}
      <p data-part="error" id={uid + '-error'} aria-live="polite" data-controlled={error ? '' : undefined}>{error}</p>
    </div>
  );
}
