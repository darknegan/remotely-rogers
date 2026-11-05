import { GroupCheckoutRequest } from '../../../src/app/core/models/booking.models';

export async function checkoutRequestFingerprint(request: GroupCheckoutRequest): Promise<string> {
  const normalized = {
    adults: Math.max(1, request.adults || 1),
    guest: {
      firstName: request.guest?.firstName?.trim() ?? '',
      lastName: request.guest?.lastName?.trim() ?? '',
      email: request.guest?.email?.trim().toLowerCase() ?? '',
      phone: request.guest?.phone?.trim() ?? '',
      notes: request.guest?.notes?.trim() ?? '',
    },
    cabins: [...(request.cabins ?? [])]
      .map((line) => ({
        cabinId: line.cabinId,
        arrival: line.arrival,
        departure: line.departure,
      }))
      .sort((a, b) => a.cabinId - b.cabinId || a.arrival.localeCompare(b.arrival)),
  };

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(normalized)),
  );
  return bufferToHex(digest);
}

export function idempotencyScopeKey(clientKey: string | undefined, fingerprint: string): string {
  const trimmed = clientKey?.trim();
  if (trimmed) {
    return `client:${trimmed}`;
  }
  return `fp:${fingerprint}`;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
