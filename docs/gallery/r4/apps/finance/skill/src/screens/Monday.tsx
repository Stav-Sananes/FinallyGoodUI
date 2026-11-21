import { useState } from "react";
import { Button } from "../components/fgu/button/button";
import { Runway } from "../ui/Runway";
import { OverdueRows } from "../ui/OverdueList";
import { Money } from "../ui/Money";
import { EmptyState, ErrorState, MondaySkeleton } from "../ui/states";
import { IconBell, IconPlus } from "../ui/icons";
import { RegistrationMark } from "../ui/Mark";
import { MarkPaidDialog } from "../dialogs/MarkPaidDialog";
import { AddInvoiceDialog } from "../dialogs/AddInvoiceDialog";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import { isOpen, isOverdue, outstanding, payrollCover, PAYDAY } from "../lib/forecast";
import { dayDate, longDate, shortDate } from "../lib/format";
import { hrefFor } from "../lib/route";
import type { Invoice } from "../data/seed";

export function Monday() {
  const { status, books, retry, dispatch } = useStore();
  const { remind } = useActions();
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [adding, setAdding] = useState(false);

  if (status === "loading") return <MondaySkeleton />;
  if (status === "error") return <ErrorState onRetry={retry} />;

  if (books.invoices.length === 0 && books.people.length === 0) {
    return (
      <>
        <EmptyState
          title="The books are empty"
          body="No invoices, no payroll, nothing to forecast. Add the first invoice and the runway starts to take shape, or load the sample studio to see a full Monday."
          action={
            <>
              <Button icon={<IconPlus />} onClick={() => setAdding(true)}>Add the first invoice</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: "restore" })}>Load the sample studio</Button>
            </>
          }
        />
        <AddInvoiceDialog open={adding} onClose={() => setAdding(false)} />
      </>
    );
  }

  const overdue = books.invoices.filter((i) => isOverdue(i, books.asOf));
  const overdueTotal = overdue.reduce((s, i) => s + outstanding(i), 0);
  const oldest = overdue.reduce((m, i) => (i.due < m ? i.due : m), books.asOf);
  const unreminded = overdue.filter((i) => !i.reminded);
  const cover = payrollCover(books);
  const comingUp = books.invoices.filter((i) => isOpen(i) && !isOverdue(i, books.asOf)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);

  return (
    <div className="monday">
      <Runway />
      <div className="work">
        <section aria-labelledby="overdue-h" className="block">
          <header className="block-head">
            <div>
              <h2 id="overdue-h" className="block-title"><RegistrationMark className="title-mark" />Overdue</h2>
              {overdue.length ? (
                <p className="block-sub"><span className="marker">{overdue.length} {overdue.length === 1 ? "invoice" : "invoices"}</span> <Money value={overdueTotal} />, oldest due {shortDate(oldest)}.</p>
              ) : null}
            </div>
            {unreminded.length ? (
              <Button icon={<IconBell />} onClick={() => remind(unreminded)}>Chase {unreminded.length === overdue.length ? `all ${unreminded.length}` : `${unreminded.length} not yet reminded`}</Button>
            ) : null}
          </header>
          {overdue.length ? (
            <OverdueRows invoices={overdue} asOf={books.asOf} onRemind={(i) => remind([i])} onPaid={setPaying} />
          ) : (
            <EmptyState title="Nothing is overdue" body="Everyone who owes you money is either paid or not due yet. The next invoice falls due on the date below." />
          )}
        </section>

        <section aria-labelledby="pay-h" className="block payroll-strip">
          <header className="block-head">
            <div>
              <h2 id="pay-h" className="block-title"><RegistrationMark className="title-mark" />Payroll, {dayDate(PAYDAY)}</h2>
              <p className="block-sub">
                {books.people.length === 0 ? "No one is on the pay run yet." : books.payrollApprovedOn
                  ? <>Approved {shortDate(books.payrollApprovedOn)}. <Money value={cover.total} /> leaves Operating on Friday.</>
                  : cover.covered
                    ? <>Operating covers <Money value={cover.total} /> with <Money value={cover.left} /> to spare.</>
                    : <>Operating is short by <Money value={-cover.left} />. Move money in or chase an invoice before Friday.</>}
              </p>
            </div>
            <a className="link-button" href={hrefFor("/payroll")}>Open the pay run</a>
          </header>
        </section>

        <section aria-labelledby="up-h" className="block">
          <header className="block-head">
            <h2 id="up-h" className="block-title"><RegistrationMark className="title-mark" />Due next</h2>
            <a className="link-button" href={hrefFor("/invoices", { tab: "upcoming" })}>All coming up</a>
          </header>
          {comingUp.length ? (
            <ul className="rows rows-quiet">
              {comingUp.map((i) => (
                <li className="row row-compact" key={i.id}>
                  <div className="row-main"><p className="row-title">{i.client}</p><p className="row-sub">{i.project}</p></div>
                  <span className="row-date">{longDate(i.due).replace(/^\w+, /, "").replace(/, \d{4}$/, "")}</span>
                  <Money className="row-amount" value={outstanding(i)} />
                </li>
              ))}
            </ul>
          ) : <p className="quiet">No open invoices. Add one from the Invoices tab.</p>}
        </section>
      </div>
      <MarkPaidDialog invoice={paying} onClose={() => setPaying(null)} />
    </div>
  );
}
