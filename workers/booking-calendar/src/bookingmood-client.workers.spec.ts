import { buildSync } from 'esbuild';
import { Miniflare } from 'miniflare';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProductIdsInFilter } from './bookingmood-client';
import { RUNTIME_SIX_PRODUCT_IDS } from './bookingmood-runtime-fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPAT_DATE = '2026-08-07';

function bundleProbeWorker(): string {
  const result = buildSync({
    entryPoints: [path.join(__dirname, 'bookingmood-runtime-probe.worker.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    logLevel: 'silent',
  });

  return result.outputFiles[0]?.text ?? '';
}

function fakeBookingmoodOutbound(request: Request): Response {
  const url = new URL(request.url);
  if (url.hostname !== 'api.bookingmood.com') {
    return new Response('unexpected-outbound', { status: 502 });
  }

  const idFilter = url.searchParams.get('id') ?? '';
  const expectedFilter = buildProductIdsInFilter([...RUNTIME_SIX_PRODUCT_IDS]);
  if (idFilter !== expectedFilter) {
    return new Response(`bad-filter:${idFilter}`, { status: 400 });
  }

  const rows = RUNTIME_SIX_PRODUCT_IDS.map((id) => ({ id }));
  return Response.json(rows, { headers: { 'Content-Type': 'application/json' } });
}

describe('BookingmoodClient in Miniflare/workerd runtime', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    const probeScript = bundleProbeWorker();

    mf = new Miniflare({
      name: 'bookingmood-runtime-probe',
      compatibilityDate: COMPAT_DATE,
      modules: [{ type: 'ESModule', path: 'probe.js', contents: probeScript }],
      routes: ['probe.local/*'],
      outboundService: fakeBookingmoodOutbound,
    });
  });

  afterAll(async () => {
    await mf?.dispose();
  });

  it('control: unbound native fetch throws Illegal invocation in workerd', async () => {
    const response = await mf.dispatchFetch('http://probe.local/probe-unbound-fetch');
    expect(response.status).toBe(599);
    expect(await response.text()).toMatch(/Illegal invocation/i);
  });

  it('default BookingmoodClient listProducts returns all six requested ids via bound fetch', async () => {
    const response = await mf.dispatchFetch('http://probe.local/probe-default-client-six');
    expect(response.status).toBe(200);

    const body = (await response.json()) as { tag: string; ids: string[] };
    expect(body.tag).toBe('ok:6');
    expect(body.ids).toEqual([...RUNTIME_SIX_PRODUCT_IDS].sort());
  });
});
