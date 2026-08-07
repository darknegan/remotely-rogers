import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly badge = input<string>('');
  readonly imageUrl = input<string>('');
  readonly imageAlt = input<string>('');
}
