import { useMemo } from "react";
import { Tabs } from "../components/fgu/tabs/tabs";
import { Field } from "../components/fgu/field/field";
import { InvoiceRecord, useInvoiceActions } from "../ui/Invoices";
import { EmptyState, ErrorState, Skeleton } from "../ui/States";
import { useBooks } from "../store";
import { useNav } from "../router";
import { statusOf } from "../model";
import type { Invoice, InvoiceStatus } from "../model";
import { money } from "../format";

const FILTERS: { id: "all" | InvoiceStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "draft", label: "Drafts" },
  { id: "paid", label: "Paid" },
];
const order: Record<InvoiceStatus, number> = { overdue: 0, upcoming: 1, draft: 2, paid: 3 };

export function InvoicesScreen() {
  const { phase, invoices, retry } = useBooks();
  const { search, setParam } = useNav();
  const { dialog, actionsFor } = useInvoiceActions();
  const status = (search.get("status") ?? "all") as "all" | InvoiceStatus;
  const q = (search.get("q") ?? "").trim().toLowerCase();
  const idx = Math.max(FILTERS.findIndex((f) => f.id === status), 0);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    for (const i of invoices) c[statusOf(i)] = (c[statusOf(i)] ?? 0) + 1;
    return c;
  }, [invoices]);

  const owed = invoices.filter((i) => ["overdue", "upcoming"].includes(statusOf(i)));
  const owedSum = owed.reduce((n, i) => n + i.amount, 0);
  const lateSum = invoices.filter((i) => statusOf(i) === "overdue").reduce((n, i) => n + i.amount, 0);

  const visible = (f: string): Invoice[] =>
    invoices
      .filter((i) => (f === "all" ? true : statusOf(i) === f))
      .filter((i) => !q || (i.client + " " + i.number + " " + i.work).toLowerCase().includes(q))
      .sort((a, b) => order[statusOf(a)] - order[statusOf(b)] || a.due.localeCompare(b.due));

  return (
    <div className="page-pad">
      <header className="page-head">
        <h1 className="h-page">Invoices</h1>
        {phase === "ready" && invoices.length > 0 && (
          <p className="page-sum"><span className="num">{money(owedSum)}</span> owed to the studio, <span className="num late">{money(lateSum)}</span> of it late</p>
        )}
      </header>

      {phase === "error" ? <ErrorState onRetry={retry} /> : phase === "loading" ? <Skeleton rows={6} label="Loading invoices" /> : (
        <>
          <div className="finder">
            <Field label="Find an invoice" type="search" placeholder="Client, number or work" value={search.get("q") ?? ""} onChange={(e) => setParam("q", e.target.value)} />
          </div>
          <Tabs
            label="Invoice status"
            tabs={FILTERS.map((f) => `${f.label} ${counts[f.id] ?? 0}`)}
            selected={idx}
            onSelectedChange={(i) => setParam("status", FILTERS[i].id === "all" ? null : FILTERS[i].id)}
            panel={(_t, i) => {
              if (i !== idx) return null;
              const list = visible(FILTERS[i].id);
              return list.length === 0 ? (
                <EmptyState title={invoices.length === 0 ? "No invoices yet." : q ? "No invoice matches that." : `No ${FILTERS[i].label.toLowerCase()} invoices.`} stamp={FILTERS[i].id === "overdue" && !q && invoices.length > 0 ? "All square" : undefined}>
                  {invoices.length === 0 ? "Send the first invoice and it lands on the Monday planner in its due week." : q ? "Check the spelling, or clear the search to see every invoice." : "Nothing sits in this pile right now."}
                </EmptyState>
              ) : (
                <ul className="slips">{list.map((inv) => <InvoiceRecord key={inv.id} inv={inv} actionsFor={actionsFor} />)}</ul>
              );
            }}
          />
        </>
      )}
      {dialog}
    </div>
  );
}
