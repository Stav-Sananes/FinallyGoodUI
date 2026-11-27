import { Component, Input, ViewEncapsulation, numberAttribute, Output, EventEmitter, TemplateRef, ElementRef, AfterViewInit, OnDestroy, inject, OnChanges } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { attach, selectTab } from "./tabs.behaviour.js";

let nextId = 0;

@Component({
  selector: "fgu-tabs",
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: "./tabs.component.html",
  styleUrl: "./tabs.css",
  // The css is already scoped by data-fgu, and projected content has to be styled too.
  encapsulation: ViewEncapsulation.None,
  host: { style: "display: contents" },
})
export class TabsComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly uid = `fgu-tabs-${++nextId}`;
  @Input() tabs: readonly string[] = [];
  @Input() label: string | undefined;
  @Input({ transform: numberAttribute }) selected: number | undefined;
  /** Template for each panel: <ng-template let-item let-index="index">. */
  @Input() panel: TemplateRef<{ $implicit: string; index: number }> | null = null;
  @Output() selectedChange = new EventEmitter<number>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
    this.syncControlled();
  }
  ngOnDestroy() { this.detach?.(); }
  ngOnChanges() { this.syncControlled(); }
  private syncControlled() {
    if (!this.detach) return;
    const root = this.host.nativeElement.querySelector<HTMLElement>('[data-part="root"]');
    if (root && this.selected !== undefined) selectTab(root, this.selected);
  }

  onTabchange(event: Event) {
    this.selectedChange.emit((event as CustomEvent<number>).detail);
  }
}
