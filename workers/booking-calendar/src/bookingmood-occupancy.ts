import { BookingWorkerEnv } from './booking-config';
import { BookingmoodClient } from './bookingmood-client';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedCapacityGroupId: string | null | undefined;

export function occupancyForCapacityGroup(
  capacityGroupId: string | null | undefined,
  adults: number,
): Record<string, number> {
  const groupId = capacityGroupId?.trim();
  if (!groupId || !UUID.test(groupId)) {
    return {};
  }
  return { [groupId]: Math.max(1, adults) };
}

export async function resolveOccupancyForAdults(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  adults: number,
): Promise<Record<string, number>> {
  const fromEnv = env.BOOKINGMOOD_CAPACITY_GROUP_ID?.trim();
  if (fromEnv && UUID.test(fromEnv)) {
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