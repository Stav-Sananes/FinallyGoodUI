import type { ComponentPropsWithoutRef, ReactNode } from "react";
import "./toggle.css";

export type ToggleProps = {
  variant?: "checkbox" | "switch";
  invalid?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"input">, "type" | "children">;

/** A native checkbox, or a switch (role="switch") when variant="switch". All of its state is native. */
export function Toggle({ variant = "checkbox", invalid = false, children, ...rest }: ToggleProps) {
  return (
    <label data-part="root" data-c="toggle" data-variant={variant}>
      <input {...rest} type="checkbox" role={variant === "switch" ? "switch" : undefined} aria-invalid={invalid ? "true" : undefined} data-part="control" data-c="toggle" />
      <span data-part="label" data-c="toggle">{children}</span>
    </label>
  );
}
