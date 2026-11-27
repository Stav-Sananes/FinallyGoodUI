import { Injectable, signal } from '@angular/core';

type Scheme = 'light' | 'dark';
const KEY = 'pigeonhole-theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  readonly scheme = signal<Scheme>(this.initial());

  toggle(): void {
    const next: Scheme = this.scheme() === 'dark' ? 'light' : 'dark';
    this.scheme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }

  private initial(): Scheme {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
