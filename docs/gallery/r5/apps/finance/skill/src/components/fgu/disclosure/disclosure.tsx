import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./disclosure.css";
import { attach } from "./disclosure.behaviour.js";

export type DisclosureProps = {
  variant?: string;
  open?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  trigger?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "variant" | "open" | "disabled" | "children" | "trigger">;

export function Disclosure({ variant = "multiple", open = false, disabled = false, children, trigger, ...rest }: DisclosureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <div data-fgu="disclosure" data-part="root" data-variant={variant} ref={ref} {...rest}>
      <div data-part="item">
        <h3 data-part="heading">
          <button
            data-part="trigger"
            type="button"
            id={uid + '-trigger'}
            aria-expanded={open ? "true" : "false"}
            aria-controls={uid + '-panel'}
            disabled={disabled}
          >
            <span>{trigger}</span>
            <span data-part="indicator" aria-hidden="true"></span>
          </button>
        </h3>
        <div data-part="panel" id={uid + '-panel'} role="region" aria-labelledby={uid + '-trigger'}>
          <div data-part="content">{children}</div>
        </div>
      </div>
    </div>
  );
}
