import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { ReservationsOffBanner } from '../reservations-off-banner/reservations-off-banner';
import { BookingCalendar } from '../booking-calendar/booking-calendar';
import { GuestSteppers } from '../guest-steppers/guest-steppers';
import { PriceSummary } from '../price-summary/price-summary';

@Component({
  selector: 'app-booking-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, ReservationsOffBanner, BookingCalendar, GuestSteppers, PriceSummary],
  providers: [BookingChannelStateService],
  templateUrl: './booking-panel.html',
  styleUrl: './booking-panel.scss',
})
export class BookingPanel implements OnInit {
  readonly cabinId = input.required<number>();
  readonly nightlyFrom = input(0);
  readonly compact = input(false);

  protected readonly state = inject(BookingChannelStateService);
  private readonly router = inject(Router);

  readonly productId = computed(() => {
    const map = this.state.products();
    const fromCabin = this.state.productForCabinId(this.cabinId());
    return fromCabin?.id ?? null;
  });

  ngOnInit(): void {
    this.state.setSingleProductForCabin(this.cabinId());
    this.state.loadChannel();
    const productId = this.productId();
    if (productId) {
      this.state.refreshAvailability([productId]);
    }
  }

  onDatesSet(): void {
    const productId = this.productId();
    if (productId) {
      this.state.validateCart();
    }
  }

  continue(): void {
    if (this.state.reservationsOff()) {
      return;
    }
    void this.router.navigate(['/group-booking/checkout'], {
      queryParams: { mode: 'custom', cabin: this.cabinId() },
    });
  }
}