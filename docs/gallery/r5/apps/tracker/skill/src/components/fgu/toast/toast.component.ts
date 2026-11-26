import { Component, Input, ViewEncapsulation, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./toast.behaviour.js";

@Component({
  selector: "fgu-toast",
  standalone: true,
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class ToastComponent implements AfterViewInit, OnDestroy {
  @Input() toasts: { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (toast: { id: string }) => void }[] = [];
  @Input() label: string = "Notifications";
  /** Emits the toast id when one leaves: remove it from `toasts`. */
  @Output() dismissed = new EventEmitter<string>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }

  // A leaving toast fires a cancelable `dismiss`; keep the node and hand the id to the parent, which owns the list.
  onDismiss(event: Event) {
    event.preventDefault();
    this.dismissed.emit((event.target as HTMLElement).dataset["id"] ?? "");
  }
}
