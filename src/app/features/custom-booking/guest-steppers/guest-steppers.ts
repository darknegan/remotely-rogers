import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

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

  groupsForProduct(): string[] {
    const product = this.state.products().find((p) => p.id === this.productId());
    if (!product?.capacity) {
      return this.state.primaryCapacityGroupId() ? [this.state.primaryCapacityGroupId()!] : [];
    }
    return Object.keys(product.capacity);
  }

  count(groupId: string): number {
    return this.state.occupancyByProduct()[this.productId()]?.[groupId] ?? 1;
  }

  change(groupId: string, delta: number): void {
    if (this.disabled()) {
      return;
    }
    this.state.changeOccupancy(this.productId(), groupId, delta);
  }
}