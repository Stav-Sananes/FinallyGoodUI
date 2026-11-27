import { Component, Input, ViewEncapsulation, booleanAttribute, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject, OnChanges } from "@angular/core";
import { attach, syncSelection } from "./table.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-table",
  standalone: true,
  templateUrl: "./table.component.html",
  styleUrl: "./table.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class TableComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly uid = `fgu-table-${++nextId}`;
  @Input() columns: readonly { key: string; label: string; sortable?: boolean; align?: "start" | "end" }[] = [];
  @Input() rows: readonly { id: string; [key: string]: string | number | undefined }[] = [];
  @Input() caption: string | undefined;
  @Input() sort: string | undefined;
  @Input({ transform: booleanAttribute }) selectable: boolean = false;
  @Input() selected: readonly string[] = [];
  @Input({ transform: booleanAttribute }) loading: boolean = false;
  @Input({ transform: booleanAttribute }) sticky: boolean = false;
  @Input() emptyText: string = "No rows";
  @Input() loadingText: string = "Loading";
  @Output() sortChange = new EventEmitter<string>();
  @Output() selectedChange = new EventEmitter<string[]>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
    this.syncControlled();
  }
  ngOnDestroy() { this.detach?.(); }
  ngOnChanges() { this.syncControlled(); }
  private syncControlled() {
    if (!this.detach) return;
    const root = this.host.nativeElement.querySelector<HTMLElement>('[data-part="root"]');
    if (root && this.selected !== undefined) syncSelection(root, this.selected);
  }

  onSortchange(event: Event) {
    this.sortChange.emit((event as CustomEvent<string>).detail);
  }

  onSelectionchange(event: Event) {
    this.selectedChange.emit((event as CustomEvent<string[]>).detail);
  }
}
