import { Component, Input, ViewEncapsulation, booleanAttribute, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject, OnChanges } from "@angular/core";
import { attach, selectValue } from "./select.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-select",
  standalone: true,
  templateUrl: "./select.component.html",
  styleUrl: "./select.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class SelectComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly uid = `fgu-select-${++nextId}`;
  @Input() variant: string = "listbox";
  @Input() options: readonly { value: string; label: string; disabled?: boolean }[] = [];
  @Input() value: string | undefined;
  @Input() label: string | undefined;
  @Input({ transform: booleanAttribute }) hideLabel: boolean = false;
  @Input() placeholder: string | undefined;
  @Input() name: string | undefined;
  @Input({ transform: booleanAttribute }) searchable: boolean = false;
  @Input() emptyText: string = "No matches";
  @Input({ transform: booleanAttribute }) invalid: boolean = false;
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
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
    if (root && this.value !== undefined) selectValue(root, this.value);
  }

  onSelectchange(event: Event) {
    this.valueChange.emit((event as CustomEvent<string>).detail);
  }
}
