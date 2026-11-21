import type { ReactNode } from "react";
import { Button } from "../components/fgu/button/button";
import { IconRefresh } from "./icons";
import { RegistrationMark } from "./Mark";

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <RegistrationMark className="empty-mark" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <div className="empty empty-error" role="alert">
      <RegistrationMark className="empty-mark" />
      <h3>The bank feed did not answer</h3>
      <p>I'm not showing numbers I can't vouch for. Your invoices and payroll are safe in this browser; nothing was lost.</p>
      <div className="empty-action">
        <Button variant="primary" loading={retrying} icon={<IconRefresh />} onClick={onRetry}>Try the feed again</Button>
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <div className="skeleton-row" key={i} />)}
    </div>
  );
}

export function MondaySkeleton() {
  return (
    <div className="monday" aria-busy="true" aria-label="Loading the books">
      <aside className="rail">
        <div className="skeleton skeleton-figure" aria-hidden="true" />
        <div className="skeleton skeleton-bar" aria-hidden="true" />
        <SkeletonRows rows={3} />
      </aside>
      <div className="work"><SkeletonRows rows={3} /><SkeletonRows rows={2} /></div>
    </div>
  );
}
