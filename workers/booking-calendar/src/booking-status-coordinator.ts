export type StatusPatch = {
  paymentRecorded?: boolean;
  bookingConfirmed?: boolean;
  cancelled?: boolean;
};

export interface PublicBookingStatus {
  reference: string;
  paymentRecorded: boolean;
  bookingConfirmed: boolean;
  cancelled: boolean;
  updatedAt: string;
}

export interface StatusPatchResult {
  ok: boolean;
  status?: PublicBookingStatus;
}

export async function getPublicBookingStatusFromCoordinator(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  reference: string,
): Promise<PublicBookingStatus | null> {
  const stub = statusStub(env, reference);
  const response = await stub.fetch('https://booking-coordinator/status/get');
  if (response.status === 404) {
    return null;
  }

  return (await response.json()) as PublicBookingStatus;
}

export async function applyPublicBookingStatusPatch(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  reference: string,
  patch: StatusPatch,
): Promise<PublicBookingStatus> {
  const stub = statusStub(env, reference);
  const response = await stub.fetch('https://booking-coordinator/status/patch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch, reference: reference.trim() }),
  });

  if (!response.ok) {
    throw new Error('Unable to apply booking status patch.');
  }

  const payload = (await response.json()) as StatusPatchResult;
  if (!payload.status) {
    throw new Error('Booking status patch returned no status.');
  }

  return payload.status;
}

export async function seedPublicBookingStatus(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  reference: string,
): Promise<void> {
  const stub = statusStub(env, reference);
  await stub.fetch('https://booking-coordinator/status/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: reference.trim() }),
  });
}

function statusStub(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  reference: string,
): DurableObjectStub {
  const id = env.BOOKING_COORDINATOR.idFromName(`status:${reference.trim()}`);
  return env.BOOKING_COORDINATOR.get(id);
}
