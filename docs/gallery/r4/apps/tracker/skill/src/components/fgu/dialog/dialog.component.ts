import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from "@angular/core";
import { attach } from "./dialog.behaviour.js";

@Component({
  selector: "fgu-dialog",
  standalone: true,
  templateUrl: "./dialog.component.html",
  styleUrl: "./dialog.css",
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "modal";
  @Input({ required: true }) dialogId!: string;
  @Input() heading = "";
  @Input() description = "";
  @Output() closed = new EventEmitter<void>();
  @ViewChild("root", { static: true }) private root!: ElementRef<HTMLDialogElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  close(): void { this.root.nativeElement.close(); }

  /** The behaviour finds openers (data-dialog-open) among the root's descendants, so it attaches to the app scope. */
  ngAfterViewInit() {
    const scope = this.host.nativeElement.closest<HTMLElement>("[data-fgu-scope]") ?? this.host.nativeElement;
    this.detach = attach(scope);
  }
  ngOnDestroy() { this.detach?.(); }
}
