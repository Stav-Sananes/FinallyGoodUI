import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Tabs as RadixTabs } from "radix-ui";
import "./tabs.css";

export type TabItem = { value: string; label: ReactNode; panel: ReactNode };

export type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  label: string;
};

/** Radix Tabs supplies roles, roving tabindex, arrows/Home/End and selection-follows-focus; the markup keeps the spec's parts. */
export function Tabs({ items, value, onValueChange, label }: TabsProps) {
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = () => {
      const tab = el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab) return;
      el.style.setProperty("--indicator-x", `${tab.offsetLeft}px`);
      el.style.setProperty("--indicator-scale", String(tab.offsetWidth / el.offsetWidth));
      el.setAttribute("data-ready", "");
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, items.length]);

  return (
    <RadixTabs.Root data-part="root" data-c="tabs" value={value} onValueChange={onValueChange} activationMode="automatic">
      <RadixTabs.List role="tablist" ref={list} data-part="list" data-c="tabs" aria-label={label}>
        {items.map((it) => (
          <RadixTabs.Trigger key={it.value} value={it.value} data-part="tab" data-c="tabs">{it.label}</RadixTabs.Trigger>
        ))}
        <span data-part="indicator" data-c="tabs" aria-hidden="true"></span>
      </RadixTabs.List>
      {items.map((it) => (
        <RadixTabs.Content key={it.value} value={it.value} data-part="panel" data-c="tabs">{it.panel}</RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
