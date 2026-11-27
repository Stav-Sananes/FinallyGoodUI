import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Route = "/" | "/invoices" | "/payroll";
type Nav = { path: Route; search: URLSearchParams; go: (to: string, replace?: boolean) => void; setParam: (key: string, value: string | null) => void };
const Ctx = createContext<Nav | null>(null);

const norm = (p: string): Route => (p === "/invoices" || p === "/payroll" ? p : "/");

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(() => ({ path: window.location.pathname, search: window.location.search }));
  useEffect(() => {
    const on = () => setLoc({ path: window.location.pathname, search: window.location.search });
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  const go = useCallback((to: string, replace = false) => {
    // keep the forced-state switch (?state=) while moving between screens
    const url = new URL(to, window.location.origin);
    const forced = new URLSearchParams(window.location.search).get("state");
    if (forced && !url.searchParams.has("state")) url.searchParams.set("state", forced);
    const next = url.pathname + url.search;
    if (replace) window.history.replaceState(null, "", next); else window.history.pushState(null, "", next);
    setLoc({ path: url.pathname, search: url.search });
    if (!replace) window.scrollTo({ top: 0 });
  }, []);
  const setParam = useCallback((key: string, value: string | null) => {
    const sp = new URLSearchParams(window.location.search);
    if (value === null || value === "") sp.delete(key); else sp.set(key, value);
    const qs = sp.toString();
    go(window.location.pathname + (qs ? "?" + qs : ""), true);
  }, [go]);
  const value = useMemo(() => ({ path: norm(loc.path), search: new URLSearchParams(loc.search), go, setParam }), [loc, go, setParam]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNav needs a RouterProvider");
  return v;
}

export function Link({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string } & Omit<React.ComponentPropsWithoutRef<"a">, "href">) {
  const { go } = useNav();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
