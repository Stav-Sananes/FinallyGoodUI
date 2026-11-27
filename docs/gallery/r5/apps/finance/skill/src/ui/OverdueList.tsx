import { Button } from "../components/fgu/button/button";
import type { Invoice } from "../data/seed";
import { daysLate, outstanding } from "../lib/forecast";
import { money, shortDate } from "../lib/format";
import { useActions } from "../lib/actions";
import { useDialogs } from "../dialogs/Dialogs";
import { BellIcon, CheckIcon } from "./icons";

export function OverdueList({ invoices, asOf }: { invoices: Invoice[]; asOf: string }) {
  const { remind } = useActions();
  const { markPaid } = useDialogs();
  return (
    <ul className="owed" aria-label="Overdue invoices, longest first">
      {invoices.map((i) => (
        <li key={i.id} className="owed-row">
          <div className="owed-who">
            <span className="owed-client">{i.client}</span>
            <span className="owed-meta">{i.id} · {i.project}</span>
            <span className="owed-late">Due {shortDate(i.due)}, {daysLate(i, asOf)} days late{i.reminded ? ` · reminded ${shortDate(i.reminded)}` : ""}</span>
          </div>
          <span className="fig owed-amount">{money(outstanding(i))}</span>
          <div className="owed-actions">
            <Button variant="secondary" icon={<BellIcon />} onClick={() => remind([i])}>{i.reminded ? "Remind again" : "Remind"}<span className="sr-only"> {i.client}</span></Button>
            <Button variant="ghost" icon={<CheckIcon />} onClick={() => markPaid(i)}>Mark paid<span className="sr-only"> {i.client}</span></Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
