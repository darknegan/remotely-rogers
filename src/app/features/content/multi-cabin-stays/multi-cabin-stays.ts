import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingStateService } from '../../group-booking/booking-state.service';
import { GroupBookingShell } from '../../group-booking/shell/shell';

interface BookingStep {
  step: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-multi-cabin-stays',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BookingStateService],
  imports: [GroupBookingShell, RouterLink],
  templateUrl: './multi-cabin-stays.html',
})
export class MultiCabinStays {
  readonly bookingSteps: BookingStep[] = [
    {
      step: 'Step 1',
      title: 'Pick your dates',
      description:
        'Choose arrival and departure for your group — see real-time availability across all six cabins.',
    },
    {
      step: 'Step 2',
      title: 'Select your cabins',
      description:
        'Add two, three, or all six cabins to one cart. Mix and match based on your group size.',
    },
    {
      step: 'Step 3',
      title: 'One combined checkout',
      description:
        'Complete a single reservation for the whole group — no juggling separate Lodgify bookings.',
    },
  ];
}
