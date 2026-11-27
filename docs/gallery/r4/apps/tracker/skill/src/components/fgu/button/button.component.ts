import { Component, Input, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./button.behaviour.js";

@Component({
  selector: "fgu-button",
  standalone: true,
  templateUrl: "./button.component.html",
  styleUrl: "./button.css",
})
export class ButtonComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "primary";
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() type: string = "button";
  @Input() dialogOpen: string | null = null;
  @Input() ariaLabel: string | null = null;
  @Input() ariaKeyshortcuts: string | null = null;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() { this.detach = attach(this.host.nativeElement); }
  ngOnDestroy() { this.detach?.(); }
}
