import { Component, Input, ViewEncapsulation, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./disclosure.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-disclosure",
  standalone: true,
  templateUrl: "./disclosure.component.html",
  styleUrl: "./disclosure.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class DisclosureComponent implements AfterViewInit, OnDestroy {
  readonly uid = `fgu-disclosure-${++nextId}`;
  @Input() variant: string = "multiple";
  @Input() open: boolean = false;
  @Input() disabled: boolean = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
