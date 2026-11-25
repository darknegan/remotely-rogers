import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';

@Component({
  selector: 'app-guest-steppers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guest-steppers.html',
  styleUrl: './guest-steppers.scss',
})
export class GuestSteppers {
  readonly productId = input.required<string>();
  readonly disabled = input(false);

  protected readonly state = inject(BookingChannelStateService);

  readonly groupId = computed(() => this.state.capacityGroupIdForProduct(this.productId()));
  readonly maxGuests = computed(() => this.state.maxGuestsForProduct(this.productId()));
  readonly guestCount = computed(() => {
    const gid = this.groupId();
    if (!gid) {
      return 0;
    }
    return this.state.occupancyByProduct()[this.productId()]?.[gid] ?? 0;
  });

  change(delta: number): void {
    const groupId = this.groupId();
    if (!groupId || this.disabled()) {
      return;
    }
    this.state.changeOccupancy(this.productId(), groupId, delta);
  }
}