import type { ComponentPropsWithoutRef } from "react"; // project fix: ReactNode was unused
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
  autocomplete?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "variant" | "label" | "hint" | "error" | "invalid" | "disabled" | "required" | "type" | "name" | "id" | "placeholder" | "autocomplete" | "children">;

export function Field({ variant = "stacked", label, hint, error, invalid = false, disabled = false, required = false, type = "text", name, id, placeholder, autocomplete, ...rest }: FieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <div data-fgu="field" data-part="root" data-variant={variant} ref={ref}>
      <label data-part="label" htmlFor={(id ? id : uid + '-control')}>
        {label}
      </label>
      {hint ? (
        <p data-part="hint" id={uid + '-hint'}>
          {hint}
        </p>
      ) : null}
      <input
        data-part="control"
        id={(id ? id : uid + '-control')}
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autocomplete}
        required={required}
        disabled={disabled}
        aria-invalid={invalid ? "true" : undefined}
        aria-describedby={(hint ? uid + '-hint ' : '') + uid + '-error'}
        {...rest}
      />
      <p data-part="error" id={uid + '-error'} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
