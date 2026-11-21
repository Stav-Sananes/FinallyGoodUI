/** The registration mark: a ring and a crosshair, the printer's sign for "lines up". It is this app's motif. */
export function RegistrationMark({ className = "", label }: { className?: string; label?: string }) {
  return (
    <svg className={`regmark ${className}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="16" cy="16" r="7" />
      <path d="M16 2v9M16 21v9M2 16h9M21 16h9" />
    </svg>
  );
}

/** Four process-colour chips: cyan, magenta, yellow, key. The proof sheet's colour bar. */
export function ColourBar({ className = "" }: { className?: string }) {
  return (
    <span className={`colourbar ${className}`} aria-hidden="true">
      <i data-ink="c" /><i data-ink="m" /><i data-ink="y" /><i data-ink="k" />
    </span>
  );
}
