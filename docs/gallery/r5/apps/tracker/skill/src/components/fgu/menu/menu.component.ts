import { Component, Input, ViewEncapsulation, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { attach } from "./menu.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-menu",
  standalone: true,
  templateUrl: "./menu.component.html",
  styleUrl: "./menu.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class MenuComponent implements AfterViewInit, OnDestroy {
  readonly uid = `fgu-menu-${++nextId}`;
  @Input() items: { label: string; disabled?: boolean; onSelect?: (item: { label: string }) => void }[] = [];
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
