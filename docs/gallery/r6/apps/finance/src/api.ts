import { INVOICES } from "./model";
import type { Invoice } from "./model";

export type ForcedState = "loading" | "empty" | "error" | null;
export const forcedState = (): ForcedState => {
  const s = new URLSearchParams(window.location.search).get("state");
  return s === "loading" || s === "empty" || s === "error" ? s : null;
};

/** Stands in for the books service. `?state=loading|empty|error` forces each path. */
export function loadBooks(signal?: AbortSignal): Promise<Invoice[]> {
  const forced = forcedState();
  return new Promise((resolve, reject) => {
    if (forced === "loading") return; // held open on purpose: the loading state stays on screen
    const t = window.setTimeout(() => {
      if (forced === "error") reject(new Error("The books service did not answer."));
      else resolve(forced === "empty" ? [] : INVOICES.map((i) => ({ ...i })));
    }, forced ? 120 : 650);
    signal?.addEventListener("abort", () => window.clearTimeout(t));
  });
}
