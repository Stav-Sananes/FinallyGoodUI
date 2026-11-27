import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Tabs, Tooltip, AlertDialog } from 'radix-ui'
import { TODAY, PAYROLL, PAYROLL_DATE, FIXED_MONTHLY, payrollTotal, money, fmtDate, daysBetween, type Invoice } from './data'
import { loadSnapshot, sendReminder, type Snapshot } from './api'
import { Forecast } from './Forecast'

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; snap: Snapshot }
type Toast = { kind: 'ok' | 'err'; text: string } | null

export default function App() {
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [paid, setPaid] = useState<Set<string>>(new Set())
  const [approved, setApproved] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [reminded, setReminded] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<'days' | 'amount'>('days')
  const [filter, setFilter] = useState('')

  const refresh = useCallback(() => {
    setLoad({ status: 'loading' })
    loadSnapshot().then(
      (snap) => setLoad({ status: 'ok', snap }),
      (e: Error) => setLoad({ status: 'error', message: e.message }),
    )
  }, [])
  useEffect(refresh, [refresh])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="eyebrow">Monday, November 23</p>
          <h1>Good morning, Ines. Here is the studio's week.</h1>
        </div>
        <div className="sync">
          {load.status === 'ok' && <span className="muted">Synced {load.snap.syncedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>}
          <button className="btn" onClick={refresh} disabled={load.status === 'loading'}>{load.status === 'loading' ? 'Syncing…' : 'Sync now'}</button>
        </div>
      </header>

      {load.status === 'loading' && <Skeleton />}
      {load.status === 'error' && (
        <div className="panel error" role="alert">
          <h2>Couldn't load your numbers</h2>
          <p>{load.message}</p>
          <p className="muted">Nothing on this page is shown until the bank feed is back, so you don't act on stale cash.</p>
          <button className="btn primary" onClick={refresh}>Try again</button>
        </div>
      )}
      {load.status === 'ok' && (
        <Dashboard
          snap={load.snap} paid={paid} setPaid={setPaid} approved={approved} setApproved={setApproved}
          reminded={reminded} setReminded={setReminded} setToast={setToast}
          sort={sort} setSort={setSort} filter={filter} setFilter={setFilter}
        />
      )}
      {toast && <div className={'toast ' + toast.kind} role="status">{toast.text}</div>}
    </div>
  )
}

type DProps = {
  snap: Snapshot; paid: Set<string>; setPaid: (s: Set<string>) => void
  approved: boolean; setApproved: (b: boolean) => void
  reminded: Record<string, string>; setReminded: (r: Record<string, string>) => void
  setToast: (t: Toast) => void
  sort: 'days' | 'amount'; setSort: (s: 'days' | 'amount') => void
  filter: string; setFilter: (s: string) => void
}

