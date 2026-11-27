import { useId, useState, type ReactNode } from "react";
import "./disclosure.css";

export type DisclosureProps = {
  heading: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** One item of the disclosure spec: button with aria-expanded, closed content inert so it leaves the tab order. */
export function Disclosure({ heading, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div data-part="root" data-c="disclosure" data-variant="single">
      <div data-part="item" data-c="disclosure">
        <h3 data-part="heading" data-c="disclosure">
          <button type="button" data-part="trigger" data-c="disclosure" id={`${id}-t`} aria-expanded={open} aria-controls={`${id}-p`} onClick={() => setOpen((o) => !o)}>
            <span>{heading}</span>
            <span data-part="indicator" data-c="disclosure" aria-hidden="true"></span>
          </button>
        </h3>
        <div data-part="panel" data-c="disclosure" id={`${id}-p`} role="region" aria-labelledby={`${id}-t`} inert={!open}>
          <div data-part="content" data-c="disclosure">{children}</div>
        </div>
      </div>
    </div>
  );
}
