import { Component, Input, ViewEncapsulation, booleanAttribute, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./record-row.behaviour.js";

@Component({
  selector: "fgu-record-row",
  standalone: true,
  templateUrl: "./record-row.component.html",
  styleUrl: "./record-row.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class RecordRowComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "default";
  @Input({ transform: booleanAttribute }) current: boolean = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
