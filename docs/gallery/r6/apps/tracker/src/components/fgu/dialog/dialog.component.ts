import { Component, Input, ViewEncapsulation, booleanAttribute, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject, OnChanges } from "@angular/core";
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-dialog",
  standalone: true,
  templateUrl: "./dialog.component.html",
  styleUrl: "./dialog.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class DialogComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly uid = `fgu-dialog-${++nextId}`;
  @Input() variant: string = "modal";
  @Input({ transform: booleanAttribute }) open: boolean = false;
  @Input() initialFocus: string | undefined;
  @Input({ transform: booleanAttribute }) nativeValidation: boolean = false;
  @Output() openChange = new EventEmitter<boolean>();
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
    const dialog = this.host.nativeElement.querySelector<HTMLDialogElement>('[data-part="root"]');
    if (dialog) { if (this.open) openDialog(dialog); else closeDialog(dialog); }
  }

  onClose() {
    this.openChange.emit(false);
  }
}
