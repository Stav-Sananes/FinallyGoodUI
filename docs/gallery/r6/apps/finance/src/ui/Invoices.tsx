import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../components/fgu/button/button";
import { Dialog } from "../components/fgu/dialog/dialog";
import { Field } from "../components/fgu/field/field";
import { RecordRow } from "../components/fgu/record-row/record-row";
import { RecordCard } from "../components/fgu/record-card/record-card";
import { useToast } from "../components/fgu/toast/toast-store";
import { useBooks } from "../store";
import { daysLate, statusOf, toDay } from "../model";
import type { Invoice } from "../model";
import { money, plural, shortDate } from "../format";
import { useMedia } from "./useSize";
import { IconAlert, IconCheck } from "./Icons";

function statusLine(inv: Invoice): ReactNode {
  const s = statusOf(inv);
  if (s === "overdue") return <span className="status status-late"><IconAlert />{plural(daysLate(inv), "day")} late</span>;
  if (s === "paid") return <span className="status status-ok"><IconCheck />Paid {shortDate(inv.paidOn ?? inv.due)}</span>;
  if (s === "draft") return <span className="status">Draft, not sent</span>;
  const left = toDay(inv.due) - toDay("2026-11-30");
  return <span className="status">Due {shortDate(inv.due)} ({left} d)</span>;
}

/** Everything that can be done to one invoice, with the nudge dialog. */
export function useInvoiceActions() {
  const { markPaid, undoPaid, nudge, sendDraft } = useBooks();
  const { push } = useToast();
  const [target, setTarget] = useState<Invoice | null>(null);
  const [note, setNote] = useState("");

  const openNudge = (inv: Invoice) => {
    setNote(`Hi ${inv.contact.split(" ")[0]}, a gentle nudge on invoice ${inv.number} (${money(inv.amount)} for ${inv.work.toLowerCase()}), which was due on ${shortDate(inv.due)}. Could you let me know when to expect payment? Thanks, Ines`);
    setTarget(inv);
  };
  const doPaid = (inv: Invoice) => {
    markPaid(inv.id);
    push({ message: `${money(inv.amount)} from ${inv.client} is in the bank.`, action: "Undo", onAction: () => undoPaid(inv.id), timeout: 6000 });
  };
  const doDraft = (inv: Invoice) => {
    sendDraft(inv.id);
    push({ message: `Invoice sent to ${inv.client}, due ${shortDate(inv.due)}.` });
  };

  const dialog = (
    <Dialog open={target !== null} onOpenChange={() => setTarget(null)} title={target ? `Nudge ${target.client}` : "Nudge"} description={target ? `Invoice ${target.number}, ${money(target.amount)}, ${plural(daysLate(target), "day")} late. Sent to ${target.email}.` : undefined}
      actions={<>
        <Button variant="secondary" type="submit" value="cancel" formNoValidate>Not now</Button>
        <Button type="submit" value="send" onClick={() => { if (target) { nudge(target.id); push({ message: `Nudge sent to ${target.contact} at ${target.client}.` }); } }}>Send nudge</Button>
      </>}>
      <Field label="Message" multiline rows={5} value={note} onChange={(e) => setNote((e.target as unknown as HTMLTextAreaElement).value)} hint="Plain text, sent from ines@marlowpike.example" />
    </Dialog>
  );

  const actionsFor = (inv: Invoice): ReactNode => {
    const s = statusOf(inv);
    if (s === "overdue") return (<>
      <Button variant="primary" onClick={() => openNudge(inv)}>{inv.nudgedOn ? "Nudge again" : "Send nudge"}</Button>
      <Button variant="secondary" onClick={() => doPaid(inv)}>Mark paid</Button>
    </>);
    if (s === "upcoming") return <Button variant="secondary" onClick={() => doPaid(inv)}>Mark paid</Button>;
    if (s === "draft") return <Button variant="primary" onClick={() => doDraft(inv)}>Send invoice</Button>;
    return null;
  };
  return { dialog, actionsFor };
}

export function InvoiceRecord({ inv, actionsFor }: { inv: Invoice; actionsFor: (i: Invoice) => ReactNode }) {
  const narrow = useMedia("(max-width: 40rem)");
  const meta = <>{inv.work}{inv.nudgedOn ? <> &middot; nudged {shortDate(inv.nudgedOn)}</> : null}</>;
  const status = <>{statusLine(inv)}</>;
  const lead = inv.draft ? "Draft" : `#${inv.number}`;
  const body = (
    <>
      <span className="rec-client">{inv.client}</span>
    </>
  );
  const amount = <span className="num rec-amount">{money(inv.amount)}</span>;
  const common = { lead, meta, status: <span className="rec-status">{amount}{status}</span>, action: actionsFor(inv) };
  return narrow ? <li className="slip-item"><RecordCard {...common}>{body}</RecordCard></li> : <RecordRow {...common}>{body}</RecordRow>;
}
