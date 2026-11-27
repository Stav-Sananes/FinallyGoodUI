import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { loadBooks, forcedState } from "./api";
import { TODAY, project, statusOf } from "./model";
import type { Invoice, Projection, Scenario } from "./model";

type Phase = "loading" | "error" | "ready";
type Books = {
  phase: Phase;
  invoices: Invoice[];
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  projection: Projection;
  payrollApproved: boolean;
  approvePayroll: () => void;
  markPaid: (id: string) => void;
  undoPaid: (id: string) => void;
  nudge: (id: string) => void;
  sendDraft: (id: string) => void;
  retry: () => void;
};
const Ctx = createContext<Books | null>(null);

const SCENARIO_KEY = "marlow-pike-scenario";
const readScenario = (): Scenario => {
  try {
    const v = window.localStorage.getItem(SCENARIO_KEY);
    if (v === "never" || v === "two-weeks" || v === "four-weeks") return v;
  } catch { /* storage can be blocked */ }
  return "two-weeks";
};

export function BooksProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [scenario, setScenarioState] = useState<Scenario>(readScenario);
  const [payrollApproved, setApproved] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctl = new AbortController();
    setPhase("loading");
    loadBooks(ctl.signal).then(
      (list) => { setInvoices(list); setPhase("ready"); },
      () => { if (!ctl.signal.aborted) setPhase("error"); },
    );
    return () => ctl.abort();
  }, [attempt]);

  const setScenario = useCallback((s: Scenario) => {
    setScenarioState(s);
    try { window.localStorage.setItem(SCENARIO_KEY, s); } catch { /* ignore */ }
  }, []);
  const patch = useCallback((id: string, f: (i: Invoice) => Invoice) => setInvoices((all) => all.map((i) => (i.id === id ? f(i) : i))), []);
  const projection = useMemo(() => project(invoices, scenario, payrollApproved), [invoices, scenario, payrollApproved]);

  const value: Books = {
    phase, invoices, scenario, setScenario, projection, payrollApproved,
    approvePayroll: () => setApproved(true),
    markPaid: (id) => patch(id, (i) => ({ ...i, paidOn: TODAY })),
    undoPaid: (id) => patch(id, (i) => { const { paidOn: _p, ...rest } = i; void _p; return rest; }),
    nudge: (id) => patch(id, (i) => ({ ...i, nudgedOn: TODAY })),
    sendDraft: (id) => patch(id, (i) => ({ ...i, draft: false, number: "2054", issued: TODAY })),
    retry: () => setAttempt((n) => n + 1),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooks(): Books {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBooks needs a BooksProvider");
  return v;
}

export const overdueOf = (invoices: Invoice[]) => invoices.filter((i) => statusOf(i) === "overdue");
export { forcedState };
