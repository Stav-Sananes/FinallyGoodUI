import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./button.css";
import { attach } from "./button.behaviour.js";

export type ButtonProps = {
  variant?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: string;
  children?: ReactNode;
  icon?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "variant" | "disabled" | "loading" | "type" | "children" | "icon">;

export function Button({ variant = "primary", disabled = false, loading = false, type = "button", children, icon, ...rest }: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <button
      data-fgu="button"
      data-part="root"
      type={type as "button" | "submit" | "reset"} // project fix: scaffold types `type` as string
      data-variant={variant}
      disabled={disabled}
      aria-busy={loading ? "true" : undefined}
      ref={ref}
      {...rest}
    >
      <span data-part="spinner" aria-hidden="true"></span>
      {icon ? (
        <span data-part="icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span data-part="label">
        {children}
      </span>
    </button>
  );
}
