import { Component, Input, ViewEncapsulation, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject, OnChanges } from "@angular/core";
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
  @Input() open: boolean = false;
  @Output() closed = new EventEmitter<Event>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
    this.syncOpen();
  }
  ngOnDestroy() { this.detach?.(); }
  ngOnChanges() { this.syncOpen(); }
  private syncOpen() {
    const dialog = this.host.nativeElement.querySelector<HTMLDialogElement>('[data-part="root"]');
    if (!dialog || !this.detach) return;
    if (this.open) openDialog(dialog); else closeDialog(dialog);
  }
}
