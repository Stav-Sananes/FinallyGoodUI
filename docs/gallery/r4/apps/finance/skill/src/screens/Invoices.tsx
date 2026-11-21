import { useMemo, useState } from "react";
import { Button } from "../components/fgu/button/button";
import { Field } from "../components/fgu/field/field";
import { Tabs } from "../components/fgu/tabs/tabs";
import { Menu } from "../components/fgu/menu/menu";
import { Money } from "../ui/Money";
import { OverdueRows } from "../ui/OverdueList";
import { EmptyState, ErrorState, SkeletonRows } from "../ui/states";
import { IconDots, IconPlus } from "../ui/icons";
import { MarkPaidDialog } from "../dialogs/MarkPaidDialog";
import { AddInvoiceDialog } from "../dialogs/AddInvoiceDialog";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import { isOpen, isOverdue, outstanding } from "../lib/forecast";
import { shortDate } from "../lib/format";
import { setParams, type Route } from "../lib/route";
import type { Invoice } from "../data/seed";

const TABS = ["overdue", "upcoming", "paid", "all"] as const;
type Tab = (typeof TABS)[number];

export function Invoices({ route }: { route: Route }) {
  const { status, books, retry, dispatch } = useStore();
  const { remind, removeInvoice } = useActions();
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [adding, setAdding] = useState(false);

  const param = route.params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(param ?? "") ? (param as Tab) : "overdue";
  const q = route.params.get("q") ?? "";

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return books.invoices.filter((i) => !needle || `${i.client} ${i.project} ${i.id}`.toLowerCase().includes(needle));
  }, [books.invoices, q]);

  if (status === "loading") return <PageShell onAdd={null}><SkeletonRows rows={5} /></PageShell>;
  if (status === "error") return <PageShell onAdd={null}><ErrorState onRetry={retry} /></PageShell>;

  const groups: Record<Tab, Invoice[]> = {
    overdue: matches.filter((i) => isOverdue(i, books.asOf)),
    upcoming: matches.filter((i) => isOpen(i) && !isOverdue(i, books.asOf)).sort((a, b) => a.due.localeCompare(b.due)),
    paid: matches.filter((i) => !isOpen(i)).sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? "")),
    all: matches,
  };

  const first = books.invoices.length === 0;
  const body = (t: Tab, label: string) => {
    const list = groups[t];
    if (first) {
      return <EmptyState title="No invoices yet" body="Add the first one and it joins the forecast on its due date." action={<><Button icon={<IconPlus />} onClick={() => setAdding(true)}>Add the first invoice</Button><Button variant="secondary" onClick={() => dispatch({ type: "restore" })}>Load the sample studio</Button></>} />;
    }
    if (list.length === 0 && q) return <EmptyState title={`No ${label} invoice matches "${q}"`} body="Check the spelling, or clear the filter to see everything." action={<Button variant="secondary" onClick={() => setParams("/invoices", { tab })}>Clear the filter</Button>} />;
    if (list.length === 0) {
      const copy: Record<Tab, [string, string]> = {
        overdue: ["Nothing is overdue", "Everyone is either paid or not due yet. Good Monday."],
        upcoming: ["Nothing is coming up", "No open invoices. Add one when you send it."],
        paid: ["Nothing paid yet", "Payments you record show up here."],
        all: ["No invoices", "Add the first one."],
      };
      return <EmptyState title={copy[t][0]} body={copy[t][1]} />;
    }
    if (t === "overdue") return <OverdueRows invoices={list} asOf={books.asOf} onRemind={(i) => remind([i])} onPaid={setPaying} />;
    return <InvoiceRows list={list} asOf={books.asOf} onPaid={setPaying} onRemind={(i) => remind([i])} onDelete={removeInvoice} showStatus={t === "all"} />;
  };

  const items = [
    { value: "overdue", label: `Overdue ${groups.overdue.length}`, panel: body("overdue", "overdue") },
    { value: "upcoming", label: `Coming up ${groups.upcoming.length}`, panel: body("upcoming", "upcoming") },
    { value: "paid", label: `Paid ${groups.paid.length}`, panel: body("paid", "paid") },
    { value: "all", label: `All ${groups.all.length}`, panel: body("all", "") },
  ];

  return (
    <PageShell onAdd={() => setAdding(true)}>
      <div className="filter">
        <Field label="Find an invoice" hint="Client, project or number." control={{ type: "search", value: q, onChange: (e) => setParams("/invoices", { tab, q: e.target.value }), autoComplete: "off" }} />
      </div>
      <Tabs label="Invoice groups" items={items} value={tab} onValueChange={(v) => setParams("/invoices", { tab: v, q })} />
      <AddInvoiceDialog open={adding} onClose={() => setAdding(false)} />
      <MarkPaidDialog invoice={paying} onClose={() => setPaying(null)} />
    </PageShell>
  );
}

function PageShell({ children, onAdd }: { children: React.ReactNode; onAdd: (() => void) | null }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Invoices</h1>
        {onAdd ? <Button icon={<IconPlus />} onClick={onAdd}>Add invoice</Button> : null}
      </header>
      {children}
    </div>
  );
}

function InvoiceRows({ list, asOf, onPaid, onRemind, onDelete, showStatus }: { list: Invoice[]; asOf: string; onPaid: (i: Invoice) => void; onRemind: (i: Invoice) => void; onDelete: (i: Invoice) => void; showStatus: boolean }) {
  return (
    <ul className="rows">
      {list.map((i) => {
        const open = isOpen(i);
        const late = isOverdue(i, asOf);
        return (
          <li className="row row-invoice" key={i.id}>
            <div className="row-main"><p className="row-title">{i.client}</p><p className="row-sub">{i.id}, {i.project}</p></div>
            <div className="row-late">
              {open ? <span className={late ? "marker" : "row-date"}>{late ? "Overdue" : `Due ${shortDate(i.due)}`}</span> : <span className="row-date">Paid {shortDate(i.paidOn ?? i.due)}</span>}
              {showStatus || late ? <small>{late ? `due ${shortDate(i.due)}` : open ? "open" : "settled"}{i.reminded ? ` · reminded ${shortDate(i.reminded)}` : ""}</small> : i.reminded ? <small>reminded {shortDate(i.reminded)}</small> : null}
            </div>
            <Money className="row-amount" value={open ? outstanding(i) : i.amount} />
            <div className="row-actions">
              {open ? <Button variant="secondary" onClick={() => onPaid(i)} aria-label={`Record a payment for ${i.id}`}>Mark paid</Button> : <span className="row-actions-gap" />}
              <Menu label={<IconDots />} triggerProps={{ "aria-label": `More for ${i.id}` }} items={[
                ...(open ? [{ label: i.reminded ? "Send another reminder" : "Send a reminder", onSelect: () => onRemind(i) }] : []),
                { label: "Copy invoice number", onSelect: () => { void navigator.clipboard?.writeText(i.id); } },
                { label: "Delete invoice", onSelect: () => onDelete(i), separatorBefore: true },
              ]} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
