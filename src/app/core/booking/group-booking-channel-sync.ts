import { bookingmoodProductId } from './bookingmood-products';
import { BookingChannelStateService } from './channel/booking-channel-state.service';
import { BookingStateService } from '../../features/group-booking/booking-state.service';

/** Copy legacy group-booking cart selections into channel checkout state (shared dates). */
export function syncChannelFromGroupBooking(
  channel: BookingChannelStateService,
  group: BookingStateService,
): boolean {
  const items = group.cartItems();
  if (items.length === 0) {
    return false;
  }

  const { arrival, departure } = items[0].selection;
  channel.setDates(arrival, departure);

  const productIds: string[] = [];
  const occupancy: Record<string, Record<string, number>> = {};
  const guestsPerCabin = group.guestCount();

  for (const item of items) {
    const productId = bookingmoodProductId(item.cabin.id);
    if (!productId) {
      continue;
    }
    productIds.push(productId);
    channel.seedOccupancy(productId);
    const groupId = channel.capacityGroupIdForProduct(productId);
    if (groupId) {
      occupancy[productId] = { [groupId]: guestsPerCabin };
    }
  }

  if (productIds.length === 0) {
    return false;
  }

  channel.selectedProductIds.set(productIds);
  channel.occupancyByProduct.update((current) => ({ ...current, ...occupancy }));
  return true;
}