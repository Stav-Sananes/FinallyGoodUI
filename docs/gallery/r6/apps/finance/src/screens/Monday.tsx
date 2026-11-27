import { Planner } from "../ui/Planner";
import { InvoiceRecord, useInvoiceActions } from "../ui/Invoices";
import { EmptyState, ErrorState, Skeleton } from "../ui/States";
import { useBooks, overdueOf } from "../store";
import { Link } from "../router";
import { PAYROLL, PAYROLL_TOTAL, TODAY_DAY, nextPayday, statusOf } from "../model";
import { dayLabel, money, plural } from "../format";
import { Button } from "../components/fgu/button/button";
import { useNav } from "../router";
import { IconCheck } from "../ui/Icons";

export function Monday() {
  const { phase, invoices, projection, payrollApproved, retry } = useBooks();
  const { go } = useNav();
  const { dialog, actionsFor } = useInvoiceActions();

  if (phase === "error") return <div className="page-pad"><ErrorState onRetry={retry} /></div>;
  if (phase === "loading") return (
    <>
      <section className="planner planner-loading" aria-label="Runway planner, loading" data-fgu-signature="runway-planner">
        <div className="pl-top"><p className="eyebrow">Runway</p><Skeleton rows={4} label="Loading the runway" /></div>
        <div className="chart pl-chart chart-loading" />
      </section>
    </>
  );

  const overdue = overdueOf(invoices).sort((a, b) => a.due.localeCompare(b.due));
  const overdueSum = overdue.reduce((n, i) => n + i.amount, 0);
  const pay = nextPayday();
  const idx = pay.day - TODAY_DAY;
  const before = projection.balances[Math.max(idx - 1, 0)];
  const after = projection.balances[idx];
  const hasBooks = invoices.some((i) => statusOf(i) !== "draft");

  return (
    <>
      <Planner />
      <div className="ledgers">
        <section className="ledger ledger-overdue" aria-labelledby="overdue-h">
          <header className="ledger-head">
            <h2 id="overdue-h" className="h-section"><span className="tick" aria-hidden="true" />Late slips</h2>
            {overdue.length > 0 && <p className="ledger-sum"><span className="num">{money(overdueSum)}</span> across {plural(overdue.length, "invoice")}</p>}
          </header>
          {overdue.length === 0 ? (
            <EmptyState title={hasBooks ? "Nothing is overdue." : "No invoices sent yet."} stamp={hasBooks ? "All square" : undefined}>
              {hasBooks ? "Every sent invoice is inside its terms. A quiet Monday." : "The planner shows rent, running costs and payroll only. Send an invoice and it lands on the sheet in its due week."}
            </EmptyState>
          ) : (
            <ul className="slips">
              {overdue.map((inv) => <InvoiceRecord key={inv.id} inv={inv} actionsFor={actionsFor} />)}
            </ul>
          )}
          {overdue.length > 0 && <p className="ledger-foot"><Link to="/invoices?status=overdue">All invoices</Link></p>}
        </section>

        <section className="ledger ledger-pay" aria-labelledby="pay-h">
          <header className="ledger-head"><h2 id="pay-h" className="h-section"><span className="tick" aria-hidden="true" />Next payroll</h2></header>
          <div className="stub">
            <p className="stub-date">{dayLabel(pay.iso)}</p>
            <p className="stub-amount num">{money(PAYROLL_TOTAL)}</p>
            <p className="stub-lines">{plural(PAYROLL.length, "person", "people")}, salary and employer pension</p>
            <p className={"stub-cover" + (after < PAYROLL_TOTAL ? " stub-cover-low" : "")}>
              <IconCheck />
              <span>{payrollApproved ? "Approved." : after >= 0 ? "Covered." : "Short."} Bank before: <span className="num">{money(before)}</span>, after: <span className="num">{money(after)}</span></span>
            </p>
            <div className="stub-actions">
              <Button variant={payrollApproved ? "secondary" : "primary"} onClick={() => go("/payroll")}>{payrollApproved ? "View the run" : "Review and approve"}</Button>
            </div>
          </div>
          <p className="ledger-foot muted">The planner above already counts this run.</p>
        </section>
      </div>
      {dialog}
    </>
  );
}
