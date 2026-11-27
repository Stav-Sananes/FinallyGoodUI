// Static twins of the genericness probe (gate G10): the same template tells, read from source.
//   same-card-everywhere  many bordered, rounded (>= 8px) surfaces that share one radius
//   row-menu-button       a repeated row whose only trailing action is a "more" menu
import { cssBlocks, declarations } from "./css.mjs";

export const LOW_AT = 3;
export const MEDIUM_AT = 5;
const LOOP_ROWS = MEDIUM_AT; // a template inside a loop renders as many rows as the data has

const px = (v) => {
  const m = String(v).trim().match(/^(\d*\.?\d+)(px|rem|em)?$/);
  return m ? Number(m[1]) * (m[2] === "px" || !m[2] ? 1 : 16) : null;
};

/** Cards declared in CSS: [{idx, key}] for each rule with an edge and a corner radius >= 8px. */
export function cssCards(css, resolve = (v) => v) {
  const out = [];
  for (const b of cssBlocks(css)) {
    if (/^@/.test(b.prelude)) continue;
    const decl = declarations(b.own);
    const get = (re) => decl.find((d) => re.test(d.prop))?.value;
    const raw = resolve(get(/^border-radius$/) ?? "");
    // An unresolved token counts by its name: radius-lg and up are card corners. Pills (full, 9999px) are not cards.
    const tokenName = raw.match(/^var\(\s*(--[\w-]+)/)?.[1];
    const radius = tokenName ? (/radius-(?:lg|xl|2xl|3xl|card)$/.test(tokenName) ? 12 : null) : px(raw);
    const border = get(/^border(?:-width)?$/) ?? "";
    const edged = border && !/^(none|0|0px)\b/.test(border.trim()) && !/^\s*0(px)?\s+/.test(border);
    if (radius !== null && radius >= 8 && radius <= 48 && edged) out.push({ idx: b.bodyStart, key: tokenName ? tokenName : `r${radius}` });
  }
  return out;
}

const TW_CARD = /class(?:Name)?\s*=\s*["'`{]\s*["'`]?([^"'`}]*)/g;
/** Cards declared as utility classes: [{idx, key}] for each class string with a rounded-lg-or-bigger corner and a border. */
export function utilityCards(markup) {
  const out = [];
  TW_CARD.lastIndex = 0;
  for (let m; (m = TW_CARD.exec(markup)); ) {
    const classes = m[1].split(/\s+/);
    const round = classes.find((c) => /^rounded-(?:lg|xl|2xl|3xl)$/.test(c));
    if (round && classes.includes("border")) out.push({ idx: m.index, key: round });
  }
  return out;
}

/** Largest group of cards sharing a key, with the index of its first member; null below LOW_AT. */
export function sameCardGroup(cards) {
  const groups = new Map();
  for (const c of cards) { const g = groups.get(c.key) ?? { n: 0, idx: c.idx, key: c.key }; g.n++; groups.set(c.key, g); }
  const top = [...groups.values()].sort((a, b) => b.n - a.n)[0];
  return top && top.n >= LOW_AT ? top : null;
}
export const severityFor = (n) => (n >= MEDIUM_AT ? "medium" : "low");

const LOOP = /\bv-for\s*=|\{#each\b|\*ngFor\s*=|@for\s*\(|\.map\s*\(|<For\b|\{\{#each\b/g;
const TRIGGER = /aria-haspopup\s*=\s*["']?(?:menu|true)|aria-label\s*=\s*["'](?:More|Options|Actions|Row actions)\b[^"']*["']|<\s*(?:Menu(?:Button|Trigger)?|DropdownMenu)\b|data-part\s*=\s*["']menu-button["']|>\s*(?:\.\.\.|…|⋯|⋮)\s*</g;
const ITEM = /role\s*=\s*["']menuitem["']|<\s*(?:MenuItem|DropdownMenuItem)\b|data-part\s*=\s*["']item["']/g;
const count = (re, s) => (s.match(re) ?? []).length;

/**
 * Row templates that end in a menu trigger and offer fewer than three menu items.
 * @returns {{rows:number, idx:number}|null} rows = how many rows that is (a loop renders many)
 */
export function rowMenuSites(markup) {
  let rows = 0, first = null;
  const looped = [];
  LOOP.lastIndex = 0;
  for (let m; (m = LOOP.exec(markup)); ) {
    const win = markup.slice(m.index, m.index + 1200);
    if (count(TRIGGER, win) && count(ITEM, win) < 3) { rows += LOOP_ROWS; first ??= m.index; looped.push([m.index, m.index + 1200]); }
  }
  TRIGGER.lastIndex = 0;
  for (let m; (m = TRIGGER.exec(markup)); ) {
    if (looped.some(([a, z]) => m.index >= a && m.index < z)) continue;
    if (count(ITEM, markup.slice(Math.max(0, m.index - 300), m.index + 1200)) >= 3) continue;
    rows++; first ??= m.index;
  }
  return rows ? { rows, idx: first } : null;
}
