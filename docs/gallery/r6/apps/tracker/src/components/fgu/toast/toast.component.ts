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
  @Input() toasts: readonly { id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void }[] = [];
  @Input() label: string = "Notifications";
  @Output() dismissed = new EventEmitter<string>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }

  onDismiss(event: Event) {
    event.preventDefault();
    this.dismissed.emit((event.target as HTMLElement).dataset["id"] ?? "");
  }
}
