import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { BOOKINGMOOD_PRODUCT_IDS } from '../../../core/booking/bookingmood-products';
import { CABIN_LISTINGS } from '../../../core/content/cabin-catalog';
import { syncGroupFromChannelBooking } from '../../../core/booking/group-booking-channel-sync';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { ReservationsOffBanner } from '../reservations-off-banner/reservations-off-banner';
import { BookingCalendar } from '../booking-calendar/booking-calendar';
import { GuestSteppers } from '../guest-steppers/guest-steppers';
import { formatGuestCount } from '../../../core/utils/guest-label';
import { PriceSummary } from '../price-summary/price-summary';

@Component({
  selector: 'app-custom-group-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReservationsOffBanner, BookingCalendar, GuestSteppers, PriceSummary],
  templateUrl: './custom-group-booking.html',
  styleUrl: './custom-group-booking.scss',
})
export class CustomGroupBooking implements OnInit {
  private readonly router = inject(Router);
  private readonly group = inject(BookingStateService);
  protected readonly state = inject(BookingChannelStateService);
  readonly cabins = CABIN_LISTINGS;

  ngOnInit(): void {
    this.state.loadChannel();
    this.state.refreshAvailability(Object.values(BOOKINGMOOD_PRODUCT_IDS));
  }

  productIdForCabin(cabinId: number): string | null {
    return BOOKINGMOOD_PRODUCT_IDS[cabinId] ?? null;
  }

  cabinName(cabinId: number): string {
    return this.cabins.find((c) => c.id === cabinId)?.name ?? 'Cabin';
  }

  sleepsMax(cabinId: number): number {
    const productId = this.productIdForCabin(cabinId);
    return productId ? this.state.maxGuestsForProduct(productId) : 2;
  }

  guestSummary(): string {
    return formatGuestCount(this.state.totalSelectedGuests());
  }

  toggle(cabinId: number): void {
    const productId = this.productIdForCabin(cabinId);
    if (!productId || !this.state.isProductSelectable(productId)) {
      return;
    }
    this.state.toggleProductSelection(productId);
    this.state.validateCart();
  }

  isSelected(cabinId: number): boolean {
    const productId = this.productIdForCabin(cabinId);
    return productId ? this.state.selectedProductIds().includes(productId) : false;
  }

  continueToCheckout(): void {
    if (this.state.minStayError() || this.state.selectedProductIds().length === 0) {
      return;
    }
    syncGroupFromChannelBooking(this.state, this.group);
    void this.router.navigate(['/group-booking/checkout']);
  }
}