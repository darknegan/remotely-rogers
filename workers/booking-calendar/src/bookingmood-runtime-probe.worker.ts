import { BookingmoodClient } from './bookingmood-client';

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

    if (path === '/probe-default-client') {
      const client = new BookingmoodClient('fake-test-key');
      try {
        const rows = await client.listProducts('id', ['69d91e09-bcf5-4644-bc01-8b9dc0994312']);
        return new Response(`ok:${rows.length}`, { status: 200 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(message, { status: 599 });
      }
    }

    return new Response('not-found', { status: 404 });
  },
};
