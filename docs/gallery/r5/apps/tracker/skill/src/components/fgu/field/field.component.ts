import { Component, Input, ViewEncapsulation, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./field.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-field",
  standalone: true,
  templateUrl: "./field.component.html",
  styleUrl: "./field.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class FieldComponent implements AfterViewInit, OnDestroy {
  readonly uid = `fgu-field-${++nextId}`;
  @Input() variant: string = "stacked";
  @Input() label: string | undefined;
  @Input() hint: string | undefined;
  @Input() error: string | undefined;
  @Input() invalid: boolean = false;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() type: string = "text";
  @Input() name: string | undefined;
  @Input() id: string | undefined;
  @Input() placeholder: string | undefined;
  @Input() autocomplete: string | undefined;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
