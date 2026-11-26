import { useEffect, useState } from "react";
import { Menu } from "./components/fgu/menu/menu";
import { Toggle } from "./components/fgu/toggle/toggle";
import { StoreProvider, useStore } from "./lib/store";
import { ToastProvider } from "./lib/toasts";
import { DialogHost } from "./dialogs/Dialogs";
import { hrefFor, useRoute, type Route } from "./lib/route";
import Monday from "./screens/Monday";
import Invoices from "./screens/Invoices";
import Payroll from "./screens/Payroll";
import { Mark, MoonIcon } from "./ui/icons";

const NAV: { path: Route["path"]; label: string }[] = [
  { path: "/", label: "Monday" },
  { path: "/invoices", label: "Invoices" },
  { path: "/payroll", label: "Payroll" },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    try { const t = localStorage.getItem("saltmarsh-rook-theme"); if (t) return t === "dark"; } catch { /* storage blocked */ }
    return matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("saltmarsh-rook-theme", dark ? "dark" : "light"); } catch { /* storage blocked */ }
  }, [dark]);
  return [dark, setDark] as const;
}

function Shell() {
  const route = useRoute();
  const s = useStore();
  const [dark, setDark] = useTheme();
  const books = s.books;

  useEffect(() => {
    document.title = `${NAV.find((n) => n.path === route.path)?.label} · Saltmarsh & Rook`;
  }, [route.path]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <a className="brand" href={hrefFor("/")} aria-label="Saltmarsh and Rook, Monday">
          <Mark /><span className="brand-name">Saltmarsh <em>&amp;</em> Rook</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.path} href={hrefFor(n.path)} aria-current={route.path === n.path ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
        <div className="top-tools">
          <Toggle variant="switch" checked={dark} onChange={(e) => setDark(e.target.checked)}><span className="night"><MoonIcon /><span className="sr-only">Night mode</span></span></Toggle>
          <Menu
            items={[
              { label: "Refresh the bank feed", onSelect: s.refresh },
              { label: "Demo: simulate a bank outage", onSelect: () => s.dispatch({ type: "simulate-outage" }) },
              books.invoices.length || books.people.length
                ? { label: "Demo: clear the sample data", onSelect: () => s.dispatch({ type: "clear" }) }
                : { label: "Load the sample books", onSelect: () => s.dispatch({ type: "restore" }) },
            ]}
          >Studio</Menu>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {route.path === "/" && <Monday />}
        {route.path === "/invoices" && <Invoices route={route} />}
        {route.path === "/payroll" && <Payroll />}
      </main>
      <nav className="tabbar" aria-label="Main, mobile">
        {NAV.map((n) => (
          <a key={n.path} href={hrefFor(n.path)} aria-current={route.path === n.path ? "page" : undefined}>{n.label}</a>
        ))}
      </nav>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <DialogHost>
          <Shell />
        </DialogHost>
      </ToastProvider>
    </StoreProvider>
  );
}
