import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./tabs.css";
import { attach, selectTab } from "./tabs.behaviour.js";

export type TabsProps = {
  tabs?: string[];
  label?: string;
  selected?: number;
  panel?: (tab: string, index: number) => ReactNode;
  onSelectedChange?: (value: number) => void;
} & Omit<ComponentPropsWithoutRef<"div">, "tabs" | "label" | "selected" | "panel" | "onSelectedChange" | "children">;

export function Tabs({ tabs = [], label, selected, panel, onSelectedChange, ...rest }: TabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  useEffect(() => {
    if (ref.current && selected !== undefined) selectTab(ref.current, selected);
  }, [selected]);
  // tabchange: handed to onSelectedChange.
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const handle = (event: Event) => {
      onSelectedChange?.((event as CustomEvent<number>).detail);
    };
    target.addEventListener("tabchange", handle);
    return () => target.removeEventListener("tabchange", handle);
  }, [onSelectedChange]);
  return (
    <div data-fgu="tabs" data-part="root" ref={ref} {...rest}>
      <div data-part="list" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            data-part="tab"
            type="button"
            role="tab"
            id={uid + '-tab-' + i}
            aria-selected={i === (selected ? selected : 0) ? "true" : "false"}
            aria-controls={uid + '-panel-' + i}
            tabIndex={i === (selected ? selected : 0) ? 0 : -1}
          >{tab}</button>
        ))}
        <span data-part="indicator" aria-hidden="true"></span>
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          data-part="panel"
          id={uid + '-panel-' + i}
          role="tabpanel"
          aria-labelledby={uid + '-tab-' + i}
          tabIndex={0}
          hidden={i !== (selected ? selected : 0)}
        >
          {panel?.(tab, i)}
        </div>
      ))}
    </div>
  );
}
