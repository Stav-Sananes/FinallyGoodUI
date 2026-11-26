import { Component, Input, ViewEncapsulation, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./button.behaviour.js";

@Component({
  selector: "fgu-button",
  standalone: true,
  templateUrl: "./button.component.html",
  styleUrl: "./button.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class ButtonComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "primary";
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() type: string = "button";
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
