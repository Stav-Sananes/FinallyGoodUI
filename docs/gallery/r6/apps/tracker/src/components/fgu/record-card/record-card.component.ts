import { Component, Input, ViewEncapsulation, booleanAttribute, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./record-card.behaviour.js";

@Component({
  selector: "fgu-record-card",
  standalone: true,
  templateUrl: "./record-card.component.html",
  styleUrl: "./record-card.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class RecordCardComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "default";
  @Input({ transform: booleanAttribute }) current: boolean = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
