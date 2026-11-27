import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./menu.css";
import { attach } from "./menu.behaviour.js";

export type MenuProps = {
  items?: { label: string; disabled?: boolean; onSelect?: (item: { label: string }) => void }[];
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "items" | "children">;

export function Menu({ items = [], children, ...rest }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  return (
    <div data-fgu="menu" data-part="root" ref={ref} {...rest}>
      <button
        data-part="trigger"
        type="button"
        id={uid + '-trigger'}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls={uid + '-list'}
        {...{ popoverTarget: uid + '-list' }}
      >{children}</button>
      <div data-part="list" id={uid + '-list'} role="menu" aria-labelledby={uid + '-trigger'} {...{ popover: "" }}>
        {items.map((item, i) => (
          <button
            key={i}
            data-part="item"
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled ? "true" : undefined}
            onClick={() => item.onSelect && item.onSelect(item)}
          >{item.label}</button>
        ))}
      </div>
    </div>
  );
}
