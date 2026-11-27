import { Button } from "../components/fgu/button/button";
import { Disclosure } from "../components/fgu/disclosure/disclosure";
import { useStore } from "../lib/store";
import { initials, longDate, money, shortDate } from "../lib/format";
import { monthlyFixed, payrollCover, PAYDAY } from "../lib/forecast";
import { useDialogs } from "../dialogs/Dialogs";
import { useActions } from "../lib/actions";
import { Empty, FeedError, ListSkeleton } from "../ui/states";
import { CheckIcon, Waterline } from "../ui/icons";
import type { Person } from "../data/seed";

function People({ title, people }: { title: string; people: Person[] }) {
  if (!people.length) return null;
  return (
    <section className="panel" aria-label={title}>
      <h2 className="h2">{title}</h2>
      <Waterline />
      <ul className="people">
        {people.map((p) => (
          <li key={p.id} className="person">
            <span className="avatar" aria-hidden="true">{initials(p.name)}</span>
            <span className="person-who"><span className="person-name">{p.name}</span><span className="person-role">{p.role}</span></span>
            <span className="fig">{money(p.cost)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Payroll() {
  const { books, status, retry, dispatch } = useStore();
  const { approvePayroll } = useDialogs();
  const { unapprove } = useActions();
  if (status === "loading") return <ListSkeleton rows={6} />;
  if (status === "error") return <FeedError onRetry={retry} />;
  if (!books.people.length)
    return <Empty title="No one on the payroll" action={<Button variant="secondary" onClick={() => dispatch({ type: "restore" })}>Load the sample books</Button>}>Add people and the Friday pay run shows here, with a check that Operating can cover it.</Empty>;

  const cover = payrollCover(books);
  const approved = books.payrollApprovedOn;
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h1">Payroll</h1>
          <Waterline />
          <p className="lede">{longDate(PAYDAY)}. {books.people.length} people, {money(cover.total)}.</p>
        </div>
        {approved ? null : <Button variant="primary" onClick={approvePayroll}>Approve pay run</Button>}
      </header>

      <section className={`panel runcheck ${cover.covered ? "" : "is-short"}`} aria-label="Can Operating cover it">
        <div className="cover" role="img" aria-label={`Operating holds ${money(cover.operating)}; pay run ${money(cover.total)}`}>
          <div className="cover-bar"><div className="cover-pay" style={{ inlineSize: `${Math.min(100, (cover.total / Math.max(cover.operating, cover.total)) * 100)}%` }} /></div>
          <div className="cover-legend"><span>Pay run {money(cover.total)}</span><span>Operating {money(cover.operating)}</span></div>
        </div>
        <p className="runcheck-line">{cover.covered ? <>Operating covers it and keeps <strong className="fig">{money(cover.left)}</strong>.</> : <>Operating is short by <strong className="fig">{money(-cover.left)}</strong>. Move money from the buffer before Friday.</>}</p>
        {approved && (
          <p className="calm"><CheckIcon /> Approved {shortDate(approved)}.{" "}
            <Button variant="ghost" onClick={unapprove}>Undo approval</Button></p>
        )}
      </section>

      <div className="people-grid">
        <People title="Staff" people={books.people.filter((p) => p.kind === "staff")} />
        <People title="Freelance" people={books.people.filter((p) => p.kind === "freelance")} />
      </div>

      <Disclosure trigger="What the pay run leaves out">
        <p>Running costs are paid separately: {money(monthlyFixed(books))} a month for {books.costs.map((c) => c.name.toLowerCase()).join(", ")}. The runway on the Monday screen subtracts both.</p>
      </Disclosure>
    </div>
  );
}
