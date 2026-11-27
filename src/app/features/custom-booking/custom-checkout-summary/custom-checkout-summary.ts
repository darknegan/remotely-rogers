import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  syncChannelFromGroupBooking,
  syncGroupFromChannelBooking,
} from '../../../core/booking/group-booking-channel-sync';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { formatDateRangeLabel } from '../../../core/utils/date-utils';
import { formatGuestCount } from '../../../core/utils/guest-label';
import { shortCabinName } from '../../../core/utils/reviews';
import { BookingStateService } from '../../group-booking/booking-state.service';

@Component({
  selector: 'app-custom-checkout-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './custom-checkout-summary.html',
  styleUrl: './custom-checkout-summary.scss',
})
export class CustomCheckoutSummary implements OnInit {
  protected readonly group = inject(BookingStateService);
  protected readonly channel = inject(BookingChannelStateService);
  readonly formatGuestCount = formatGuestCount;
  readonly bookingOff = computed(
    () => this.group.reservationsOff() || this.channel.reservationsOff(),
  );
  readonly formatDateRangeLabel = formatDateRangeLabel;
  readonly shortName = shortCabinName;

  ngOnInit(): void {
    this.group.revalidateSavedCart(() => {
      if (!syncChannelFromGroupBooking(this.channel, this.group)) {
        syncGroupFromChannelBooking(this.channel, this.group);
      }
      this.channel.loadChannel();
      this.channel.refreshWorkerQuotes();
    });
  }
}