function Dashboard(p: DProps) {
  const { snap, paid, approved } = p
  const open = snap.invoices.filter((i) => !paid.has(i.id))
  const overdue = open.filter((i) => daysBetween(i.due, TODAY) > 0)
  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0)
  const paidNow = snap.invoices.filter((i) => paid.has(i.id)).reduce((s, i) => s + i.amount, 0)
  const cash = snap.cash + paidNow
  const payTotal = payrollTotal(PAYROLL)
  const cashAfterPayroll = approved ? cash : cash - payTotal
  const burn = FIXED_MONTHLY + payTotal
  const runway = cash / burn
  const upcoming = open.filter((i) => daysBetween(i.due, TODAY) <= 0)

  const list = useMemo(() => {
    const q = p.filter.trim().toLowerCase()
    return overdue
      .filter((i) => !q || (i.client + i.project + i.id).toLowerCase().includes(q))
      .sort((a, b) => (p.sort === 'days' ? daysBetween(b.due, TODAY) - daysBetween(a.due, TODAY) : b.amount - a.amount))
  }, [overdue, p.filter, p.sort])

  const markPaid = (i: Invoice) => {
    p.setPaid(new Set(paid).add(i.id))
    p.setToast({ kind: 'ok', text: `${i.id} marked paid. ${money(i.amount)} added to cash.` })
  }

  return (
    <main>
      <section className="kpis" aria-label="Key figures">
        <Kpi label="Cash on hand" value={money(cash)} note={`${snap.accounts.length} accounts · ${money(snap.accounts[1].balance)} is tax reserve`} />
        <Kpi label="Runway" value={`${runway.toFixed(1)} months`} note={`at ${money(burn)}/mo burn`} tone={runway < 4 ? 'warn' : undefined} />
        <Kpi label="Overdue invoices" value={money(overdueTotal)} note={overdue.length ? `${overdue.length} invoices, oldest ${daysBetween(overdue.reduce((a, b) => (a.due < b.due ? a : b)).due, TODAY)} days late` : 'Nothing late'} tone={overdue.length ? 'bad' : 'good'} />
        <Kpi label="Next payroll" value={money(payTotal)} note={`${fmtDate(PAYROLL_DATE)} · ${approved ? 'approved' : 'awaiting approval'}`} tone={approved ? 'good' : undefined} />
      </section>

      <div className="grid">
        <section className="panel wide">
          <h2>Cash, next 13 weeks</h2>
          <p className="muted">Starts at {money(cash)}. Expected receipts are invoices on their due date, plus late ones paid in two weeks at a 70% chance.</p>
          <Forecast start={cash} invoices={open} payroll={payTotal} />
        </section>

        <section className="panel">
          <h2>Payroll · {fmtDate(PAYROLL_DATE)}</h2>
          <ul className="people">
            {PAYROLL.map((r) => (
              <li key={r.name}><span><strong>{r.name}</strong><small>{r.role} · {r.type}</small></span><span className="num">{money(r.gross)}</span></li>
            ))}
          </ul>
          <dl className="sum">
            <div><dt>Employer taxes & benefits</dt><dd className="num">{money(payTotal - PAYROLL.reduce((s, r) => s + r.gross, 0))}</dd></div>
            <div className="total"><dt>Total cost</dt><dd className="num">{money(payTotal)}</dd></div>
            <div><dt>Cash after payroll</dt><dd className={'num' + (cashAfterPayroll < 40000 ? ' bad' : '')}>{money(cash - payTotal)}</dd></div>
          </dl>
          {approved ? (
            <div className="done">Approved. Funds release Friday morning. <button className="link" onClick={() => p.setApproved(false)}>Undo</button></div>
          ) : (
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild><button className="btn primary full">Approve payroll</button></AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="overlay" />
                <AlertDialog.Content className="modal">
                  <AlertDialog.Title>Approve {money(payTotal)} for {fmtDate(PAYROLL_DATE)}?</AlertDialog.Title>
                  <AlertDialog.Description>Pays 6 people. Cash after payroll: {money(cash - payTotal)} ({((cash - payTotal) / burn).toFixed(1)} months of runway).</AlertDialog.Description>
                  <div className="actions">
                    <AlertDialog.Cancel asChild><button className="btn">Not yet</button></AlertDialog.Cancel>
                    <AlertDialog.Action asChild><button className="btn primary" onClick={() => { p.setApproved(true); p.setToast({ kind: 'ok', text: 'Payroll approved for Friday.' }) }}>Approve</button></AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          )}
        </section>

        <section className="panel wide">
          <Tabs.Root defaultValue="overdue">
            <div className="tabbar">
              <Tabs.List className="tabs" aria-label="Invoices">
                <Tabs.Trigger value="overdue">Overdue ({overdue.length})</Tabs.Trigger>
                <Tabs.Trigger value="upcoming">Coming due ({upcoming.length})</Tabs.Trigger>
              </Tabs.List>
            </div>
            <Tabs.Content value="overdue">
              <div className="tools">
                <input className="input" placeholder="Search client or project" aria-label="Search overdue invoices" value={p.filter} onChange={(e) => p.setFilter(e.target.value)} />
                <label className="muted">Sort <select className="input" value={p.sort} onChange={(e) => p.setSort(e.target.value as 'days' | 'amount')}><option value="days">Most days late</option><option value="amount">Largest amount</option></select></label>
              </div>
              {overdue.length === 0 ? (
                <Empty title="Nothing overdue" body="Every invoice is paid or not yet due. Enjoy the quiet Monday." />
              ) : list.length === 0 ? (
                <Empty title="No matches" body={`No overdue invoice matches “${p.filter}”.`} action={<button className="btn" onClick={() => p.setFilter('')}>Clear search</button>} />
              ) : (
                <div className="tablewrap"><table>
                  <thead><tr><th>Client</th><th>Invoice</th><th className="r">Days late</th><th className="r">Amount</th><th><span className="sr">Actions</span></th></tr></thead>
                  <tbody>
                    {list.map((i) => {
                      const d = daysBetween(i.due, TODAY)
                      const last = p.reminded[i.id] ?? i.lastReminder
                      return (
                        <tr key={i.id}>
                          <td><strong>{i.client}</strong><small>{i.project}</small></td>
                          <td><span className="mono">{i.id}</span><small>due {fmtDate(i.due)}{last ? ` · reminded ${fmtDate(last)}` : ' · not reminded'}</small></td>
                          <td className="r"><span className={'pill ' + (d > 30 ? 'bad' : d > 14 ? 'warn' : '')}>{d}</span></td>
                          <td className="r num">{money(i.amount)}</td>
                          <td className="r act">
                            <ReminderDialog inv={i} onSent={() => { p.setReminded({ ...p.reminded, [i.id]: '2026-11-23' }); p.setToast({ kind: 'ok', text: `Reminder sent to ${i.client}.` }) }} />
                            <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger asChild><button className="btn sm" onClick={() => markPaid(i)}>Mark paid</button></Tooltip.Trigger>
                              <Tooltip.Portal><Tooltip.Content className="tip" sideOffset={4}>Payment received</Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table></div>
              )}
            </Tabs.Content>
            <Tabs.Content value="upcoming">
              {upcoming.length === 0 ? <Empty title="Nothing coming due" body="No open invoices with a future due date. Time to send some." /> : (
                <div className="tablewrap"><table>
                  <thead><tr><th>Client</th><th>Invoice</th><th className="r">Due in</th><th className="r">Amount</th></tr></thead>
                  <tbody>{upcoming.map((i) => (
                    <tr key={i.id}><td><strong>{i.client}</strong><small>{i.project}</small></td><td><span className="mono">{i.id}</span></td><td className="r">{-daysBetween(i.due, TODAY)} days</td><td className="r num">{money(i.amount)}</td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </section>
      </div>
    </main>
  )
}

function ReminderDialog({ inv, onSent }: { inv: Invoice; onSent: () => void }) {
  const [openD, setOpenD] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const late = daysBetween(inv.due, TODAY)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (openD) { setErr(''); setMsg(`Hi,\n\nA quick note that invoice ${inv.id} (${money(inv.amount)}, ${inv.project}) was due ${fmtDate(inv.due)} and is now ${late} days past due. Could you let us know when we can expect payment?\n\nThanks so much,\nInes and the studio`) }
  }, [openD, inv, late])
  const send = async () => {
    setBusy(true); setErr('')
    try { await sendReminder(inv); setOpenD(false); onSent() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog.Root open={openD} onOpenChange={setOpenD}>
      <Dialog.Trigger asChild><button className="btn sm">Remind</button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal">
          <Dialog.Title>Remind {inv.client}</Dialog.Title>
          <Dialog.Description>To {inv.contact}</Dialog.Description>
          <textarea className="input area" aria-label="Message" rows={8} value={msg} onChange={(e) => setMsg(e.target.value)} />
          {err && <p className="inline-err" role="alert">{err}</p>}
          <div className="actions">
            <Dialog.Close asChild><button className="btn">Cancel</button></Dialog.Close>
            <button className="btn primary" disabled={busy || !msg.trim()} onClick={send}>{busy ? 'Sending…' : err ? 'Retry' : 'Send reminder'}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'bad' | 'warn' | 'good' }) {
  return <div className={'kpi ' + (tone ?? '')}><span className="label">{label}</span><span className="value">{value}</span><span className="muted">{note}</span></div>
}
function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className="empty"><h3>{title}</h3><p className="muted">{body}</p>{action}</div>
}
function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="kpi"><span className="sk" style={{ width: '50%' }} /><span className="sk lg" /><span className="sk" style={{ width: '70%' }} /></div>)}</div>
      <div className="panel"><span className="sk" style={{ width: '30%' }} /><span className="sk block" /></div>
    </div>
  )
}
