import { Component } from '@angular/core';
import { DeskComponent } from './desk/desk.component';

@Component({
  selector: 'app-root',
  imports: [DeskComponent],
  template: `
    <a class="skip-link" href="#tray">Skip to the tray</a>
    <app-desk />
  `,
})
export class App {}
