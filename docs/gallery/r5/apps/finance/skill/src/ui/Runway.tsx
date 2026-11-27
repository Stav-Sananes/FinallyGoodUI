import { useId, type CSSProperties } from "react";
import type { Forecast } from "../lib/forecast";
import { moneyShort, shortDate } from "../lib/format";

/** The staff: twelve month marks like a tide gauge, filled to the runway. */
export function Staff({ months, open }: { months: number | null; open: boolean }) {
  const filled = months === null ? 12 : Math.min(12, months);
  return (
    <div className="staff" role="img" aria-label={months === null ? "Cash lasts the full twelve months shown" : `Cash lasts ${months.toFixed(1)} of twelve months shown`}>
      <div className="staff-bar">
        <div className={`staff-water ${open ? "signature-rise" : ""}`} style={{ inlineSize: `${(filled / 12) * 100}%` }} />
        {Array.from({ length: 11 }, (_, i) => <span key={i} className="staff-tick" style={{ insetInlineStart: `${((i + 1) / 12) * 100}%` }} />)}
      </div>
      <div className="staff-legend" aria-hidden="true"><span>Today</span><span>6 months</span><span>12 months</span></div>
    </div>
  );
}

const W = 720, H = 280, PX = 12, PT = 28, PB = 34;

/** Month-end cash for the next twelve months as a tide curve; the dashed line at zero is dry dock. */
export function TideCurve({ forecast, startCash, ghost, open }: { forecast: Forecast; startCash: number; ghost?: Forecast; open: boolean }) {
  const uid = useId().replace(/:/g, "");
  const series = [startCash, ...forecast.months.map((m) => m.balance)];
  const ghostSeries = ghost ? [startCash, ...ghost.months.map((m) => m.balance)] : null;
  const all = [...series, ...(ghostSeries ?? []), 0];
  const hi = Math.max(...all), lo = Math.min(...all);
  const pad = (hi - lo) * 0.08 || 1;
  const top = hi + pad, bottom = lo - pad;
  const x = (i: number) => PX + (i / (series.length - 1)) * (W - PX * 2);
  const y = (v: number) => PT + ((top - v) / (top - bottom)) * (H - PT - PB);
  const y0 = y(0);
  const line = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line(series)} L${x(series.length - 1)} ${y0} L${x(0)} ${y0} Z`;
  const last = series.length - 1;
  const crossing = forecast.zeroDate ? series.findIndex((v, i) => i > 0 && v < 0) : -1;
  const labels = [0, 3, 6, 9, 12].filter((i) => i <= last);
  const desc = forecast.runwayMonths === null
    ? `Month-end cash stays above zero for all twelve months, ending at ${moneyShort(series[last])}.`
    : `Month-end cash falls below zero around ${shortDate(forecast.zeroDate!)}, ending twelve months at ${moneyShort(series[last])}.`;

  return (
    <figure className="tide">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${uid}-t ${uid}-d`} className={open ? "signature-swell" : ""}>
        <title id={`${uid}-t`}>Tide curve: month-end cash, next twelve months</title>
        <desc id={`${uid}-d`}>{desc}</desc>
        <defs>
          <clipPath id={`${uid}-above`}><rect x="0" y="0" width={W} height={y0} /></clipPath>
          <clipPath id={`${uid}-below`}><rect x="0" y={y0} width={W} height={H - y0} /></clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={PX} x2={W - PX} y1={PT + f * (H - PT - PB)} y2={PT + f * (H - PT - PB)} className="tide-grid" />)}
        <g className="tide-water">
          <path d={area} className="tide-fill" clipPath={`url(#${uid}-above)`} />
          <path d={area} className="tide-fill tide-fill-neg" clipPath={`url(#${uid}-below)`} />
          {ghostSeries && <path d={line(ghostSeries)} className="tide-ghost" />}
          <path d={line(series)} className="tide-line" />
        </g>
        <line x1={PX} x2={W - PX} y1={y0} y2={y0} className="tide-dry" />
        <text x={W - PX} y={y0 - 6} textAnchor="end" className="tide-label">Dry dock: $0</text>
        {crossing > 0 && <circle cx={x(crossing)} cy={y0} r="5" className="tide-mark" />}
        <circle cx={x(0)} cy={y(series[0])} r="4.5" className="tide-dot" />
        <text x={x(0) + 8} y={y(series[0]) - 10} className="tide-label tide-label-strong">{moneyShort(series[0])}</text>
        <circle cx={x(last)} cy={y(series[last])} r="4.5" className="tide-dot" />
        <text x={x(last) - 8} y={y(series[last]) + (series[last] < 0 ? 22 : -12)} textAnchor="end" className="tide-label tide-label-strong">{moneyShort(series[last])}</text>
        {labels.map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="tide-axis">{i === 0 ? "Today" : forecast.months[i - 1].label}</text>
        ))}
      </svg>
      <figcaption className="tide-note" style={{ "--n": 1 } as CSSProperties}>
        Month-end cash, counted accounts only. Invoices land on their due date, overdue ones are left out, and no new work is assumed.
        {ghostSeries ? " The dotted line is the same tide if the overdue invoices arrive within 14 days." : ""}
      </figcaption>
    </figure>
  );
}
