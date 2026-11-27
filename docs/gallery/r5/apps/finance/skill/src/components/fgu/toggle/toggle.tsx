import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./toggle.css";
import { attach } from "./toggle.behaviour.js";

export type ToggleProps = {
  variant?: string;
  checked?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  value?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"input">, "variant" | "checked" | "disabled" | "invalid" | "name" | "value" | "children">;

export function Toggle({ variant = "checkbox", checked = false, disabled = false, invalid = false, name, value, children, ...rest }: ToggleProps) {
  const ref = useRef<HTMLLabelElement>(null);
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <label data-fgu="toggle" data-part="root" data-variant={variant} ref={ref}>
      <input
        data-part="control"
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        disabled={disabled}
        aria-invalid={invalid ? "true" : undefined}
        role={variant === 'switch' ? 'switch' : undefined}
        {...rest}
      />
      <span data-part="label">{children}</span>
    </label>
  );
}
