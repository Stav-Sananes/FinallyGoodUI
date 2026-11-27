import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef, useId } from "react";
import "./table.css";
import { attach, syncSelection } from "./table.behaviour.js";

export type TableProps = {
  columns?: { key: string; label: string; sortable?: boolean; align?: "start" | "end" }[];
  rows?: { id: string; [key: string]: string | number | undefined }[];
  caption?: string;
  sort?: string;
  selectable?: boolean;
  selected?: string[];
  loading?: boolean;
  sticky?: boolean;
  emptyText?: string;
  loadingText?: string;
  onSortChange?: (value: string) => void;
  onSelectedChange?: (value: string[]) => void;
} & Omit<ComponentPropsWithoutRef<"div">, "columns" | "rows" | "caption" | "sort" | "selectable" | "selected" | "loading" | "sticky" | "emptyText" | "loadingText" | "onSortChange" | "onSelectedChange" | "children">;

export function Table({ columns = [], rows = [], caption, sort, selectable = false, selected = [], loading = false, sticky = false, emptyText = "No rows", loadingText = "Loading", onSortChange, onSelectedChange, ...rest }: TableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  useEffect(() => {
    if (ref.current && selected !== undefined) syncSelection(ref.current, selected);
  }, [selected]);
  // sortchange: handed to onSortChange.
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const handle = (event: Event) => {
      onSortChange?.((event as CustomEvent<string>).detail);
    };
    target.addEventListener("sortchange", handle);
    return () => target.removeEventListener("sortchange", handle);
  }, [onSortChange]);
  // selectionchange: handed to onSelectedChange.
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const handle = (event: Event) => {
      onSelectedChange?.((event as CustomEvent<string[]>).detail);
    };
    target.addEventListener("selectionchange", handle);
    return () => target.removeEventListener("selectionchange", handle);
  }, [onSelectedChange]);
  return (
    <div
      data-fgu="table"
      data-part="root"
      role="region"
      aria-labelledby={uid + '-caption'}
      tabIndex={0}
      data-sticky={sticky ? '' : undefined}
      aria-busy={loading ? "true" : undefined}
      ref={ref}
      {...rest}
    >
      <table data-part="table">
        <caption data-part="caption" id={uid + '-caption'}>{caption}</caption>
        <thead data-part="head">
          <tr data-part="row">
            {selectable ? (
              <th data-part="header" scope="col">
                <input data-part="select" type="checkbox" aria-label="Select all rows" />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                data-part="header"
                scope="col"
                data-key={col.key}
                data-align={col.align === 'end' ? 'end' : undefined}
                aria-sort={col.sortable ? (sort === col.key + ':ascending' ? 'ascending' : sort === col.key + ':descending' ? 'descending' : 'none') : undefined}
              >
                {col.sortable ? (
                  <button data-part="sort" type="button">{col.label}</button>
                ) : (
                  <span>{col.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-part="body">
          {loading || rows.length === 0 ? (
            <tr data-part="row">
              <td data-part="status" colSpan={columns.length + (selectable ? 1 : 0)} role="status">
                {loading ? loadingText : emptyText}
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr
              key={row.id}
              data-part="row"
              data-row-id={row.id}
              aria-selected={selectable ? (selected.indexOf(row.id) >= 0 ? 'true' : 'false') : undefined}
            >
              {selectable ? (
                <td data-part="cell">
                  <input
                    data-part="select"
                    type="checkbox"
                    aria-label={'Select row ' + row.id}
                    defaultChecked={selected.indexOf(row.id) >= 0}
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td key={col.key} data-part="cell" data-align={col.align === 'end' ? 'end' : undefined}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
