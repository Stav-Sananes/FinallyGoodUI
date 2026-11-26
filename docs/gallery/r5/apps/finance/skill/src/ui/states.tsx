import type { ReactNode } from "react";
import { Button } from "../components/fgu/button/button";
import { AlertIcon, RefreshIcon, Waterline } from "./icons";

export function Skeleton({ h = 16, w = "100%", label }: { h?: number; w?: string | number; label?: string }) {
  return <span className="skeleton" style={{ blockSize: h, inlineSize: w }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

/** Page-level skeleton shaped like the Monday screen, so the layout does not jump when the feed answers. */
export function MondaySkeleton() {
  return (
    <div className="monday" aria-busy="true" aria-live="polite">
      <p className="sr-only">Reading the bank feed</p>
      <div className="monday-head"><Skeleton h={22} w={180} /><div style={{ height: 16 }} /><Skeleton h={64} w="min(560px,90%)" /><div style={{ height: 12 }} /><Skeleton h={18} w="min(640px,100%)" /></div>
      <div className="monday-grid">
        <div className="panel"><Skeleton h={260} /></div>
        <div className="panel stack"><Skeleton h={20} /><Skeleton h={20} /><Skeleton h={20} /><Skeleton h={20} /></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="panel stack" aria-busy="true">
      <p className="sr-only">Loading</p>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={44} />)}
    </div>
  );
}

export function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="banner banner-error" role="alert">
      <span className="banner-icon"><AlertIcon /></span>
      <div>
        <h2 className="banner-title">Can't reach the bank feed</h2>
        <p>The tide table needs fresh balances, and showing old ones as today's would mislead you. Your invoices and people are safe on this device.</p>
      </div>
      <Button variant="secondary" icon={<RefreshIcon />} onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Waterline className="empty-wave" />
      <h2 className="empty-title">{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
