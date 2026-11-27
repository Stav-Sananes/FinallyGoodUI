import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useBooks, overdueOf } from "../store";
import { HORIZON_DAYS, PAYROLL_TOTAL, SCENARIOS, TODAY, TODAY_DAY, fromDay, nextPayday, runwayWeeks, openingCash } from "../model";
import type { CashEvent, Scenario } from "../model";
import { dayLabel, money, moneyShort, shortDate, plural } from "../format";
import { useSize } from "./useSize";

const WEEKS = HORIZON_DAYS / 7;

export function Planner() {
  const { invoices, scenario, setScenario, projection } = useBooks();
  const [wrap, size] = useSize<HTMLDivElement>();
  const paydayIdx = nextPayday().day - TODAY_DAY;
  const [cursor, setCursor] = useState(paydayIdx);
  const hit = useRef<HTMLDivElement>(null);

  const overdue = overdueOf(invoices);
  const overdueSum = overdue.reduce((n, i) => n + i.amount, 0);
  const weeks = runwayWeeks(projection);
  const runOutIso = projection.runwayDays === null ? null : fromDay(TODAY_DAY + projection.runwayDays);
  const bank = openingCash(invoices);

  const compact = size.w < 560;
  const W = size.w, H = size.h;
  const pad = { l: compact ? 40 : 52, r: compact ? 12 : 20, t: 34, b: 10 };
  const laneH = compact ? 76 : 92;
  const plotW = Math.max(W - pad.l - pad.r, 10);
  const plotTop = pad.t;
  const plotBottom = Math.max(H - pad.b - laneH, plotTop + 40);
  const laneMid = plotBottom + laneH * 0.52;
  const ymin = -20000;
  const ymax = useMemo(() => Math.ceil((Math.max(...projection.balances, bank) * 1.1) / 25000) * 25000, [projection, bank]);
  const x = (i: number) => pad.l + (i / HORIZON_DAYS) * plotW;
  const y = (v: number) => plotTop + (1 - (v - ymin) / (ymax - ymin)) * (plotBottom - plotTop);
  const y0 = y(0);

  const line = useMemo(() => {
    if (!W) return "";
    let d = "";
    projection.balances.forEach((b, i) => {
      const px = x(i), py = Math.min(Math.max(y(b), plotTop), plotBottom);
      d += i === 0 ? `M${px.toFixed(1)} ${py.toFixed(1)}` : `H${px.toFixed(1)}V${py.toFixed(1)}`;
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projection, W, H]);

  const ticks: number[] = [];
  for (let v = 0; v <= ymax; v += ymax > 120000 ? 50000 : 25000) ticks.push(v);

  const bal = projection.balances[cursor] ?? 0;
  const cursorIso = fromDay(TODAY_DAY + cursor);
  const dayEvents = projection.events.filter((e) => e.day === TODAY_DAY + cursor);
  const nearEvents = dayEvents.length ? dayEvents : [];

  const setFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = hit.current?.getBoundingClientRect();
    if (!r || !plotW) return;
    const frac = (e.clientX - r.left - pad.l) / plotW;
    setCursor(Math.min(HORIZON_DAYS, Math.max(0, Math.round(frac * HORIZON_DAYS))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 7 : 1;
    const keys: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 7, PageDown: -7 };
    if (e.key in keys) { e.preventDefault(); setCursor((c) => Math.min(HORIZON_DAYS, Math.max(0, c + keys[e.key]))); }
    else if (e.key === "Home") { e.preventDefault(); setCursor(0); }
    else if (e.key === "End") { e.preventDefault(); setCursor(HORIZON_DAYS); }
    else if (e.key === "p" || e.key === "P") { e.preventDefault(); setCursor(paydayIdx); }
  };

  // event glyphs in the lane: slips up for cash in, bars down for cash out
  const evW = compact ? 6 : 10;
  const glyphs = projection.events.filter((e) => e.kind !== "invoice" || e.amount > 0);
  const stuck = scenario === "never" ? overdue : [];

  const headline = weeks === null ? `${WEEKS}+` : String(weeks);
  const scenarioWords = SCENARIOS.find((s) => s.id === scenario)?.label.toLowerCase() ?? "";
  const verdict =
    weeks === null
      ? "The known money covers every week on this sheet."
      : `Cash runs out around ${dayLabel(runOutIso ?? TODAY)}${overdue.length ? `, if the ${plural(overdue.length, "overdue invoice")} (${money(overdueSum)}) land ${scenario === "never" ? "never" : scenarioWords}` : ""}.`;

  return (
    <section className="planner" aria-labelledby="planner-title" data-fgu-signature="runway-planner" data-screen="monday">
      <span className="reg reg-tl" aria-hidden="true" /><span className="reg reg-tr" aria-hidden="true" />
      <div className="pl-top">
        <p className="eyebrow" id="planner-title">Runway</p>
        <p className="figure" key={headline + scenario} aria-label={weeks === null ? `${WEEKS} weeks or more` : plural(weeks, "week")}>
          <span className="figure-num">{headline}</span><span className="figure-unit">wks</span>
        </p>
        <p className="verdict">{verdict}</p>
      </div>
      <fieldset className="whatif pl-whatif">
        <legend>Overdue invoices land</legend>
        <div className="segments" role="radiogroup" aria-label="When overdue invoices land">
          {SCENARIOS.map((s) => (
            <label key={s.id} className="segment">
              <input type="radio" name="whatif" value={s.id} checked={scenario === s.id} onChange={() => setScenario(s.id as Scenario)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <dl className="bank pl-bank">
        <div><dt>In the bank today</dt><dd className="num">{money(bank)}</dd></div>
        <div><dt>Counted</dt><dd>Invoices already sent. New work is not counted.</dd></div>
      </dl>

      <div className="chart pl-chart" ref={wrap}>
          {W > 0 && (
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
              <defs>
                <clipPath id="clip-pos"><rect x={pad.l} y={plotTop} width={plotW} height={Math.max(y0 - plotTop, 0)} /></clipPath>
                <clipPath id="clip-neg"><rect x={pad.l} y={y0} width={plotW} height={Math.max(plotBottom - y0, 0)} /></clipPath>
              </defs>
              {/* week gutters */}
              {Array.from({ length: WEEKS }, (_, w) => (
                <rect key={w} className={w % 2 ? "wk wk-odd" : "wk"} x={x(w * 7)} y={plotTop} width={plotW / WEEKS} height={plotBottom - plotTop + laneH} />
              ))}
              {/* perforation: a pin hole at every week boundary, a date every other (every fourth on a phone) */}
              {Array.from({ length: WEEKS + 1 }, (_, w) => <circle key={w} className="pin" cx={x(w * 7)} cy={8} r={2} />)}
              {Array.from({ length: WEEKS }, (_, w) => ((compact ? w % 4 === 0 : w % 2 === 0) ? (
                <text key={w} className="axis-label" x={x(w * 7) + 3} y={26}>{shortDate(fromDay(TODAY_DAY + w * 7))}</text>
              ) : null))}
              {ticks.map((v) => (
                <g key={v}>
                  <line className={v === 0 ? "zero" : "grid"} x1={pad.l} x2={pad.l + plotW} y1={y(v)} y2={y(v)} />
                  <text className="axis-label" x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v === 0 ? "£0" : moneyShort(v).replace(".0", "")}</text>
                </g>
              ))}
              {/* one payroll floor */}
              <line className="floor" x1={pad.l} x2={pad.l + plotW} y1={y(PAYROLL_TOTAL)} y2={y(PAYROLL_TOTAL)} />
              <text className="floor-label" x={pad.l + plotW - 4} y={y(PAYROLL_TOTAL) - 5} textAnchor="end">one payroll {money(PAYROLL_TOTAL)}</text>

              <g className="ink-in" key={scenario + ":" + invoices.filter((i) => i.paidOn === TODAY).length}>
                <path className="area-pos" d={`${line}V${y0}H${pad.l}Z`} clipPath="url(#clip-pos)" />
                <path className="area-neg" d={`${line}V${y0}H${pad.l}Z`} clipPath="url(#clip-neg)" />
                <path className="balance" d={line} />
                {projection.events.filter((e) => e.kind === "payroll").map((e) => {
                  const i = e.day - TODAY_DAY;
                  const py = Math.min(Math.max(y(projection.balances[i]), plotTop), plotBottom);
                  return <g key={e.day}><line className="pay-rule" x1={x(i)} x2={x(i)} y1={plotTop} y2={py} /><rect className="pay-stamp" x={x(i) - 5} y={py - 5} width={10} height={10} /></g>;
                })}
                {projection.runwayDays !== null && (
                  <g>
                    <line className="out-rule" x1={x(projection.runwayDays)} x2={x(projection.runwayDays)} y1={plotTop} y2={plotBottom} />
                    <circle className="out-dot" cx={x(projection.runwayDays)} cy={y0} r={6} />
                    <text className="out-label" x={x(projection.runwayDays) - 8} y={plotTop + 46} textAnchor="end">Cash out {shortDate(fromDay(TODAY_DAY + projection.runwayDays))}</text>
                  </g>
                )}
              </g>

              {/* today */}
              <line className="today-rule" x1={pad.l} x2={pad.l} y1={plotTop} y2={plotBottom + laneH} />
              <g transform={`translate(${pad.l + 6} ${plotTop + 4})`}><rect className="today-stamp" width={compact ? 46 : 52} height={20} /><text className="today-text" x={compact ? 23 : 26} y={14} textAnchor="middle">TODAY</text></g>

              {/* lane: slips come in, bars go out */}
              <line className="lane-axis" x1={pad.l} x2={pad.l + plotW} y1={laneMid} y2={laneMid} />
              <text className="axis-label" x={pad.l - 6} y={laneMid - 14} textAnchor="end">in</text>
              <text className="axis-label" x={pad.l - 6} y={laneMid + 22} textAnchor="end">out</text>
              {glyphs.map((e: CashEvent, k) => {
                const i = e.day - TODAY_DAY;
                const sibling = glyphs.slice(0, k).filter((o) => o.day === e.day && Math.sign(o.amount) === Math.sign(e.amount)).length;
                const gx = x(i) - evW / 2 + sibling * (evW + 1);
                if (e.amount > 0) {
                  const h = Math.max(Math.min((e.amount / 9600) * laneH * 0.44, laneH * 0.46), 5);
                  const late = overdue.some((o) => o.id === e.ref);
                  return <rect key={k} className={late ? "slip slip-late" : "slip"} x={gx} y={laneMid - 2 - h} width={evW} height={h} />;
                }
                const h = Math.max(Math.min((-e.amount / PAYROLL_TOTAL) * laneH * 0.4, laneH * 0.44), 3);
                return <rect key={k} className={e.kind === "payroll" ? "bar bar-pay" : "bar"} x={gx} y={laneMid + 2} width={evW} height={h} />;
              })}
              {stuck.map((inv, k) => <rect key={inv.id} className="slip slip-stuck" x={pad.l + 4 + k * (evW + 3)} y={laneMid - 2 - Math.max((inv.amount / 9600) * laneH * 0.44, 5)} width={evW} height={Math.max((inv.amount / 9600) * laneH * 0.44, 5)} />)}

              {/* cursor */}
              <line className="cursor-rule" x1={x(cursor)} x2={x(cursor)} y1={plotTop} y2={plotBottom + laneH} />
              <circle className="cursor-dot" cx={x(cursor)} cy={Math.min(Math.max(y(bal), plotTop), plotBottom)} r={5} />
            </svg>
          )}
          <div
            ref={hit}
            className="hit"
            role="slider"
            tabIndex={0}
            aria-label="Cash on a date. Arrow keys move one day, Shift and arrows one week, P jumps to payday"
            aria-valuemin={0}
            aria-valuemax={HORIZON_DAYS}
            aria-valuenow={cursor}
            aria-valuetext={`${dayLabel(cursorIso)}, ${money(bal)}`}
            onPointerDown={(e) => { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); setFromPointer(e); }}
            onPointerMove={(e) => { if (e.pointerType === "mouse" || e.buttons) setFromPointer(e); }}
            onKeyDown={onKey}
          />
      </div>

      <div className="readout pl-readout">
          <p className="readout-date">{dayLabel(cursorIso)}</p>
          <p className="readout-bal num" data-low={bal < PAYROLL_TOTAL ? "" : undefined}>{money(bal)}</p>
          <ul className="readout-events">
            {nearEvents.length === 0 && <li className="muted">No money moves on this day.</li>}
            {nearEvents.map((e, k) => <li key={k}><span>{e.label}</span><span className="num">{e.amount > 0 ? "+" : ""}{money(e.amount)}</span></li>)}
          </ul>
          <button type="button" className="link-btn" onClick={() => setCursor(paydayIdx)}>Back to payday</button>
      </div>
    </section>
  );
}
