import { Component, Input, ViewEncapsulation, TemplateRef, ElementRef, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { attach } from "./tabs.behaviour.js";

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
export class TabsComponent implements AfterViewInit, OnDestroy {
  readonly uid = `fgu-tabs-${++nextId}`;
  @Input() tabs: string[] = [];
  @Input() label: string | undefined;
  /** Template for each panel: <ng-template let-item let-index="index">. */
  @Input() panel: TemplateRef<{ $implicit: string; index: number }> | undefined;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;

  ngAfterViewInit() {
    this.detach = attach(this.host.nativeElement);
  }
  ngOnDestroy() { this.detach?.(); }
}
