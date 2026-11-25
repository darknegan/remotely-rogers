import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-booking-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="rr-booking-progress">
      @for (item of steps; track item.id) {
        <li [class.is-active]="step() === item.id" [class.is-done]="step() > item.id">
          <span>{{ item.id }}</span>
          {{ item.label }}
        </li>
      }
    </ol>
  `,
  styles: `
    .rr-booking-progress {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
      font-family: var(--rr-font-sans);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .rr-booking-progress li {
      opacity: 0.45;
    }
    .rr-booking-progress li.is-active,
    .rr-booking-progress li.is-done {
      opacity: 1;
      color: var(--rr-oxblood);
    }
    .rr-booking-progress span {
      display: inline-flex;
      width: 1.4rem;
      height: 1.4rem;
      align-items: center;
      justify-content: center;
      border: 1px solid currentColor;
      margin-right: 6px;
    }
  `,
})
export class BookingProgress {
  readonly step = input(1);

  readonly steps = [
    { id: 1, label: 'Dates & cabins' },
    { id: 2, label: 'Guest details' },
    { id: 3, label: 'Review' },
    { id: 4, label: 'Pay on Stripe' },
  ];
}