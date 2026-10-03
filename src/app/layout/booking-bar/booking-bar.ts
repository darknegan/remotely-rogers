import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Popover } from 'primeng/popover';

import {
  guestStepperLimits,
  GuestCounts,
  SearchStateService,
} from '../../core/search/search-state.service';
import { formatShortDate, formatWeekday, startOfDay } from '../../core/utils/date-utils';

interface GuestStepper {
  key: keyof GuestCounts;
  label: string;
  sub: string;
}

@Component({
  selector: 'app-booking-bar',
  imports: [FormsModule, DatePicker, InputNumber, Popover, RouterLink],
  templateUrl: './booking-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingBar {
  private readonly router = inject(Router);
  protected readonly search = inject(SearchStateService);

  /** Home hero uses a 2×2 + guests + search grid below 1024px. */
  readonly layout = input<'default' | 'home'>('default');

  readonly minDate = startOfDay(new Date());

  readonly guestSteppers: GuestStepper[] = [
    { key: 'adults', label: 'Adults', sub: 'Ages 13+' },
    { key: 'children', label: 'Children', sub: 'Ages 2–12' },
    { key: 'infants', label: 'Infants', sub: 'Under 2' },
    { key: 'pets', label: 'Pets', sub: 'One per cabin — arrange first' },
  ];

  checkInLabel(): string {
    const value = this.search.checkIn();
    return value ? `${formatWeekday(value)}, ${formatShortDate(value)}` : 'Add date';
  }

  checkOutLabel(): string {
    const value = this.search.checkOut();
    return value ? `${formatWeekday(value)}, ${formatShortDate(value)}` : 'Add date';
  }

  onCheckInChange(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? value[0] : value;
    this.search.setCheckIn(date);
  }

  onCheckOutChange(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? value[0] : value;
    this.search.setCheckOut(date);
  }

  limits(key: keyof GuestCounts) {
    return guestStepperLimits(this.search.guests(), key);
  }

  updateGuest(key: keyof GuestCounts, value: number | null): void {
    this.search.updateGuestCount(key, value ?? 0);
  }

  searchCabins(): void {
    if (!this.search.canSearch()) {
      return;
    }

    this.router.navigate(['/cabins'], { queryParams: this.search.toQueryParams() });
  }
}
