import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Popover } from 'primeng/popover';

import {
  guestStepperLimits,
  GuestCounts,
  MIN_STAY_NIGHTS,
  SearchStateService,
} from '../../../core/search/search-state.service';
import { formatShortDate, formatWeekday, startOfDay } from '../../../core/utils/date-utils';
import { averageRating } from '../../../core/utils/reviews';
import { reviewsForCabin } from '../../content/reviews/reviews.data';
import {
  buildLodgifyBookingUrl,
  computeBookingEstimate,
  formatUsd,
} from '../cabin-detail.utils';

interface GuestStepper {
  key: keyof GuestCounts;
  label: string;
  sub: string;
}

@Component({
  selector: 'app-cabin-booking-widget',
  imports: [FormsModule, DatePicker, InputNumber, Popover, RouterLink],
  templateUrl: './cabin-booking-widget.html',
  styleUrl: './cabin-booking-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinBookingWidget {
  protected readonly search = inject(SearchStateService);

  readonly slug = input.required<string>();
  readonly cabinName = input.required<string>();
  readonly nightlyRate = input.required<number>();
  readonly compact = input(false);

  readonly datesChanged = output<void>();

  readonly minDate = startOfDay(new Date());

  readonly guestSteppers: GuestStepper[] = [
    { key: 'adults', label: 'Adults', sub: 'Ages 13+' },
    { key: 'children', label: 'Children', sub: 'Ages 2–12' },
    { key: 'infants', label: 'Infants', sub: 'Under 2' },
    { key: 'pets', label: 'Pets', sub: 'One per cabin — arrange first' },
  ];

  readonly reviews = computed(() => reviewsForCabin(this.slug()));
  readonly reviewCount = computed(() => this.reviews().length);
  readonly average = computed(() => averageRating(this.reviews()));

  readonly estimate = computed(() =>
    computeBookingEstimate(this.search.nights(), this.nightlyRate()),
  );

  readonly canBook = computed(() => this.search.canSearch());

  readonly bookUrl = computed(() => {
    const checkIn = this.search.checkIn();
    const checkOut = this.search.checkOut();
    if (!checkIn || !checkOut || !this.canBook()) {
      return null;
    }

    return buildLodgifyBookingUrl(this.slug(), checkIn, checkOut, this.search.guests());
  });

  protected checkInLabel(): string {
    const value = this.search.checkIn();
    return value ? `${formatWeekday(value)}, ${formatShortDate(value)}` : 'Add date';
  }

  protected checkOutLabel(): string {
    const value = this.search.checkOut();
    return value ? `${formatWeekday(value)}, ${formatShortDate(value)}` : 'Add date';
  }

  protected formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  protected formatMoney(amount: number): string {
    return formatUsd(amount);
  }

  protected onCheckInChange(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? value[0] : value;
    this.search.setCheckIn(date);
    this.datesChanged.emit();
  }

  protected onCheckOutChange(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? value[0] : value;
    this.search.setCheckOut(date);
    this.datesChanged.emit();
  }

  protected limits(key: keyof GuestCounts) {
    return guestStepperLimits(this.search.guests(), key);
  }

  protected updateGuest(key: keyof GuestCounts, value: number | null): void {
    this.search.updateGuestCount(key, value ?? 0);
    this.datesChanged.emit();
  }

  protected minStayNote(): string {
    return `${MIN_STAY_NIGHTS}-night minimum · check-in 3:00 PM`;
  }
}
