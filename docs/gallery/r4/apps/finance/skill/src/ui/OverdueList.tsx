import { Button } from "../components/fgu/button/button";
import { IconBell, IconCheck } from "./icons";
import { Money } from "./Money";
import { daysLate, outstanding } from "../lib/forecast";
import { shortDate } from "../lib/format";
import type { Invoice } from "../data/seed";

type Props = {
  invoices: Invoice[];
  asOf: string;
  onRemind: (i: Invoice) => void;
  onPaid: (i: Invoice) => void;
};

/** One row per invoice that is late: who, how late, how much, and the two things you can do about it. */
export function OverdueRows({ invoices, asOf, onRemind, onPaid }: Props) {
  const sorted = [...invoices].sort((a, b) => a.due.localeCompare(b.due));
  return (
    <ul className="rows">
      {sorted.map((i) => (
        <li className="row" key={i.id}>
          <div className="row-main">
            <p className="row-title">{i.client}</p>
            <p className="row-sub">{i.id}, {i.project}</p>
          </div>
          <div className="row-late">
            <span className="marker">{daysLate(i, asOf)} days late</span>
            <small>due {shortDate(i.due)}{i.reminded ? ` · reminded ${shortDate(i.reminded)}` : ""}</small>
          </div>
          <Money className="row-amount" value={outstanding(i)} />
          <div className="row-actions">
            <Button variant="secondary" icon={<IconBell />} onClick={() => onRemind(i)} aria-label={`Remind ${i.client} about ${i.id}`}>{i.reminded ? "Remind again" : "Remind"}</Button>
            <Button variant="ghost" icon={<IconCheck />} onClick={() => onPaid(i)} aria-label={`Record a payment for ${i.id}`}>Mark paid</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
