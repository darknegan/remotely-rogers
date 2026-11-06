import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import { BookingmoodFormValue } from './bookingmood-client';

export interface BookingWorkerEnv {
  ASSETS: Fetcher;
  BOOKINGMOOD_API_KEY?: string;
  BOOKINGMOOD_WEBHOOK_SIGNING_SECRET?: string;
  BOOKINGMOOD_PRODUCT_MAP?: string;
  BOOKINGMOOD_CAPACITY_GROUP_ID?: string;
  BOOKINGMOOD_FORM_SERVICES?: string;
  BOOKINGMOOD_BOOKING_ENABLED?: string;
  AIRBNB_PREVIEW_ENABLED?: string;
  AIRBNB_LISTING_MAP?: string;
  AIRBNB_WEB_API_KEY?: string;
  AIRBNB_PREVIEW_UPSTREAM?: string;
  BOOKING_STATE?: KVNamespace;
  BOOKING_COORDINATOR?: DurableObjectNamespace;
}

export interface ResolvedCabinProduct {
  cabinId: number;
  slug: string;
  name: string;
  productId: string | null;
}

export interface GuestFormServiceIds {
  /** Bookingmood `name` service. Sent as `{ first_name, last_name }`. */
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

const UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function parseProductMap(raw: string | undefined): Record<number, string> {
  if (!raw?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const map: Record<number, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (!Number.isFinite(id) || !UUID.test(value)) {
        continue;
      }
      map[id] = value;
    }
    return map;
  } catch {
    return {};
  }
}

export function parseAirbnbListingMap(raw: string | undefined): Record<number, string> {
  if (!raw?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const map: Record<number, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      const listingId = typeof value === 'number' ? String(value) : value;
      if (!Number.isFinite(id) || typeof listingId !== 'string' || !/^\d+$/.test(listingId)) {
        continue;
      }
      map[id] = listingId;
    }
    return map;
  } catch {
    return {};
  }
}

export function isAirbnbPreviewEnabled(env: BookingWorkerEnv): boolean {
  return env.AIRBNB_PREVIEW_ENABLED?.trim().toLowerCase() === 'true';
}

export function resolveCabinProducts(env: BookingWorkerEnv): ResolvedCabinProduct[] {
  const fromEnv = parseProductMap(env.BOOKINGMOOD_PRODUCT_MAP);

  return CABIN_CONFIG.cabins.map((cabin) => {
    const configured =
      (cabin.bookingmoodProductId && UUID.test(cabin.bookingmoodProductId)
        ? cabin.bookingmoodProductId
        : null) ?? fromEnv[cabin.id] ?? null;

    return {
      cabinId: cabin.id,
      slug: cabin.slug,
      name: cabin.name,
      productId: configured,
    };
  });
}

export function productIdForCabin(
  env: BookingWorkerEnv,
  cabinId: number,
): string | null {
  const match = resolveCabinProducts(env).find((c) => c.cabinId === cabinId);
  return match?.productId ?? null;
}

export function allowlistedProductIds(env: BookingWorkerEnv): string[] {
  const ids = resolveCabinProducts(env)
    .map((c) => c.productId)
    .filter((id): id is string => !!id);
  return [...new Set(ids)];
}

export function hasBookingmoodApiKey(env: BookingWorkerEnv): boolean {
  return !!env.BOOKINGMOOD_API_KEY?.trim();
}

export function hasDurableBookingStorage(env: BookingWorkerEnv): boolean {
  return !!env.BOOKING_STATE && !!env.BOOKING_COORDINATOR;
}

export function isExplicitBookingWriteFlagEnabled(env: BookingWorkerEnv): boolean {
  const raw = env.BOOKINGMOOD_BOOKING_ENABLED?.trim();
  if (!raw) {
    return false;
  }

  return raw.toLowerCase() === 'true';
}

export function isBookingWriteEnabled(env: BookingWorkerEnv): boolean {
  if (!isExplicitBookingWriteFlagEnabled(env) || isAirbnbPreviewEnabled(env)) {
    return false;
  }

  if (!hasBookingmoodApiKey(env)) {
    return false;
  }

  if (!hasDurableBookingStorage(env)) {
    return false;
  }

  const capacity = env.BOOKINGMOOD_CAPACITY_GROUP_ID?.trim();
  if (!capacity || !UUID.test(capacity)) {
    return false;
  }

  const services = parseGuestFormServices(env.BOOKINGMOOD_FORM_SERVICES);
  const hasName =
    isServiceId(services.name) ||
    (isServiceId(services.firstName) && isServiceId(services.lastName));
  if (!hasName || !isServiceId(services.email)) {
    return false;
  }

  return allowlistedProductIds(env).length > 0;
}

export function parseGuestFormServices(raw: string | undefined): GuestFormServiceIds {
  if (!raw?.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as GuestFormServiceIds;
  } catch {
    return {};
  }
}

export function buildGuestFormValues(
  services: GuestFormServiceIds,
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  },
): Record<string, BookingmoodFormValue> {
  const values: Record<string, BookingmoodFormValue> = {};
  if (isServiceId(services.name)) {
    values[services.name] = {
      first_name: guest.firstName,
      last_name: guest.lastName,
    };
  } else if (
    isServiceId(services.firstName) &&
    services.firstName === services.lastName
  ) {
    values[services.firstName] = {
      first_name: guest.firstName,
      last_name: guest.lastName,
    };
  } else {
    if (isServiceId(services.firstName)) {
      values[services.firstName] = guest.firstName;
    }
    if (isServiceId(services.lastName)) {
      values[services.lastName] = guest.lastName;
    }
  }
  if (isServiceId(services.email)) {
    values[services.email] = guest.email;
  }
  if (isServiceId(services.phone) && guest.phone) {
    values[services.phone] = guest.phone;
  }
  if (isServiceId(services.notes) && guest.notes) {
    values[services.notes] = guest.notes;
  }
  return values;
}

function isServiceId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

export function occupancyForAdults(env: BookingWorkerEnv, adults: number): Record<string, number> {
  const groupId = env.BOOKINGMOOD_CAPACITY_GROUP_ID?.trim();
  if (!groupId) {
    return {};
  }

  return { [groupId]: Math.max(1, adults) };
}
