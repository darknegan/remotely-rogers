import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BookingBar } from '../../layout/booking-bar/booking-bar';

@Component({
  selector: 'app-foundations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookingBar],
  templateUrl: './foundations.html',
})
export class Foundations {
  readonly swatches = [
    { name: 'Limestone', value: '#F5F0E6' },
    { name: 'Walnut', value: '#3E2C22' },
    { name: 'Oxblood', value: '#6C2029' },
    { name: 'Brass', value: '#B08A4A' },
    { name: 'Ink', value: '#2B1F17' },
    { name: 'Ivory', value: '#F7F2E7' },
  ];
}
