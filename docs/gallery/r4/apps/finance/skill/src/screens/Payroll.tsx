import { useState } from "react";
import { Button } from "../components/fgu/button/button";
import { Disclosure } from "../components/fgu/disclosure/disclosure";
import { Money } from "../ui/Money";
import { EmptyState, ErrorState, SkeletonRows } from "../ui/states";
import { IconCheck } from "../ui/icons";
import { ColourBar } from "../ui/Mark";
import { ApprovePayrollDialog } from "../dialogs/ApprovePayrollDialog";
import { useStore } from "../lib/store";
import { expectedBeforeNextRun, monthlyFixed, payrollCover, NEXT_PAYDAY, PAYDAY } from "../lib/forecast";
import { dayDate, initials, money, shortDate } from "../lib/format";

const TAX_AND_BENEFITS = 0.22; // share of a staff member's monthly cost that is employer tax and benefits (sample figure)

export function Payroll() {
  const { status, books, retry, dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);

  if (status === "loading") return <Shell><SkeletonRows rows={6} /></Shell>;
  if (status === "error") return <Shell><ErrorState onRetry={retry} /></Shell>;
  if (books.people.length === 0) {
    return <Shell><EmptyState title="No pay run yet" body="The sample studio has eight people on it. Load it to see how a Friday pay run is checked against cash." action={<Button onClick={() => dispatch({ type: "restore" })}>Load the sample studio</Button>} /></Shell>;
  }

  const cover = payrollCover(books);
  const next = expectedBeforeNextRun(books);
  const share = Math.min(1, cover.total / Math.max(cover.operating, 1));
  const approved = books.payrollApprovedOn;

  return (
    <Shell action={approved ? <span className="stamp"><IconCheck />Approved {shortDate(approved)}</span> : <Button disabled={!cover.covered} onClick={() => setConfirming(true)}>Approve the pay run</Button>}>
      <section className="cover" aria-labelledby="cover-h">
        <h2 id="cover-h" className="caption">{dayDate(PAYDAY)}</h2>
        <p className="cover-figure"><Money value={cover.total} /></p>
        <p className="cover-line">
          {cover.covered
            ? <>comes out of Operating, which holds <Money value={cover.operating} />. <strong><Money value={cover.left} /> stays</strong> after the run.</>
            : <>is more than Operating holds (<Money value={cover.operating} />). Short by <strong><Money value={-cover.left} /></strong>.</>}
        </p>
        <div className="cover-bar" role="img" aria-label={`The pay run is ${Math.round(share * 100)} percent of the Operating balance`}>
          <span className="cover-signature-fill" data-covered={cover.covered} style={{ "--share": share } as React.CSSProperties} />
          <span className="cover-bar-tick" data-approved={Boolean(approved)} />
        </div>
        <p className="quiet cover-next">
          Then {dayDate(NEXT_PAYDAY)}: Operating should reach <Money value={next.balance} /> by then if open invoices land on time and {money(monthlyFixed(books))} of running costs go out first.
          {next.covered ? " That covers the next run." : " That does not cover the next run."}
        </p>
      </section>

      <section aria-labelledby="people-h" className="block">
        <header className="block-head"><h2 id="people-h" className="block-title">Who is paid</h2><ColourBar /></header>
        <ul className="rows">
          {books.people.map((p) => (
            <li className="person" key={p.id}>
              <span className="avatar" aria-hidden="true">{initials(p.name)}</span>
              <div className="row-main"><p className="row-title">{p.name}</p><p className="row-sub">{p.role}{p.kind === "freelance" ? ", freelance" : ""}</p></div>
              <Money className="row-amount" value={p.cost} />
              <div className="person-more">
                {p.kind === "staff" ? (
                  <Disclosure heading="Breakdown">
                    <p className="quiet breakdown">Pay <Money value={Math.round(p.cost * (1 - TAX_AND_BENEFITS))} />, employer tax and benefits <Money value={Math.round(p.cost * TAX_AND_BENEFITS)} /> (sample split).</p>
                  </Disclosure>
                ) : <p className="quiet breakdown">Paid on invoice, no tax split.</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <ApprovePayrollDialog open={confirming} onClose={() => setConfirming(false)} />
    </Shell>
  );
}

function Shell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="page">
      <header className="page-head"><h1 className="page-title">Payroll</h1>{action}</header>
      {children}
    </div>
  );
}
