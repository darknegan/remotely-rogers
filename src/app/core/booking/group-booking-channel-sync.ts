import { BOOKINGMOOD_PRODUCT_IDS, bookingmoodProductId } from './bookingmood-products';
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

function cabinIdForProduct(productId: string): number | null {
  for (const [id, pid] of Object.entries(BOOKINGMOOD_PRODUCT_IDS)) {
    if (pid === productId) {
      return Number(id);
    }
  }
  return null;
}

/** Mirror custom channel selections into legacy cart state for checkout routes. */
export function syncGroupFromChannelBooking(
  channel: BookingChannelStateService,
  group: BookingStateService,
): boolean {
  const checkIn = channel.checkIn();
  const checkOut = channel.checkOut();
  if (!checkIn || !checkOut) {
    return false;
  }

  const selections: Record<number, { cabinId: number; arrival: Date; departure: Date }> = {};
  for (const productId of channel.selectedProductIds()) {
    const cabinId = cabinIdForProduct(productId);
    if (cabinId == null) {
      continue;
    }
    selections[cabinId] = { cabinId, arrival: checkIn, departure: checkOut };
  }

  if (Object.keys(selections).length === 0) {
    return false;
  }

  const guestByCabin: Record<number, number> = {};
  let guestTotal = 0;
  for (const productId of channel.selectedProductIds()) {
    const cabinId = cabinIdForProduct(productId);
    if (cabinId == null) {
      continue;
    }
    const count = channel.totalGuestsForProduct(productId);
    guestByCabin[cabinId] = count;
    guestTotal += count;
  }

  if (guestTotal > 0) {
    group.setGuestCount(guestTotal);
  }
  group.cabinGuestCounts.set(guestByCabin);

  group.cabinSelections.set(selections);
  return true;
}