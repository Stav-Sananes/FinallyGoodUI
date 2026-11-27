import { Injectable } from '@angular/core';

export type KeyHandler = (e: KeyboardEvent) => boolean;

/** The current page registers one handler; the shell offers every keydown to it first. */
@Injectable({ providedIn: 'root' })
export class Hotkeys {
  private page: KeyHandler | null = null;

  register(handler: KeyHandler): () => void {
    this.page = handler;
    return () => {
      if (this.page === handler) this.page = null;
    };
  }

  offer(e: KeyboardEvent): boolean {
    return this.page ? this.page(e) : false;
  }
}
