import { Component, Input, ViewEncapsulation, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./toggle.behaviour.js";

@Component({
  selector: "fgu-toggle",
  standalone: true,
  templateUrl: "./toggle.component.html",
  styleUrl: "./toggle.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class ToggleComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "checkbox";
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
