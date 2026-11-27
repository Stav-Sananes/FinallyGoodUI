import { AfterViewInit, Component, ContentChild, ElementRef, EventEmitter, Input, OnDestroy, Output, TemplateRef, inject } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { attach } from "./tabs.behaviour.js";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

@Component({
  selector: "fgu-tabs",
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: "./tabs.component.html",
  styleUrl: "./tabs.css",
})
export class TabsComponent implements AfterViewInit, OnDestroy {
  @Input() tabs: readonly TabItem[] = [];
  @Input() selected = "";
  @Input() label = "";
  @Output() selectedChange = new EventEmitter<string>();
  @ContentChild(TemplateRef) panel?: TemplateRef<{ $implicit: TabItem }>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detach?: () => void;
  private watcher?: MutationObserver;

  ngAfterViewInit() {
    const el = this.host.nativeElement;
    this.detach = attach(el);
    // The shared behaviour owns selection (click, arrows, Home/End); report it to the app.
    this.watcher = new MutationObserver(() => {
      const id = el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.dataset["tabId"];
      if (id && id !== this.selected) this.selectedChange.emit(id);
    });
    this.watcher.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
  }
  ngOnDestroy() { this.detach?.(); this.watcher?.disconnect(); }
}
