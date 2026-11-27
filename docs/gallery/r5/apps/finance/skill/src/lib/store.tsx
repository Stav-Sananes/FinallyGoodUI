import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { EMPTY_BOOKS, SAMPLE_BOOKS, type Books, type Invoice } from "../data/seed";

const KEY = "saltmarsh-rook-tide-v1";

export type Status = "loading" | "ready" | "error";
type State = { status: Status; books: Books; overduePaid: boolean; feedDown: boolean; cleared: boolean };

type Action =
  | { type: "loaded"; books: Books }
  | { type: "loading" }
  | { type: "failed" }
  | { type: "toggle-overdue-paid"; on: boolean }
  | { type: "simulate-outage" }
  | { type: "clear" }
  | { type: "restore" }
  | { type: "remind"; ids: string[]; on: string | null; previous?: Record<string, string | null> }
  | { type: "payment"; id: string; amount: number; on: string; previous?: Pick<Invoice, "paid" | "paidOn"> }
  | { type: "undo-payment"; id: string; previous: Pick<Invoice, "paid" | "paidOn">; amount: number }
  | { type: "add-invoice"; invoice: Invoice }
  | { type: "remove-invoice"; id: string }
  | { type: "restore-invoice"; invoice: Invoice }
  | { type: "approve-payroll"; on: string | null };

function reducer(s: State, a: Action): State {
  const b = s.books;
  switch (a.type) {
    case "loading": return { ...s, status: "loading" };
    case "failed": return { ...s, status: "error" };
    case "loaded": return { ...s, status: "ready", books: a.books, feedDown: false };
    case "simulate-outage": return { ...s, status: "error", feedDown: true };
    case "toggle-overdue-paid": return { ...s, overduePaid: a.on };
    case "clear": return { ...s, books: EMPTY_BOOKS, cleared: true };
    case "restore": return { ...s, books: SAMPLE_BOOKS, cleared: false };
    case "remind":
      return { ...s, books: { ...b, invoices: b.invoices.map((i) => (a.ids.includes(i.id) ? { ...i, reminded: a.previous ? (a.previous[i.id] ?? null) : a.on } : i)) } };
    case "payment":
      return {
        ...s,
        books: {
          ...b,
          accounts: b.accounts.map((acc) => (acc.id === "operating" ? { ...acc, balance: acc.balance + a.amount } : acc)),
          invoices: b.invoices.map((i) => (i.id === a.id ? { ...i, paid: i.paid + a.amount, paidOn: a.on } : i)),
        },
      };
    case "undo-payment":
      return {
        ...s,
        books: {
          ...b,
          accounts: b.accounts.map((acc) => (acc.id === "operating" ? { ...acc, balance: acc.balance - a.amount } : acc)),
          invoices: b.invoices.map((i) => (i.id === a.id ? { ...i, ...a.previous } : i)),
        },
      };
    case "add-invoice": return { ...s, books: { ...b, invoices: [a.invoice, ...b.invoices] } };
    case "remove-invoice": return { ...s, books: { ...b, invoices: b.invoices.filter((i) => i.id !== a.id) } };
    case "restore-invoice": return { ...s, books: { ...b, invoices: [a.invoice, ...b.invoices] } };
    case "approve-payroll": return { ...s, books: { ...b, payrollApprovedOn: a.on } };
  }
}

function readSaved(): { books: Books; cleared: boolean; overduePaid: boolean } | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const FEED_DELAY_MS = 900;

type Ctx = State & {
  dispatch: (a: Action) => void;
  refresh: () => void;
  retry: () => void;
  nextInvoiceId: () => string;
};
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const saved = useMemo(readSaved, []);
  const [state, dispatch] = useReducer(reducer, {
    status: "loading",
    books: saved?.books ?? SAMPLE_BOOKS,
    cleared: saved?.cleared ?? false,
    overduePaid: saved?.overduePaid ?? false,
    feedDown: false,
  });
  const timer = useRef<number | undefined>(undefined);

  const load = useCallback(() => {
    dispatch({ type: "loading" });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const down = navigator.onLine === false || new URLSearchParams(location.hash.split("?")[1] ?? "").get("feed") === "down";
      if (down) dispatch({ type: "failed" });
      else dispatch({ type: "loaded", books: state.books });
    }, FEED_DELAY_MS);
  }, [state.books]);

  useEffect(() => {
    load();
    return () => window.clearTimeout(timer.current);
    // first load only; refresh() reloads on demand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ books: state.books, cleared: state.cleared, overduePaid: state.overduePaid }));
    } catch {
      /* private mode: the session still works */
    }
  }, [state.books, state.cleared, state.overduePaid]);

  const nextInvoiceId = useCallback(() => {
    const top = state.books.invoices.reduce((m, i) => Math.max(m, Number(i.id.replace(/\D/g, ""))), 433);
    return `SR-${String(top + 1).padStart(4, "0")}`;
  }, [state.books.invoices]);

  const value: Ctx = { ...state, dispatch, refresh: load, retry: load, nextInvoiceId };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}
