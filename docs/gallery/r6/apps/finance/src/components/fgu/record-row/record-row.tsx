import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./record-row.css";
import { attach } from "./record-row.behaviour.js";

export type RecordRowProps = {
  variant?: string;
  current?: boolean;
  lead?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"li">, "variant" | "current" | "lead" | "children" | "meta" | "status" | "action">;

export function RecordRow({ variant = "default", current = false, lead, children, meta, status, action, ...rest }: RecordRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <li
      data-fgu="record-row"
      data-part="root"
      data-variant={variant}
      aria-current={current ? "true" : undefined}
      ref={ref}
      {...rest}
    >
      {lead ? (
        <span data-part="lead">{lead}</span>
      ) : null}
      <span data-part="title">{children}</span>
      {meta ? (
        <span data-part="meta">{meta}</span>
      ) : null}
      {status ? (
        <span data-part="status">{status}</span>
      ) : null}
      {action ? (
        <span data-part="action">{action}</span>
      ) : null}
    </li>
  );
}
