import { BooksProvider } from "./store";
import { RouterProvider, useNav } from "./router";
import { ToastProvider } from "./components/fgu/toast/toast-store";
import { Shell } from "./ui/Shell";
import { Monday } from "./screens/Monday";
import { InvoicesScreen } from "./screens/InvoicesScreen";
import { PayrollScreen } from "./screens/PayrollScreen";

function Routes() {
  const { path } = useNav();
  return <Shell>{path === "/invoices" ? <InvoicesScreen /> : path === "/payroll" ? <PayrollScreen /> : <Monday />}</Shell>;
}

export default function App() {
  return (
    <RouterProvider>
      <BooksProvider>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </BooksProvider>
    </RouterProvider>
  );
}
