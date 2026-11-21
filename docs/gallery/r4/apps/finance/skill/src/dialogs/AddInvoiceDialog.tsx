import { useState } from "react";
import { Dialog } from "../components/fgu/dialog/dialog";
import { Field } from "../components/fgu/field/field";
import { Button } from "../components/fgu/button/button";
import { addDays } from "../lib/format";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";

const FORM_ID = "add-invoice-form";
type Errors = Partial<Record<"client" | "project" | "amount" | "due", string>>;

export function AddInvoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add an invoice"
      description="It joins the forecast on its due date."
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={FORM_ID}>Add invoice</Button>
        </>
      }
    >
      <AddInvoiceFields onClose={onClose} />
    </Dialog>
  );
}

function AddInvoiceFields({ onClose }: { onClose: () => void }) {
  const { books, nextInvoiceId } = useStore();
  const { addInvoice } = useActions();
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(addDays(books.asOf, 30));
  const [errors, setErrors] = useState<Errors>({});

  const check = (): Errors => {
    const e: Errors = {};
    if (!client.trim()) e.client = "Name the client, for example Tidewater Press.";
    if (!project.trim()) e.project = "Say what the invoice is for, for example Spring catalogue.";
    const n = Number(amount);
    if (!amount.trim() || Number.isNaN(n) || n <= 0) e.amount = "Enter the amount in dollars, for example 8500.";
    if (!due) e.due = "Pick the due date.";
    else if (due < books.asOf) e.due = "That date has passed. Pick today or later; the invoice would be overdue on day one.";
    return e;
  };
  const blur = (k: keyof Errors) => () => setErrors((x) => ({ ...x, [k]: check()[k] }));

  return (
    <form
      id={FORM_ID}
      noValidate
      className="dialog-form"
      onSubmit={(ev) => {
        ev.preventDefault();
        const e = check();
        setErrors(e);
        if (Object.keys(e).length) return;
        addInvoice({ id: nextInvoiceId(), client: client.trim(), project: project.trim(), amount: Number(amount), issued: books.asOf, due, paid: 0, paidOn: null, reminded: null });
        onClose();
      }}
    >
      <Field label="Client" error={errors.client} control={{ value: client, onChange: (e) => setClient(e.target.value), onBlur: blur("client"), autoComplete: "organization", list: "client-names" }} />
      <datalist id="client-names">{[...new Set(books.invoices.map((i) => i.client))].map((c) => <option key={c} value={c} />)}</datalist>
      <Field label="For" error={errors.project} control={{ value: project, onChange: (e) => setProject(e.target.value), onBlur: blur("project") }} />
      <div className="dialog-row">
        <Field label="Amount" error={errors.amount} control={{ inputMode: "decimal", value: amount, onChange: (e) => setAmount(e.target.value), onBlur: blur("amount") }} />
        <Field label="Due" error={errors.due} control={{ type: "date", value: due, min: books.asOf, onChange: (e) => setDue(e.target.value), onBlur: blur("due") }} />
      </div>
    </form>
  );
}
