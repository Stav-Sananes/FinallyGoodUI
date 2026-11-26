import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useId } from "react";
import "./tabs.css";
import { attach } from "./tabs.behaviour.js";

export type TabsProps = {
  tabs?: string[];
  label?: string;
  panel?: (tab: string, index: number) => ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "tabs" | "label" | "panel" | "children">;

export function Tabs({ tabs = [], label, panel, ...rest }: TabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
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
            aria-selected={i === 0 ? "true" : "false"}
            aria-controls={uid + '-panel-' + i}
            tabIndex={i === 0 ? 0 : -1}
          >
            {tab}
          </button>
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
          hidden={i !== 0}
        >
          {panel?.(tab, i)}
        </div>
      ))}
    </div>
  );
}
