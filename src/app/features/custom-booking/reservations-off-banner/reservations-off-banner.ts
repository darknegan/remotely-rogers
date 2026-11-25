import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reservations-off-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rr-reservations-off" role="status">
      <strong>Preview · Reservations off</strong>
      <span>
        Reservations are temporarily disabled on this preview. You can browse cabins and dates, but booking
        is turned off.
      </span>
    </div>
  `,
  styles: `
    .rr-reservations-off {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      background: var(--rr-oxblood);
      color: var(--rr-ivory);
      font-family: var(--rr-font-sans);
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .rr-reservations-off span {
      text-transform: none;
      letter-spacing: normal;
      font-size: 0.8125rem;
      opacity: 0.95;
    }
  `,
})
export class ReservationsOffBanner {}