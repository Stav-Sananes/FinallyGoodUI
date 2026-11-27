import type { ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import "./menu.css";

export type MenuItem = { label: string; onSelect: () => void; disabled?: boolean; separatorBefore?: boolean };
export type MenuProps = { label: ReactNode; items: MenuItem[]; align?: "start" | "end"; triggerProps?: { "aria-label"?: string } };

/** Radix DropdownMenu owns open state, roving focus, typeahead, Escape and focus return; parts and tokens are the spec's. */
export function Menu({ label, items, align = "end", triggerProps }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <span data-part="root" data-c="menu">
        <DropdownMenu.Trigger data-part="trigger" data-c="menu" {...triggerProps}>{label}</DropdownMenu.Trigger>
      </span>
      <DropdownMenu.Portal>
        <DropdownMenu.Content role="menu" data-part="list" data-c="menu" align={align} sideOffset={6} collisionPadding={12}>
          {items.map((it) => (
            <span key={it.label}>
              {it.separatorBefore ? <DropdownMenu.Separator data-part="separator" data-c="menu" /> : null}
              <DropdownMenu.Item data-part="item" data-c="menu" disabled={it.disabled} aria-disabled={it.disabled ? "true" : undefined} onSelect={it.onSelect}>{it.label}</DropdownMenu.Item>
            </span>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
