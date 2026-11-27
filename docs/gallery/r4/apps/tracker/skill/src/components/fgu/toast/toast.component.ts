import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, inject } from "@angular/core";
import { attach } from "./toast.behaviour.js";

export interface ToastItem {
  readonly id: number;
  readonly text: string;
  readonly variant: "status" | "error";
  readonly actionLabel?: string;
  readonly timeoutMs?: number;
}

@Component({
  selector: "fgu-toast",
  standalone: true,
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.css",
})
export class ToastComponent implements AfterViewInit, OnDestroy {
  @Input() toasts: readonly ToastItem[] = [];
  @Output() actionPressed = new EventEmitter<number>();
  @Output() dismissed = new EventEmitter<number>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  /** The behaviour fires a cancelable `dismiss` after its exit animation; the app owns the list, so it drops the toast. */
  drop(event: Event, id: number) {
    event.preventDefault();
    this.dismissed.emit(id);
  }

  ngAfterViewInit() { this.detach = attach(this.host.nativeElement); }
  ngOnDestroy() { this.detach?.(); }
}
