import { useState } from "react";
import { Button } from "../components/fgu/button/button";
import { Dialog } from "../components/fgu/dialog/dialog";
import { Table } from "../components/fgu/table/table";
import { useToast } from "../components/fgu/toast/toast-store";
import { ErrorState, Skeleton } from "../ui/States";
import { useBooks } from "../store";
import { PAYROLL, PAYROLL_TOTAL, TODAY_DAY, nextPayday } from "../model";
import { dayLabel, money, plural } from "../format";

const PAST = [
  { id: "r1", date: "2026-11-27", total: PAYROLL_TOTAL },
  { id: "r2", date: "2026-10-30", total: PAYROLL_TOTAL },
  { id: "r3", date: "2026-09-29", total: PAYROLL_TOTAL - 2700 },
];

export function PayrollScreen() {
  const { phase, projection, payrollApproved, approvePayroll, retry } = useBooks();
  const { push } = useToast();
  const [confirm, setConfirm] = useState(false);
  const pay = nextPayday();
  const idx = pay.day - TODAY_DAY;
  const before = projection.balances[Math.max(idx - 1, 0)] ?? 0;
  const after = projection.balances[idx] ?? 0;
  const spare = after;

  const rows = PAYROLL.map((p) => ({ id: p.id, name: p.name, role: p.role, cost: money(p.cost) }));

  return (
    <div className="page-pad">
      <header className="page-head">
        <h1 className="h-page">Payroll</h1>
        {phase === "ready" && <p className="page-sum">Next run <strong>{dayLabel(pay.iso)}</strong>, {plural(PAYROLL.length, "person", "people")}</p>}
      </header>
      {phase === "error" ? <ErrorState onRetry={retry} /> : phase === "loading" ? <Skeleton rows={6} label="Loading payroll" /> : (
        <div className="pay-layout">
          <section className="pay-run" aria-labelledby="run-h">
            <h2 id="run-h" className="h-section"><span className="tick" aria-hidden="true" />This run</h2>
            <p className="stub-amount num">{money(PAYROLL_TOTAL)}</p>
            <dl className="cover">
              <div><dt>In the bank the day before</dt><dd className="num">{money(before)}</dd></div>
              <div><dt>Left after the run</dt><dd className="num" data-low={after < PAYROLL_TOTAL ? "" : undefined}>{money(after)}</dd></div>
              <div><dt>Cover</dt><dd>{after >= PAYROLL_TOTAL ? `Covered, with another payroll to spare` : after >= 0 ? "Covered, but the next run is at risk" : "Short by " + money(-after)}</dd></div>
            </dl>
            {payrollApproved ? (
              <p className="approved"><span className="stamp stamp-ink">Approved</span> Pays {dayLabel(pay.iso)}. Nothing else to do.</p>
            ) : (
              <Button onClick={() => setConfirm(true)}>Approve this run</Button>
            )}
            <p className="muted small-print">{spare < 0 ? "Cash does not cover this run. Chase the late slips on the Monday sheet first." : "Approving locks the six lines. The bank pays on the day."}</p>
          </section>

          <section aria-labelledby="lines-h" className="pay-lines">
            <h2 id="lines-h" className="h-section"><span className="tick" aria-hidden="true" />Who gets paid</h2>
            <Table caption="Payroll lines for the next run" columns={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "cost", label: "Cost to the studio", align: "end" }]} rows={rows} />
            <p className="table-total"><span>Total cost</span><span className="num">{money(PAYROLL_TOTAL)}</span></p>
            <h2 className="h-section sub"><span className="tick" aria-hidden="true" />Paid already</h2>
            <ul className="past">
              {PAST.map((r) => <li key={r.id}><span>{dayLabel(r.date)}</span><span className="muted">paid</span><span className="num">{money(r.total)}</span></li>)}
            </ul>
          </section>
        </div>
      )}
      <Dialog open={confirm} onOpenChange={() => setConfirm(false)} title="Approve this payroll?" description={`${money(PAYROLL_TOTAL)} to ${plural(PAYROLL.length, "person", "people")} on ${dayLabel(pay.iso)}. You cannot edit the lines after this.`}
        actions={<>
          <Button variant="secondary" type="submit" value="cancel" formNoValidate>Not yet</Button>
          <Button type="submit" value="approve" onClick={() => { approvePayroll(); push({ message: `Payroll approved. It pays ${dayLabel(pay.iso)}.` }); }}>Approve {money(PAYROLL_TOTAL)}</Button>
        </>}>
        <p className="dialog-note">Bank after the run: <span className="num">{money(after)}</span>.</p>
      </Dialog>
    </div>
  );
}
