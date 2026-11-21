# Studio finance (control)

React 19 + Vite + TypeScript; `radix-ui` used for Dialog, AlertDialog, Tabs, Tooltip. Plain CSS, no CDN.

Monday finance look for a small design studio: cash, runway, overdue invoices, payroll. 10 invoices, 6 payroll lines, 3 accounts, all fictional.
Flow: scan KPIs, check the 13-week cash forecast (SVG), remind or mark paid overdue invoices (search, sort), approve payroll.
States: loading skeleton, sync error (add `?fail=1` or go offline, then "Sync now"), empty overdue list (mark all paid), no-match search, reminder bounce error (Halvorsen Dental).

Shortcuts: data is in-memory fixtures with a simulated async API; state resets on reload. Forecast is a rough weekly model. Not mobile-polished beyond a basic breakpoint.

Run: `npm install && npm run dev` / `npm run build`.
