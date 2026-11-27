import { Component, Input, ViewEncapsulation, booleanAttribute, numberAttribute, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
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
  @Input({ transform: booleanAttribute }) invalid: boolean = false;
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input({ transform: booleanAttribute }) required: boolean = false;
  @Input() type: string = "text";
  @Input() name: string | undefined;
  @Input({ alias: "controlId" }) controlId: string | undefined;
  @Input() placeholder: string | undefined;
  @Input() autocomplete: AutoFill | undefined;
  @Input({ transform: numberAttribute }) rows: number | undefined;
  @Input({ transform: booleanAttribute }) multiline: boolean = false;
  @Input() value: string | undefined;
  @Output() valueChange = new EventEmitter<string>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }

  onValueInput(event: Event) {
    this.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.valueChange.emit(this.value);
  }
}
