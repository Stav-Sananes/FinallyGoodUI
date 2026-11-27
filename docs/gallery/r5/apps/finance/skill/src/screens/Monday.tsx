import { useMemo, useState } from "react";
import { Button } from "../components/fgu/button/button";
import { Toggle } from "../components/fgu/toggle/toggle";
import { Disclosure } from "../components/fgu/disclosure/disclosure";
import { useStore } from "../lib/store";
import { addDays, longDate, money, shortDate } from "../lib/format";
import { countedCash, daysLate, forecast, isOverdue, isOpen, monthlyFixed, monthlyPayroll, monthlyRetainers, outstanding, payrollCover, PAYDAY } from "../lib/forecast";
import { hrefFor } from "../lib/route";
import { useActions } from "../lib/actions";
import { useDialogs } from "../dialogs/Dialogs";
import { Staff, TideCurve } from "../ui/Runway";
import { OverdueList } from "../ui/OverdueList";
import { Empty, FeedError, MondaySkeleton } from "../ui/states";
import { BellIcon, CheckIcon, Waterline } from "../ui/icons";
import { firstViewThisSession, useCountUp } from "../ui/useFirstView";

export default function Monday() {
  const s = useStore();
  const { books, status } = s;
  const [first] = useState(firstViewThisSession);
  const { remind } = useActions();
  const { approvePayroll } = useDialogs();

  const base = useMemo(() => forecast(books, false), [books]);
  const ghost = useMemo(() => forecast(books, true), [books]);
  const runway = (s.overduePaid ? ghost : base).runwayMonths;
  const shown = useCountUp(runway ?? 12, first && status === "ready");

  if (status === "loading") return <MondaySkeleton />;
  if (status === "error") return <FeedError onRetry={s.retry} />;
  if (!books.invoices.length && !books.people.length)
    return (
      <Empty title="Nothing in the harbour yet" action={<Button variant="primary" onClick={() => s.dispatch({ type: "restore" })}>Load the sample books</Button>}>
        No invoices, no payroll, no costs. Add an invoice or load the sample books and the Monday look fills in.
      </Empty>
    );

  const overdue = books.invoices.filter((i) => isOverdue(i, books.asOf)).sort((a, b) => daysLate(b, books.asOf) - daysLate(a, books.asOf));
  const overdueTotal = overdue.reduce((t, i) => t + outstanding(i), 0);
  const soon = books.invoices.filter((i) => isOpen(i) && !isOverdue(i, books.asOf) && i.due <= addDays(books.asOf, 14));
  const soonTotal = soon.reduce((t, i) => t + outstanding(i), 0);
  const cash = countedCash(books);
  const out = monthlyPayroll(books) + monthlyFixed(books);
  const inn = monthlyRetainers(books);
  const cover = payrollCover(books);
  const active = s.overduePaid ? ghost : base;
  const approved = books.payrollApprovedOn !== null;

  return (
    <div className="monday">
      <header className="monday-head">
        <p className="eyebrow">Monday {longDate(books.asOf).replace(/^\w+, /, "")}</p>
        <h1 className="runway-line">
          {runway === null ? <>Afloat past <span className="runway-num fig">12</span> months.</> : <>Afloat for <span className="runway-num fig">{shown.toFixed(1)}</span> more months.</>}
        </h1>
        <p className="runway-sub">
          {money(cash)} in the counted accounts, {money(out)} going out each month, {money(inn)} coming in from retainers.{" "}
          {active.zeroDate ? <>At that pace the account runs dry around <strong>{shortDate(active.zeroDate)}</strong>, before any new work lands.</> : <>Cash stays above zero for the whole year ahead.</>}
        </p>
        <Waterline />
        <Staff months={runway} open={first} />
      </header>

      <section className="monday-grid" aria-label="Cash picture">
        <div className="panel">
          <div className="panel-head">
            <h2 className="h2">Next twelve month-ends</h2>
            <Toggle variant="switch" checked={s.overduePaid} onChange={(e) => s.dispatch({ type: "toggle-overdue-paid", on: e.target.checked })}>If overdue invoices land within 14 days</Toggle>
          </div>
          <TideCurve forecast={active} ghost={s.overduePaid ? undefined : ghost} startCash={cash} open={first} />
        </div>

        <aside className="panel readings" aria-label="Readings">
          <h2 className="h2">Readings</h2>
          <Waterline />
          <dl>
            <div><dt>Counted cash</dt><dd className="fig">{money(cash)}</dd></div>
            <div><dt>Tax reserve, set aside</dt><dd className="fig">{money(books.accounts.filter((a) => !a.counted).reduce((t, a) => t + a.balance, 0))}</dd></div>
            <div className="is-warn"><dt>Overdue ({overdue.length})</dt><dd className="fig">{money(overdueTotal)}</dd></div>
            <div><dt>Due in 14 days ({soon.length})</dt><dd className="fig">{money(soonTotal)}</dd></div>
            <div><dt>Payroll each month</dt><dd className="fig">{money(monthlyPayroll(books))}</dd></div>
            <div><dt>Running costs each month</dt><dd className="fig">{money(monthlyFixed(books))}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="monday-grid monday-grid-low">
        <div className="panel" aria-labelledby="owed-title">
          <div className="panel-head">
            <h2 className="h2" id="owed-title">Who owes the studio</h2>
            {overdue.length > 1 && <Button variant="secondary" icon={<BellIcon />} onClick={() => remind(overdue)}>Remind all {overdue.length}</Button>}
          </div>
          <Waterline />
          {overdue.length ? (
            <>
              <OverdueList invoices={overdue} asOf={books.asOf} />
              <a className="textlink" href={hrefFor("/invoices", { status: "overdue" })}>All invoices</a>
            </>
          ) : (
            <p className="calm"><CheckIcon /> Nobody is late. {soon.length ? `${soon.length} invoices fall due in the next two weeks.` : "Nothing falls due in the next two weeks."}</p>
          )}
        </div>

        <div className="panel payrun" aria-labelledby="pay-title">
          <h2 className="h2" id="pay-title">Friday's pay run</h2>
          <Waterline />
          <p className="payrun-total"><span className="fig">{money(cover.total)}</span><span> to {books.people.length} people, {longDate(PAYDAY).replace(/, \d{4}$/, "")}</span></p>
          <div className="cover" role="img" aria-label={`Operating holds ${money(cover.operating)}; the pay run is ${money(cover.total)}`}>
            <div className="cover-bar"><div className="cover-pay" style={{ inlineSize: `${Math.min(100, (cover.total / Math.max(cover.operating, cover.total)) * 100)}%` }} /></div>
            <div className="cover-legend"><span>Pay run {money(cover.total)}</span><span>Operating {money(cover.operating)}</span></div>
          </div>
          <p className={cover.covered ? "payrun-note" : "payrun-note is-short"}>{cover.covered ? `Covered, with ${money(cover.left)} left in Operating.` : `Short by ${money(-cover.left)}. Move money from the buffer first.`}</p>
          {approved
            ? <p className="calm"><CheckIcon /> Approved {shortDate(books.payrollApprovedOn!)}. It pays out Friday.</p>
            : <div className="payrun-actions"><Button variant="primary" onClick={approvePayroll}>Approve pay run</Button><a className="textlink" href={hrefFor("/payroll")}>See the people</a></div>}
        </div>
      </section>

      <Disclosure trigger="How the runway is worked out">
        <p>Start with the cash in accounts marked as counted (Operating and Buffer; the tax reserve is not yours to spend). Each month subtract payroll and running costs, add retainers, and add open invoices on the day they fall due. Overdue invoices are left out until the switch above brings them in 14 days from today. No new projects are assumed: it is the cautious case, on purpose.</p>
      </Disclosure>
    </div>
  );
}
