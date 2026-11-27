import type { ReactNode } from "react";
import { Button } from "../components/fgu/button/button";
import { Cross, IconAlert } from "./Icons";

export function Skeleton({ rows = 3, label = "Loading the books" }: { rows?: number; label?: string }) {
  return (
    <div className="skeleton" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <span key={i} className="skeleton-row" />)}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, stamp }: { title: string; children: ReactNode; stamp?: string }) {
  return (
    <div className="empty">
      <Cross className="empty-cross" />
      <div>
        {stamp ? <p className="stamp">{stamp}</p> : null}
        <p className="empty-title">{title}</p>
        <p className="empty-body">{children}</p>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="error-state" role="alert">
      <IconAlert />
      <div>
        <p className="empty-title">Couldn&rsquo;t load the books</p>
        <p className="empty-body">The books service did not answer, so nothing on this page can be trusted yet. Nothing was changed.</p>
        <Button variant="secondary" onClick={onRetry}>Try again</Button>
      </div>
    </div>
  );
}
