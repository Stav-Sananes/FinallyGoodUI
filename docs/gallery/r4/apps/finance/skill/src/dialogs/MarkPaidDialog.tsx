import { useState } from "react";
import { Dialog } from "../components/fgu/dialog/dialog";
import { Field } from "../components/fgu/field/field";
import { Button } from "../components/fgu/button/button";
import { outstanding } from "../lib/forecast";
import { money } from "../lib/format";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import type { Invoice } from "../data/seed";

export function MarkPaidDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  return (
    <Dialog
      open={invoice !== null}
      onClose={onClose}
      title={invoice ? `Record a payment from ${invoice.client}` : "Record a payment"}
      description={invoice ? `${invoice.id}, ${invoice.project}. ${money(outstanding(invoice))} is open.` : undefined}
      actions={<MarkPaidActions invoice={invoice} onClose={onClose} />}
    >
      {invoice ? <MarkPaidFields key={invoice.id} invoice={invoice} onClose={onClose} /> : null}
    </Dialog>
  );
}

// The form lives in the dialog body; its submit button sits in the actions row, tied by the form attribute.
const FORM_ID = "mark-paid-form";

function MarkPaidFields({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { books } = useStore();
  const { recordPayment } = useActions();
  const open = outstanding(invoice);
  const [amount, setAmount] = useState(String(open));
  const [on, setOn] = useState(books.asOf);
  const [errors, setErrors] = useState<{ amount?: string; on?: string }>({});

  const validate = (a: string, d: string) => {
    const n = Number(a);
    const next: { amount?: string; on?: string } = {};
    if (!a.trim() || Number.isNaN(n) || n <= 0) next.amount = "Enter the amount that arrived, for example 4000.";
    else if (n > open) next.amount = `That is more than the ${money(open)} still open. Enter ${money(open)} or less.`;
    if (!d) next.on = "Pick the day the money landed.";
    else if (d > books.asOf) next.on = "That day hasn't happened yet. Pick today or earlier.";
    return next;
  };

  return (
    <form
      id={FORM_ID}
      noValidate
      className="dialog-form"
      onSubmit={(e) => {
        e.preventDefault();
        const next = validate(amount, on);
        setErrors(next);
        if (Object.keys(next).length) return;
        recordPayment(invoice, Number(amount), on);
        onClose();
      }}
    >
      <Field label="Amount received" hint="In US dollars. Part-payments are fine; the rest stays open." error={errors.amount}
        control={{ inputMode: "decimal", value: amount, onChange: (e) => setAmount(e.target.value), onBlur: () => setErrors((x) => ({ ...x, amount: validate(amount, on).amount })), required: true }} />
      <Field label="Landed on" error={errors.on}
        control={{ type: "date", value: on, max: books.asOf, onChange: (e) => setOn(e.target.value), onBlur: () => setErrors((x) => ({ ...x, on: validate(amount, on).on })), required: true }} />
    </form>
  );
}

function MarkPaidActions({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  return (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form={FORM_ID} disabled={invoice === null}>Record payment</Button>
    </>
  );
}
