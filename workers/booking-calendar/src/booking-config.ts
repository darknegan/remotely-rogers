import { CABIN_CONFIG } from '../../../src/environments/cabin-config';

export interface BookingWorkerEnv {
  ASSETS: Fetcher;
  BOOKINGMOOD_API_KEY?: string;
  BOOKINGMOOD_WEBHOOK_SIGNING_SECRET?: string;
  BOOKINGMOOD_PRODUCT_MAP?: string;
  BOOKINGMOOD_CAPACITY_GROUP_ID?: string;
  BOOKINGMOOD_FORM_SERVICES?: string;
  BOOKINGMOOD_BOOKING_ENABLED?: string;
}

export interface ResolvedCabinProduct {
  cabinId: number;
  slug: string;
  name: string;
  productId: string | null;
}

export interface GuestFormServiceIds {
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

export function isBookingWriteEnabled(env: BookingWorkerEnv): boolean {
  if (env.BOOKINGMOOD_BOOKING_ENABLED?.trim().toLowerCase() === 'false') {
    return false;
  }

  if (!hasBookingmoodApiKey(env)) {
    return false;
  }

  const capacity = env.BOOKINGMOOD_CAPACITY_GROUP_ID?.trim();
  if (!capacity || !UUID.test(capacity)) {
    return false;
  }

  const services = parseGuestFormServices(env.BOOKINGMOOD_FORM_SERVICES);
  if (!services.firstName || !services.lastName || !services.email) {
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
): Record<string, string> {
  const values: Record<string, string> = {};
  if (services.firstName) {
    values[services.firstName] = guest.firstName;
  }
  if (services.lastName) {
    values[services.lastName] = guest.lastName;
  }
  if (services.email) {
    values[services.email] = guest.email;
  }
  if (services.phone && guest.phone) {
    values[services.phone] = guest.phone;
  }
  if (services.notes && guest.notes) {
    values[services.notes] = guest.notes;
  }
  return values;
}

export function occupancyForAdults(env: BookingWorkerEnv, adults: number): Record<string, number> {
  const groupId = env.BOOKINGMOOD_CAPACITY_GROUP_ID?.trim();
  if (!groupId) {
    return {};
  }

  return { [groupId]: Math.max(1, adults) };
}
