import { useMemo } from "react";
import { Disclosure } from "../components/fgu/disclosure/disclosure";
import { Toggle } from "../components/fgu/toggle/toggle";
import { Money } from "./Money";
import { RegistrationMark } from "./Mark";
import { useFirstView } from "./useFirstView";
import { useStore } from "../lib/store";
import { forecast, isOverdue, outstanding, monthlyPayroll, monthlyFixed, monthlyRetainers } from "../lib/forecast";
import { longDate, money } from "../lib/format";

const GAUGE_MONTHS = 6;

/** The rail: how long the money lasts, the answer to the owner's first question. */
export function Runway() {
  const { books, overduePaid, dispatch } = useStore();
  const fc = useMemo(() => forecast(books, overduePaid), [books, overduePaid]);
  const overdue = books.invoices.filter((i) => isOverdue(i, books.asOf));
  const overdueTotal = overdue.reduce((s, i) => s + outstanding(i), 0);
  const target = fc.runwayMonths ?? 12;
  const { value, first } = useFirstView(target, 900);
  const gauge = fc.months.slice(0, GAUGE_MONTHS);
  const lastCovered = gauge.reduce((n, m, i) => (m.covered ? i : n), -1);

  return (
    <aside className="rail" aria-label="Runway and cash">
      <section className="runway">
        <RegistrationMark className="runway-mark" />
        <p className="caption">Runway</p>
        <p className="runway-figure" aria-label={fc.runwayMonths === null ? "More than 12 months" : `${target.toFixed(1)} months`}>
          <span aria-hidden="true">{fc.runwayMonths === null ? "12+" : value.toFixed(1)}</span>
          <span className="runway-unit" aria-hidden="true">months</span>
        </p>
        <p className="runway-line">
          {fc.zeroDate
            ? <>Cash runs out around <strong>{longDate(fc.zeroDate).replace(/^\w+, /, "")}</strong> if no new work is signed.</>
            : <>Cash lasts the next 12 months, with no new work signed.</>}
        </p>

        <ol className={`gauge${first ? " gauge-signature" : ""}`} aria-label="Cash at the end of each of the next six months">
          {gauge.map((m, i) => (
            <li key={m.key} data-covered={m.covered} data-last={i === lastCovered} style={{ "--i": i } as React.CSSProperties}>
              <span className="gauge-chip" />
              <span className="gauge-label">{m.label}</span>
              <span className="sr-only">{m.covered ? `covered, ${money(m.balance)} left` : `short by ${money(-m.balance)}`}</span>
            </li>
          ))}
        </ol>

        <Toggle variant="switch" checked={overduePaid} onChange={(e) => dispatch({ type: "toggle-overdue-paid", on: e.target.checked })} disabled={overdue.length === 0}>
          <span className="toggle-copy">
            Count the {overdue.length || "overdue"} overdue {overdue.length === 1 ? "invoice" : "invoices"} as paid within 14 days
            <small>{overdue.length ? <>Adds <Money value={overdueTotal} /> to the forecast.</> : "Nothing is overdue."}</small>
          </span>
        </Toggle>
      </section>

      <section className="cash" aria-labelledby="cash-h">
        <h2 id="cash-h" className="caption">Cash</h2>
        <ul className="ledger">
          {books.accounts.map((a) => (
            <li key={a.id} data-counted={a.counted}>
              <span className="ledger-name">{a.name}<small>{a.counted ? a.bank : `${a.bank} · set aside, not counted`}</small></span>
              <Money value={a.balance} />
            </li>
          ))}
        </ul>
      </section>

      <Disclosure heading="How runway is worked out">
        <div className="how">
          <p>I add up the two counted accounts, then step through each month-end.</p>
          <ul>
            <li>In: retainers {money(monthlyRetainers(books))} a month, plus each open invoice on its due date.</li>
            <li>Out: payroll {money(monthlyPayroll(books))} and running costs {money(monthlyFixed(books))} a month.</li>
            <li>Overdue invoices stay out until you switch them on above.</li>
            <li>The tax reserve is never counted. No new work is assumed.</li>
          </ul>
        </div>
      </Disclosure>
    </aside>
  );
}
