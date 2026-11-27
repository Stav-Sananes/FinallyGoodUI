import { Component, Input, ViewEncapsulation, booleanAttribute, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
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
  @Input({ transform: booleanAttribute }) checked: boolean = false;
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input({ transform: booleanAttribute }) invalid: boolean = false;
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  @Output() checkedChange = new EventEmitter<boolean>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }

  onCheckedChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(this.checked);
  }
}
