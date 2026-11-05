/**
 * List Bookingmood products with a safe column selection (read-only).
 * Reads BOOKINGMOOD_API_KEY from .env or the environment.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SELECT =
  'id,name,description,timezone,currency,images,deposit,fee,rent_pricing_definition';

function readEnvKey() {
  if (process.env.BOOKINGMOOD_API_KEY) {
    return process.env.BOOKINGMOOD_API_KEY.trim();
  }

  try {
    const envPath = resolve(process.cwd(), '.env');
    const match = readFileSync(envPath, 'utf8').match(/^BOOKINGMOOD_API_KEY=(.*)$/m);
    return match?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
}

const apiKey = readEnvKey();
if (!apiKey) {
  console.error('Set BOOKINGMOOD_API_KEY in .env or the environment, then re-run.');
  process.exit(1);
}

const response = await fetch(`https://api.bookingmood.com/v1/products?select=${SELECT}`, {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
});

if (!response.ok) {
  console.error(`GET /products failed (${response.status})`);
  console.error(await response.text());
  process.exit(1);
}

const payload = await response.json();
const items = Array.isArray(payload) ? payload : (payload.items ?? payload.data ?? []);

for (const product of items) {
  console.log({
    id: product.id,
    name: product.name?.default ?? product.name,
    timezone: product.timezone,
    currency: product.currency,
  });
}
