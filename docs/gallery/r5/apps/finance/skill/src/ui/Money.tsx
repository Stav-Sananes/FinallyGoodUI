import { money } from "../lib/format";

/** A money figure: tabular numerals, true minus. */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`fig ${className}`}>{money(value)}</span>;
}
