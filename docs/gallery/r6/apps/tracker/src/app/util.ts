const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'short' });

/** "14 min. ago", "3 hr. ago", "2 days ago" from a timestamp. */
export function ago(ts: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - ts) / 60_000));
  if (min < 1) return 'just now';
  if (min < 60) return rtf.format(-min, 'minute');
  const hr = Math.round(min / 60);
  if (hr < 48) return rtf.format(-hr, 'hour');
  return rtf.format(-Math.round(hr / 24), 'day');
}

const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });
export const clock = (ts: number) => time.format(ts);

/** True while the user is typing in a field or a dialog is open: single-key shortcuts stand down. */
export function typing(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (t?.closest('input, textarea, select, [contenteditable="true"], [role="listbox"], [role="combobox"]')) return true;
  return !!document.querySelector('dialog[open]');
}
