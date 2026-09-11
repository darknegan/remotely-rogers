/**
 * Fetch Lodgify properties and print property_id → room_type_id mappings.
 * Reads LODGIFY_API_KEY from .env or the environment.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readEnvKey() {
  if (process.env.LODGIFY_API_KEY) {
    return process.env.LODGIFY_API_KEY.trim();
  }

  try {
    const envPath = resolve(process.cwd(), '.env');
    const match = readFileSync(envPath, 'utf8').match(/^LODGIFY_API_KEY=(.*)$/m);
    return match?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
}

function firstRoomTypeId(property) {
  const rooms = property.rooms ?? property.room_types ?? property.roomTypes ?? [];
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return null;
  }

  return rooms[0].id ?? rooms[0].room_type_id ?? null;
}

const apiKey = readEnvKey();
if (!apiKey) {
  console.error('Set LODGIFY_API_KEY in .env or the environment, then re-run.');
  process.exit(1);
}

const response = await fetch('https://api.lodgify.com/v2/properties?includeCount=true&page=1&size=50', {
  headers: {
    Accept: 'application/json',
    'X-ApiKey': apiKey,
  },
});

if (!response.ok) {
  console.error(`GET /v2/properties failed (${response.status})`);
  console.error(await response.text());
  process.exit(1);
}

const payload = await response.json();
const items = Array.isArray(payload)
  ? payload
  : (payload.items ?? payload.data ?? payload.properties ?? []);

for (const property of items) {
  console.log({
    id: property.id,
    name: property.name,
    roomTypeId: firstRoomTypeId(property),
  });
}
