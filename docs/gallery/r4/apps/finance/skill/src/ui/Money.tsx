import { money } from "../lib/format";

/** Whole dollars with the symbol set quiet, tabular figures and a true minus. */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  const text = money(Math.abs(value));
  return (
    <span className={`money ${className}`}>
      {value < 0 ? <span className="money-sign">{"−"}</span> : null}
      <span className="money-cur">{text.slice(0, 1)}</span>
      {text.slice(1)}
    </span>
  );
}
