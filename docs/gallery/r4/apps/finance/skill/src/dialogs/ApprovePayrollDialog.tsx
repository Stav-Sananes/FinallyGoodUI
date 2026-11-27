import { Dialog } from "../components/fgu/dialog/dialog";
import { Button } from "../components/fgu/button/button";
import { Money } from "../ui/Money";
import { useStore } from "../lib/store";
import { useActions } from "../lib/actions";
import { payrollCover } from "../lib/forecast";

/** Approving payroll can't be taken back by the bank, so this is a confirm dialog with the amount, not a bare toast. */
export function ApprovePayrollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { books } = useStore();
  const { approvePayroll } = useActions();
  const cover = payrollCover(books);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="confirm"
      title="Approve the Friday pay run?"
      description={`${books.people.length} people are paid on Fri 27 Nov.`}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} autoFocus>Not yet</Button>
          <Button variant="primary" onClick={() => { approvePayroll(cover.total); onClose(); }}>Approve <Money value={cover.total} /></Button>
        </>
      }
    >
      <dl className="confirm-figures">
        <div><dt>Leaves Operating</dt><dd><Money value={cover.total} /></dd></div>
        <div><dt>Left in Operating</dt><dd><Money value={cover.left} /></dd></div>
      </dl>
    </Dialog>
  );
}
