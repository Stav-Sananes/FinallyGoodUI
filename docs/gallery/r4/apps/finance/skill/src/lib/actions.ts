import { useStore } from "./store";
import { useToast } from "../components/fgu/toast/toast";
import { money, shortDate } from "./format";
import { outstanding } from "./forecast";
import type { Invoice } from "../data/seed";

/** Every user action that changes the books, with its toast and its undo. Keeps screens free of the how. */
export function useActions() {
  const { dispatch, books } = useStore();
  const toast = useToast();

  const remind = (invoices: Invoice[]) => {
    const previous = Object.fromEntries(invoices.map((i) => [i.id, i.reminded]));
    dispatch({ type: "remind", ids: invoices.map((i) => i.id), on: books.asOf });
    const who = invoices.length === 1 ? invoices[0].client : `${invoices.length} clients`;
    toast({
      message: `Reminder sent to ${who}.`,
      action: { label: "Undo", onAction: () => dispatch({ type: "remind", ids: invoices.map((i) => i.id), on: null, previous }) },
    });
  };

  const recordPayment = (invoice: Invoice, amount: number, on: string) => {
    const previous = { paid: invoice.paid, paidOn: invoice.paidOn };
    dispatch({ type: "payment", id: invoice.id, amount, on });
    const left = outstanding(invoice) - amount;
    toast({
      message: left > 0 ? `${money(amount)} from ${invoice.client} recorded. ${money(left)} still open.` : `${invoice.client} paid ${invoice.id}. ${money(amount)} is in Operating.`,
      action: { label: "Undo", onAction: () => dispatch({ type: "undo-payment", id: invoice.id, previous, amount }) },
    });
  };

  const removeInvoice = (invoice: Invoice) => {
    dispatch({ type: "remove-invoice", id: invoice.id });
    toast({ message: `${invoice.id} for ${invoice.client} deleted.`, action: { label: "Undo", onAction: () => dispatch({ type: "restore-invoice", invoice }) } });
  };

  const addInvoice = (invoice: Invoice) => {
    dispatch({ type: "add-invoice", invoice });
    toast({ message: `${invoice.id} added. It is due ${shortDate(invoice.due)}.` });
  };

  const approvePayroll = (total: number) => {
    dispatch({ type: "approve-payroll", on: books.asOf });
    toast({ message: `Pay run approved: ${money(total)} leaves Operating on Fri 27 Nov.`, action: { label: "Undo", onAction: () => dispatch({ type: "approve-payroll", on: null }) } });
  };

  return { remind, recordPayment, removeInvoice, addInvoice, approvePayroll };
}
