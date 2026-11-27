import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNav } from "../router";
import type { Route } from "../router";
import { IconMonday, IconMoon, IconPay, IconSlip, IconSun } from "./Icons";
import { dayLabel } from "../format";
import { TODAY } from "../model";

const ITEMS: { to: Route; label: string; icon: ReactNode }[] = [
  { to: "/", label: "Monday", icon: <IconMonday /> },
  { to: "/invoices", label: "Invoices", icon: <IconSlip /> },
  { to: "/payroll", label: "Payroll", icon: <IconPay /> },
];

type Theme = "light" | "dark";
const readTheme = (): Theme => {
  try { const t = window.localStorage.getItem("marlow-pike-theme"); if (t === "light" || t === "dark") return t; } catch { /* blocked */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function Shell({ children }: { children: ReactNode }) {
  const { path } = useNav();
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const flip = () => setTheme((t) => {
    const n = t === "dark" ? "light" : "dark";
    try { window.localStorage.setItem("marlow-pike-theme", n); } catch { /* blocked */ }
    return n;
  });
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to the page</a>
      <nav className="rail" aria-label="Studio books">
        <p className="rail-brand" aria-label="Marlow and Pike"><span aria-hidden="true">M&amp;P</span><span className="rail-mark" aria-hidden="true" /></p>
        <ul className="rail-list">
          {ITEMS.map((it) => (
            <li key={it.to}>
              <Link to={it.to} className="rail-link" aria-current={path === it.to ? "page" : undefined}>
                {it.icon}<span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" className="rail-theme" onClick={flip} aria-label={theme === "dark" ? "Switch to the light sheet" : "Switch to the night sheet"}>
          {theme === "dark" ? <IconSun /> : <IconMoon />}<span>{theme === "dark" ? "Day" : "Night"}</span>
        </button>
      </nav>
      <main id="main" className="main" tabIndex={-1}>
        <p className="datebar"><span>Marlow &amp; Pike Studio</span><span className="num">{dayLabel(TODAY)}</span></p>
        {children}
      </main>
    </div>
  );
}
