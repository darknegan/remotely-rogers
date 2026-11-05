import { BookingmoodClient } from './bookingmood-client';
import { RUNTIME_SIX_PRODUCT_IDS } from './bookingmood-runtime-fixtures';

function productId(row: unknown): string | null {
  if (!row || typeof row !== 'object') {
    return null;
  }
  const id = (row as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path === '/probe-unbound-fetch') {
      class BrokenFetchHolder {
        fetchImpl = fetch;
        call() {
          return this.fetchImpl('https://api.bookingmood.com/v1/products?select=id');
        }
      }

      try {
        await new BrokenFetchHolder().call();
        return new Response('unexpected-success', { status: 500 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(message, { status: 599 });
      }
    }

    if (path === '/probe-default-client-six') {
      const client = new BookingmoodClient('fake-test-key');
      const requestedIds = [...RUNTIME_SIX_PRODUCT_IDS];

      try {
        const rows = await client.listProducts('id', requestedIds);
        const returnedIds = rows.map(productId).filter((id): id is string => id != null).sort();
        const expectedIds = [...requestedIds].sort();

        if (returnedIds.length !== 6) {
          return new Response(`bad-count:${returnedIds.length}`, { status: 598 });
        }

        for (let i = 0; i < expectedIds.length; i += 1) {
          if (returnedIds[i] !== expectedIds[i]) {
            return new Response(`bad-ids:${returnedIds.join(',')}`, { status: 598 });
          }
        }

        return Response.json({ tag: 'ok:6', ids: returnedIds });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(message, { status: 599 });
      }
    }

    return new Response('not-found', { status: 404 });
  },
};
