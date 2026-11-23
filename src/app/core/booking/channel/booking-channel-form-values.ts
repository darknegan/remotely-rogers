import { BookingmoodFormService } from './bookingmood-channel.types';

/** Shape used in cart `form_values` for `type: address` (per HANDOFF / cart-validate example; channel payload does not enumerate subfields). */
export interface BookingmoodAddressFormValue {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export type BookingmoodServiceFormValue = string | BookingmoodAddressFormValue;

export function isAddressValue(value: BookingmoodServiceFormValue): value is BookingmoodAddressFormValue {
  return typeof value === 'object' && value !== null && 'street' in value;
}

export function buildFormValuesForCart(
  services: BookingmoodFormService[],
  byServiceId: Record<string, BookingmoodServiceFormValue>,
): Record<string, BookingmoodServiceFormValue> {
  const mapped: Record<string, BookingmoodServiceFormValue> = {};
  for (const service of services) {
    const value = byServiceId[service.id];
    if (value === undefined || value === null) {
      continue;
    }
    if (service.type === 'address' && isAddressValue(value)) {
      mapped[service.id] = {
        street: value.street.trim(),
        city: value.city.trim(),
        zip: value.zip.trim(),
        country: value.country.trim(),
      };
    } else if (typeof value === 'string' && value.trim()) {
      mapped[service.id] = value.trim();
    }
  }
  return mapped;
}

export function formatFormValueForDisplay(
  service: BookingmoodFormService,
  value: BookingmoodServiceFormValue | undefined,
): string {
  if (value === undefined) {
    return '—';
  }
  if (service.type === 'address' && isAddressValue(value)) {
    return [value.street, value.city, value.zip, value.country].filter(Boolean).join(', ') || '—';
  }
  return typeof value === 'string' && value.trim() ? value : '—';
}