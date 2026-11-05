import { BookingmoodCartValidateItem } from './bookingmood-client';
import { HttpError } from './bookingmood-client';

export function assertCartValidateResponse(
  submittedItemIds: string[],
  response: unknown,
): BookingmoodCartValidateItem[] {
  if (!Array.isArray(response)) {
    throw new HttpError(502, 'Bookingmood cart-validate returned a non-array response.');
  }

  if (response.length !== submittedItemIds.length) {
    throw new HttpError(502, 'Bookingmood cart-validate result count does not match the cart.');
  }

  const byId = new Map<string, BookingmoodCartValidateItem>();
  for (const row of response) {
    if (!row || typeof row !== 'object') {
      throw new HttpError(502, 'Bookingmood cart-validate returned malformed items.');
    }

    const record = row as BookingmoodCartValidateItem;
    if (typeof record.id !== 'string' || !record.id) {
      throw new HttpError(502, 'Bookingmood cart-validate item is missing an id.');
    }

    if (byId.has(record.id)) {
      throw new HttpError(502, 'Bookingmood cart-validate returned duplicate item ids.');
    }

    byId.set(record.id, record);
  }

  const ordered: BookingmoodCartValidateItem[] = [];
  for (const id of submittedItemIds) {
    const item = byId.get(id);
    if (!item) {
      throw new HttpError(502, 'Bookingmood cart-validate did not return every cart item.');
    }
    ordered.push(item);
  }

  return ordered;
}

export function assertCartItemsValid(items: BookingmoodCartValidateItem[]): void {
  for (const item of items) {
    if (item.valid !== true || item.availabilityMatch !== true || item.occupancyMatch !== true) {
      throw new HttpError(409, 'Your cart is no longer valid. Refresh availability and try again.');
    }

    assertValidPrice(item.price, item.id);
  }
}

function assertValidPrice(
  price: BookingmoodCartValidateItem['price'],
  itemId: string,
): void {
  if (!price || typeof price !== 'object') {
    throw new HttpError(502, `Bookingmood did not return a price for cart item ${itemId}.`);
  }

  const currency = price.currency;
  if (typeof currency !== 'string' || currency.length !== 3) {
    throw new HttpError(502, 'Bookingmood returned an invalid price currency.');
  }

  for (const field of ['subtotal', 'tax', 'total', 'deposit'] as const) {
    const value = price[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new HttpError(502, `Bookingmood returned invalid ${field} for cart item ${itemId}.`);
    }
  }
}
