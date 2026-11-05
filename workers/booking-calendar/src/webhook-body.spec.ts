import { describe, expect, it } from 'vitest';

import { HttpError } from './bookingmood-client';
import { readRequestBodyUtf8 } from './webhook-body';

describe('readRequestBodyUtf8', () => {
  it('rejects bodies larger than the byte cap while streaming', async () => {
    const chunk = 'a'.repeat(900);
    const body = chunk + chunk;

    await expect(
      readRequestBodyUtf8(new Request('https://example.com', { method: 'POST', body }), 1500),
    ).rejects.toMatchObject({ status: 413 });
  });

  it('decodes valid UTF-8 under the cap', async () => {
    const text = '{"ok":true}';
    const encoded = new TextEncoder().encode(text);
    const result = await readRequestBodyUtf8(
      new Request('https://example.com', { method: 'POST', body: encoded }),
      256,
    );
    expect(result).toBe(text);
  });

  it('rejects invalid UTF-8 sequences', async () => {
    const invalid = new Uint8Array([0xff, 0xfe, 0xfd]);
    await expect(
      readRequestBodyUtf8(new Request('https://example.com', { method: 'POST', body: invalid }), 256),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
