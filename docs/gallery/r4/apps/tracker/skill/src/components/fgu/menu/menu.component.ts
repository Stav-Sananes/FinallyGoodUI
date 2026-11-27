import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from "@angular/core";
import { attach } from "./menu.behaviour.js";

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly mark?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: "fgu-menu",
  standalone: true,
  templateUrl: "./menu.component.html",
  styleUrl: "./menu.css",
})
export class MenuComponent implements AfterViewInit, OnDestroy {
  @Input() items: readonly MenuItem[] = [];
  @Input() current: string | null = null;
  @Input() label = "";
  @Output() picked = new EventEmitter<string>();
  @ViewChild("list", { static: true }) private list!: ElementRef<HTMLElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  /** Opens the list the way the trigger does; the shared behaviour moves focus into it. */
  open(): void {
    this.list.nativeElement.showPopover();
  }

  ngAfterViewInit() { this.detach = attach(this.host.nativeElement); }
  ngOnDestroy() { this.detach?.(); }
}
