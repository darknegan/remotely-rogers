import { BookingWorkerEnv } from './booking-config';
import { diagnoseCapacityGroupEnv, normalizeEnvUuid } from './bookingmood-capacity-env';
import { BookingmoodClient } from './bookingmood-client';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export { diagnoseCapacityGroupEnv, normalizeEnvUuid };

let cachedCapacityGroupId: string | null | undefined;

/**
 * POST /search occupancy filter. For Rentals by Hong Davis (manual capacity group), a
 * non-empty map (e.g. `{ [capacityGroupId]: 1|2 }`) returns `[]` from Bookingmood; `{}`
 * returns full priced results with `occupancyMatches: true`.
 */
export function occupancyForSearch(): Record<string, number> {
  return {};
}

export function occupancyForCapacityGroup(
  capacityGroupId: string | null | undefined,
  adults: number,
  options: { maxGuests?: number } = {},
): Record<string, number> {
  const groupId = capacityGroupId?.trim();
  if (!groupId || !UUID.test(groupId)) {
    return {};
  }
  const capped =
    options.maxGuests != null
      ? Math.min(options.maxGuests, Math.max(1, adults))
      : Math.max(1, adults);
  return { [groupId]: capped };
}

export async function resolveOccupancyForAdults(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  adults: number,
): Promise<Record<string, number>> {
  const fromEnv = normalizeEnvUuid(env.BOOKINGMOOD_CAPACITY_GROUP_ID);
  if (fromEnv) {
    return occupancyForCapacityGroup(fromEnv, adults);
  }

  const groupId = await resolveCapacityGroupId(client);
  return occupancyForCapacityGroup(groupId, adults);
}

export async function resolveCapacityGroupId(client: BookingmoodClient): Promise<string | null> {
  if (cachedCapacityGroupId !== undefined) {
    return cachedCapacityGroupId;
  }

  try {
    const rows = await client.listCapacityGroups();
    const id = rows[0]?.id?.trim();
    cachedCapacityGroupId = id && UUID.test(id) ? id : null;
  } catch (error) {
    console.error('bookingmood_capacity_groups_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    cachedCapacityGroupId = null;
  }

  return cachedCapacityGroupId;
}

/** Test helper */
export function resetCapacityGroupCacheForTests(): void {
  cachedCapacityGroupId = undefined;
}