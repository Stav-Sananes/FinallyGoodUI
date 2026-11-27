import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./record-card.css";
import { attach } from "./record-card.behaviour.js";

export type RecordCardProps = {
  variant?: string;
  current?: boolean;
  lead?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"article">, "variant" | "current" | "lead" | "children" | "meta" | "status" | "action">;

export function RecordCard({ variant = "default", current = false, lead, children, meta, status, action, ...rest }: RecordCardProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <article
      data-fgu="record-card"
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
    </article>
  );
}
