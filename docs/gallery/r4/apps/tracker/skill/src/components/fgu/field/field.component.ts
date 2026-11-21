import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from "@angular/core";
import { attach } from "./field.behaviour.js";

@Component({
  selector: "fgu-field",
  standalone: true,
  templateUrl: "./field.component.html",
  styleUrl: "./field.css",
})
export class FieldComponent implements AfterViewInit, OnDestroy {
  @Input() variant: string = "stacked";
  @Input() label: string | undefined;
  @Input() hint: string | undefined;
  @Input() invalid: boolean = false;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() value = "";
  @Input() autofocus = false;
  @Input() inputType = "text";
  @Input() name = "";
  @Input() placeholder = "";
  @Input() minLength: number | null = null;
  @Input() messageMissing = "";
  @Input() messageTooShort = "";
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild("control", { static: true }) private control!: ElementRef<HTMLInputElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  focus(): void { this.control.nativeElement.focus(); }

  /** Shows the control's current validity now (used when a form is submitted before the field was touched). */
  validate(): boolean {
    const el = this.control.nativeElement;
    el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    return el.checkValidity();
  }

  ngAfterViewInit() { this.detach = attach(this.host.nativeElement); }
  ngOnDestroy() { this.detach?.(); }
}
