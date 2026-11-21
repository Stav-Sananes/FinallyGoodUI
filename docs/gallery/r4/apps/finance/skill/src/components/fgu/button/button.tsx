import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import "./button.css";

export type ButtonProps = {
  variant?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  children?: ReactNode;
  icon?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "variant" | "disabled" | "loading" | "type" | "children">;

export function Button({ variant = "primary", disabled = false, loading = false, type = "button", children, icon, ...rest }: ButtonProps) {
  return (
    <button data-part="root" data-c="button" data-variant={variant} disabled={disabled} aria-busy={loading ? "true" : undefined} type={type} onClickCapture={(e: MouseEvent<HTMLButtonElement>) => { if (loading) { e.preventDefault(); e.stopPropagation(); } }} {...rest}>
      {icon ? <span data-part="icon" data-c="button" aria-hidden="true">{icon}</span> : null}
      <span data-part="label" data-c="button">{children}</span>
      <span data-part="spinner" data-c="button" aria-hidden="true"></span>
    </button>
  );
}
