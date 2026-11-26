import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../components/fgu/button/button";
import { Field } from "../components/fgu/field/field";
import { Menu } from "../components/fgu/menu/menu";
import { Tabs } from "../components/fgu/tabs/tabs";
import { selectTab } from "../components/fgu/tabs/tabs.behaviour.js";
import type { Invoice } from "../data/seed";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import { daysLate, isOpen, isOverdue, outstanding } from "../lib/forecast";
import { money, shortDate, daysBetween } from "../lib/format";
import { setParams, type Route } from "../lib/route";
import { useDialogs } from "../dialogs/Dialogs";
import { BellIcon, CheckIcon, PlusIcon, Waterline } from "../ui/icons";
import { Empty, FeedError, ListSkeleton } from "../ui/states";

const ORDER = ["open", "overdue", "paid"] as const;

function dueText(i: Invoice, asOf: string) {
  if (!isOpen(i)) return `Paid ${i.paidOn ? shortDate(i.paidOn) : ""}`;
  if (isOverdue(i, asOf)) return `${daysLate(i, asOf)} days late`;
  const d = daysBetween(asOf, i.due);
  return d === 0 ? "Due today" : `Due ${shortDate(i.due)}, in ${d} days`;
}

function Row({ i, asOf }: { i: Invoice; asOf: string }) {
  const { remind, removeInvoice } = useActions();
  const { markPaid } = useDialogs();
  const open = isOpen(i);
  const late = isOverdue(i, asOf);
  return (
    <li className={`inv-row ${late ? "is-late" : ""}`}>
      <span className="inv-id">{i.id}</span>
      <span className="inv-who"><span className="inv-client">{i.client}</span><span className="inv-project">{i.project}</span></span>
      <span className={`chip ${late ? "chip-late" : open ? "chip-open" : "chip-paid"}`}>{dueText(i, asOf)}{i.paid > 0 && open ? `, ${money(i.paid)} paid` : ""}</span>
      <span className="fig inv-amount">{money(open ? outstanding(i) : i.amount)}</span>
      <span className="inv-actions">
        {open && <Button variant="secondary" icon={<BellIcon />} onClick={() => remind([i])}>{i.reminded ? "Again" : "Remind"}<span className="sr-only"> {i.client}</span></Button>}
        {open && <Button variant="ghost" icon={<CheckIcon />} onClick={() => markPaid(i)}>Paid<span className="sr-only"> {i.client}</span></Button>}
        <Menu items={[{ label: `Delete ${i.id}`, onSelect: () => removeInvoice(i) }]} aria-label={`More for ${i.id}`}>More<span className="sr-only"> for {i.id}</span></Menu>
      </span>
    </li>
  );
}

export default function Invoices({ route }: { route: Route }) {
  const { books, status, retry } = useStore();
  const { addInvoice } = useDialogs();
  const [q, setQ] = useState(route.params.get("q") ?? "");
  const wrap = useRef<HTMLDivElement>(null);
  const want = ORDER.indexOf((route.params.get("status") ?? "open") as (typeof ORDER)[number]);

  useEffect(() => {
    const root = wrap.current?.querySelector('[data-fgu="tabs"]');
    if (root && want >= 0) selectTab(root, want);
  }, [want, status]);

  if (status === "loading") return <ListSkeleton />;
  if (status === "error") return <FeedError onRetry={retry} />;

  const needle = q.trim().toLowerCase();
  const match = (i: Invoice) => !needle || `${i.id} ${i.client} ${i.project}`.toLowerCase().includes(needle);
  const groups = {
    open: books.invoices.filter((i) => isOpen(i) && !isOverdue(i, books.asOf)),
    overdue: books.invoices.filter((i) => isOverdue(i, books.asOf)).sort((a, b) => daysLate(b, books.asOf) - daysLate(a, books.asOf)),
    paid: books.invoices.filter((i) => !isOpen(i)),
  };
  const labels = ["Coming due", "Overdue", "Paid"].map((l, n) => `${l} (${groups[ORDER[n]].length})`);

  const panel = (_tab: string, n: number): ReactNode => {
    const rows = groups[ORDER[n]].filter(match);
    if (!books.invoices.length)
      return <Empty title="No invoices yet" action={<Button variant="primary" icon={<PlusIcon />} onClick={addInvoice}>New invoice</Button>}>When you send work out, add the invoice here and the runway will count it on its due date.</Empty>;
    if (!rows.length)
      return needle
        ? <Empty title="No match" action={<Button variant="secondary" onClick={() => { setQ(""); setParams("/invoices", { status: ORDER[n] }); }}>Clear search</Button>}>Nothing here matches "{q}". Check the spelling, or search by invoice number.</Empty>
        : <Empty title={["Nothing coming due", "Nobody is late", "Nothing paid yet"][n]}>{["Every open invoice is already overdue or paid.", "Every open invoice is inside its terms.", "Paid invoices collect here."][n]}</Empty>;
    return <ul className="inv-list">{rows.map((i) => <Row key={i.id} i={i} asOf={books.asOf} />)}</ul>;
  };

  return (
    <div className="page" ref={wrap}>
      <header className="page-head">
        <div>
          <h1 className="h1">Invoices</h1>
          <Waterline />
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={addInvoice}>New invoice</Button>
      </header>
      <div className="search">
        <Field label="Search invoices" type="search" name="q" placeholder="Client, project or SR-0412" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Tabs tabs={labels} label="Invoice status" panel={panel} />
    </div>
  );
}
