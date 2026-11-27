import { useEffect, useState } from "react";

export type Route = { path: "/" | "/invoices" | "/payroll"; params: URLSearchParams };

function parse(): Route {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [p, q = ""] = raw.split("?");
  const path = p === "/invoices" || p === "/payroll" ? p : "/";
  return { path, params: new URLSearchParams(q) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function hrefFor(path: Route["path"], params?: Record<string, string>) {
  const q = params ? `?${new URLSearchParams(params)}` : "";
  return `#${path}${q}`;
}

/** Replace the current query params without adding a history entry per keystroke. */
export function setParams(path: Route["path"], params: Record<string, string>) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""));
  history.replaceState(null, "", hrefFor(path, clean));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
