import { useEffect, useState } from "react";
import { Menu } from "./components/fgu/menu/menu";
import { ToastProvider, useToast } from "./components/fgu/toast/toast";
import { Dialog } from "./components/fgu/dialog/dialog";
import { Button } from "./components/fgu/button/button";
import { RegistrationMark, ColourBar } from "./ui/Mark";
import { IconStudio } from "./ui/icons";
import { Monday } from "./screens/Monday";
import { Invoices } from "./screens/Invoices";
import { Payroll } from "./screens/Payroll";
import { StoreProvider, useStore } from "./lib/store";
import { hrefFor, useRoute, type Route } from "./lib/route";
import { longDate } from "./lib/format";

const NAV: { path: Route["path"]; label: string }[] = [
  { path: "/", label: "Monday" },
  { path: "/invoices", label: "Invoices" },
  { path: "/payroll", label: "Payroll" },
];

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}

function Shell() {
  const route = useRoute();
  const { books, status, refresh, dispatch, cleared } = useStore();
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const names = { "/": "Monday", "/invoices": "Invoices", "/payroll": "Payroll" };
    document.title = `${names[route.path]} · Harbour & Pike books`;
  }, [route.path]);

  return (
    <>
      <a className="skip" href="#main">Skip to the page</a>
      <header className="masthead">
        <div className="masthead-inner">
          <a className="brand" href={hrefFor("/")} aria-label="Harbour & Pike books, Monday">
            <RegistrationMark className="brand-mark" />
            <span className="brand-name">Harbour <span>&amp;</span> Pike</span>
          </a>
          <nav aria-label="Main" className="nav">
            {NAV.map((n) => (
              <a key={n.path} href={hrefFor(n.path)} aria-current={route.path === n.path ? "page" : undefined}>{n.label}</a>
            ))}
          </nav>
          <Menu
            label={<><IconStudio /><span>Studio</span></>}
            items={[
              { label: "Refresh from the bank", onSelect: () => { refresh(); toast({ message: "Asking the bank feed for today's balances." }); } },
              { label: cleared ? "Load the sample studio" : "Clear the sample data", onSelect: () => (cleared ? dispatch({ type: "restore" }) : setConfirmClear(true)), separatorBefore: true },
              { label: "Demo: simulate a bank outage", onSelect: () => dispatch({ type: "simulate-outage" }) },
            ]}
          />
        </div>
        <ColourBar className="masthead-bar" />
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {route.path === "/" ? <Monday /> : route.path === "/invoices" ? <Invoices route={route} /> : <Payroll />}
      </main>

      <footer className="foot">
        <p>
          Books as of {longDate(books.asOf)}{status === "loading" ? ", refreshing" : ""}. Harbour &amp; Pike is a made-up studio; every figure is sample data kept in this browser.
        </p>
      </footer>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        variant="confirm"
        title="Clear the sample data?"
        description="Invoices, payroll and costs go. You can load the sample studio back from this menu."
        actions={
          <>
            <Button variant="ghost" autoFocus onClick={() => setConfirmClear(false)}>Keep it</Button>
            <Button variant="destructive" onClick={() => { dispatch({ type: "clear" }); setConfirmClear(false); }}>Clear everything</Button>
          </>
        }
      />
    </>
  );
}
