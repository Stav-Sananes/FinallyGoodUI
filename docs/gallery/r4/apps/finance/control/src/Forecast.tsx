import { TODAY, FIXED_MONTHLY, daysBetween, money, type Invoice } from './data'

export function Forecast({ start, invoices, payroll }: { start: number; invoices: Invoice[]; payroll: number }) {
  const weeks = 13
  const pts: number[] = [start]
  let bal = start
  for (let w = 1; w <= weeks; w++) {
    const from = (w - 1) * 7, to = w * 7
    let delta = -(FIXED_MONTHLY * 12) / 52
    for (const i of invoices) {
      const d = -daysBetween(i.due, TODAY) // days until due (negative = late)
      const expect = d < 0 ? 14 : d
      const p = d < 0 ? 0.7 : 1
      if (expect >= from && expect < to) delta += i.amount * p
    }
    // payroll every two weeks starting this Friday (day 4), approx: monthly payroll split to weeks
    delta -= (payroll * 12) / 52
    bal += delta
    pts.push(bal)
  }
  const W = 720, H = 220, L = 52, B = 26, T = 10
  const max = Math.max(...pts, start) * 1.08, min = Math.min(0, ...pts)
  const x = (i: number) => L + (i / weeks) * (W - L - 8)
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B)
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lowIdx = pts.indexOf(Math.min(...pts))
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min))
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Projected cash falls from ${money(start)} to ${money(pts[weeks])} over 13 weeks`}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} className="gl" /><text x={L - 8} y={y(t) + 4} textAnchor="end" className="axis">{money(t / 1000)}k</text></g>)}
        <path d={`${path} L${x(weeks)},${y(min)} L${x(0)},${y(min)} Z`} className="area" />
        <path d={path} className="line" />
        {[0, 4, 8, 13].map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="axis">{i === 0 ? 'Now' : `Wk ${i}`}</text>)}
        <circle cx={x(lowIdx)} cy={y(pts[lowIdx])} r="4.5" className="dot" />
      </svg>
      <figcaption className="muted">Week 13 projected balance: <strong>{money(pts[weeks])}</strong>. Lowest point {money(pts[lowIdx])} {lowIdx === 0 ? 'is today.' : `in week ${lowIdx}.`}</figcaption>
    </figure>
  )
}
