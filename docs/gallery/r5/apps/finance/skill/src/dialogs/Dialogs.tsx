import { createContext, useCallback, useContext, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "../components/fgu/dialog/dialog";
import { Button } from "../components/fgu/button/button";
import { Field } from "../components/fgu/field/field";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import { addDays, money, money2, shortDate } from "../lib/format";
import { outstanding, payrollCover } from "../lib/forecast";
import type { Invoice } from "../data/seed";

type Host = { markPaid: (i: Invoice) => void; addInvoice: () => void; approvePayroll: () => void };
const HostContext = createContext<Host | null>(null);
export const useDialogs = () => {
  const ctx = useContext(HostContext);
  if (!ctx) throw new Error("useDialogs outside DialogHost");
  return ctx;
};

/** Native validation, shown the way the Field expects: touch every invalid control, focus the first. */
function validate(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true;
  const bad = [...form.querySelectorAll<HTMLInputElement>(":invalid")];
  for (const c of bad) c.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  bad[0]?.focus();
  return false;
}

export function DialogHost({ children }: { children: ReactNode }) {
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [adding, setAdding] = useState(false);
  const [approving, setApproving] = useState(false);
  const [round, setRound] = useState(0); // remounts a form so it starts clean each time
  const markPaid = useCallback((i: Invoice) => { setRound((r) => r + 1); setPaying(i); }, []);
  const addInvoice = useCallback(() => { setRound((r) => r + 1); setAdding(true); }, []);
  const approvePayroll = useCallback(() => setApproving(true), []);
  const host = useMemo(() => ({ markPaid, addInvoice, approvePayroll }), [markPaid, addInvoice, approvePayroll]);
  return (
    <HostContext.Provider value={host}>
      {children}
      <MarkPaidDialog key={`p${round}`} invoice={paying} onClose={() => setPaying(null)} />
      <AddInvoiceDialog key={`a${round}`} open={adding} onClose={() => setAdding(false)} />
      <ApproveDialog open={approving} onClose={() => setApproving(false)} />
    </HostContext.Provider>
  );
}

function MarkPaidDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { books } = useStore();
  const { recordPayment } = useActions();
  const left = invoice ? outstanding(invoice) : 0;
  const [amount, setAmount] = useState("");
  const [on, setOn] = useState(books.asOf);
  const seeded = useRef<string | null>(null);
  if (invoice && seeded.current !== invoice.id) { seeded.current = invoice.id; setAmount(String(left)); }
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice || !validate(e.currentTarget)) return;
    recordPayment(invoice, Number(amount), on);
    onClose();
  };
  return (
    <Dialog open={invoice !== null} onClose={onClose} title="Record a payment" description={invoice ? `${invoice.client}, ${invoice.id}. ${money(left)} is still open.` : undefined}
      actions={<><Button variant="ghost" data-dialog-close>Cancel</Button><Button variant="primary" type="submit" form="mark-paid-form">Record payment</Button></>}>
      <form id="mark-paid-form" onSubmit={submit} noValidate className="form-stack">
        <Field label="Amount received (USD)" type="number" inputMode="decimal" name="amount" required min={0.01} max={left} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)}
          hint="Part payments are fine; the rest stays open."
          data-msg-value-missing="Enter what arrived in the account." data-msg-range-underflow="That has to be more than $0." data-msg-range-overflow={`That is more than the ${money2(left)} still owed.`} data-msg-bad-input="Numbers only, like 4000 or 4000.50." />
        <Field label="Date received" type="date" name="on" required value={on} max={books.asOf} onChange={(e) => setOn(e.target.value)} data-msg-value-missing="Pick the day it landed." data-msg-range-overflow="Money cannot land in the future; pick today or earlier." />
      </form>
    </Dialog>
  );
}

function AddInvoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { books, nextInvoiceId } = useStore();
  const { addInvoice } = useActions();
  const [f, setF] = useState({ client: "", project: "", amount: "", due: addDays(books.asOf, 30) });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate(e.currentTarget)) return;
    addInvoice({ id: nextInvoiceId(), client: f.client.trim(), project: f.project.trim(), amount: Number(f.amount), issued: books.asOf, due: f.due, paid: 0, paidOn: null, reminded: null });
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="New invoice" description={`Issued today, ${shortDate(books.asOf)}. It counts toward runway on its due date.`}
      actions={<><Button variant="ghost" data-dialog-close>Cancel</Button><Button variant="primary" type="submit" form="add-invoice-form">Add invoice</Button></>}>
      <form id="add-invoice-form" onSubmit={submit} noValidate className="form-stack">
        <Field label="Client" name="client" required autoComplete="organization" value={f.client} onChange={set("client")} data-msg-value-missing="Who is this invoice for?" />
        <Field label="Project" name="project" required value={f.project} onChange={set("project")} data-msg-value-missing="Name the job so it is easy to chase." />
        <Field label="Amount (USD)" type="number" inputMode="decimal" name="amount" required min={1} step={0.01} value={f.amount} onChange={set("amount")} data-msg-value-missing="Enter the total." data-msg-range-underflow="The total has to be at least $1." data-msg-bad-input="Numbers only, like 4000." />
        <Field label="Due date" type="date" name="due" required min={books.asOf} value={f.due} onChange={set("due")} data-msg-value-missing="When is it due?" data-msg-range-underflow="A due date in the past would be overdue on day one." />
      </form>
    </Dialog>
  );
}

function ApproveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { books } = useStore();
  const { approvePayroll } = useActions();
  const cover = payrollCover(books);
  return (
    <Dialog open={open} onClose={onClose} title="Approve Friday's pay run?" description={`${money(cover.total)} to ${books.people.length} people leaves Operating on Fri 27 Nov, which leaves ${money(cover.left)}. You can undo this until Friday.`}
      actions={<><Button variant="ghost" data-dialog-close>Not yet</Button><Button variant="primary" onClick={() => { approvePayroll(cover.total); onClose(); }}>Approve {money(cover.total)}</Button></>}>
      {!cover.covered && <p className="form-warning">Operating holds {money(cover.operating)}. Move {money(-cover.left)} over from the buffer before Friday.</p>}
    </Dialog>
  );
}
