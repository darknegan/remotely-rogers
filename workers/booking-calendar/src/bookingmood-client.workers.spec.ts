import { buildSync } from 'esbuild';
import { Miniflare } from 'miniflare';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPAT_DATE = '2026-08-07';

function bundleEntry(entry: string): string {
  const result = buildSync({
    entryPoints: [path.join(__dirname, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    logLevel: 'silent',
  });

  return result.outputFiles[0]?.text ?? '';
}

function workerManifest(contents: string) {
  return {
    mainModule: 'index.js',
    modulesRoot: '/',
    modules: {
      'index.js': { type: 'esm' as const, contents },
    },
  };
}

describe('BookingmoodClient in Miniflare/workerd runtime', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    const probeScript = bundleEntry('bookingmood-runtime-probe.worker.ts');
    const outboundScript = bundleEntry('bookingmood-runtime-outbound.worker.ts');

    mf = new Miniflare({
      workers: [
        {
          config: {
            name: 'probe',
            type: 'worker',
            compatibilityDate: COMPAT_DATE,
            manifest: workerManifest(probeScript),
            triggers: [{ type: 'fetch', pattern: 'probe.local/*' }],
          },
          dev: {
            outboundService: { type: 'worker', workerName: 'mock-outbound' },
          },
        },
        {
          config: {
            name: 'mock-outbound',
            type: 'worker',
            compatibilityDate: COMPAT_DATE,
            manifest: workerManifest(outboundScript),
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await mf?.dispose();
  });

  it('RED pattern: unbound native fetch throws Illegal invocation in workerd', async () => {
    const response = await mf.dispatchFetch('http://probe.local/probe-unbound-fetch');
    expect(response.status).toBe(599);
    expect(await response.text()).toMatch(/Illegal invocation/i);
  });

  it('default BookingmoodClient resolves listProducts via bound fetch (no Illegal invocation)', async () => {
    const response = await mf.dispatchFetch('http://probe.local/probe-default-client');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok:1');
  });
});
