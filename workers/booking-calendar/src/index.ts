import { GroupCheckoutRequest, PublicBookingStatus } from '../../../src/app/core/models/booking.models';
import { BookingWorkerEnv } from './booking-config';
import { buildAvailabilityResponse, listPublicProducts } from './availability';
import { createBookingCheckout } from './checkout';
import { handleBookingmoodWebhook } from './bookingmood-webhook';
import { getPublicBookingStatusFromCoordinator } from './booking-status-coordinator';
import { BookingmoodClient, HttpError, requireBookingmoodClient } from './bookingmood-client';

export { BookingCoordinator } from './booking-coordinator';

const FRAME_ANCESTORS =
  "frame-ancestors 'self' https://remotelyrogers.com https://*.remotelyrogers.com http://localhost:*";

const SITE_WORKER_ORIGIN = 'https://remotely-rogers-web.drakedavisdev.workers.dev';

function isAllowedBrowserOrigin(origin: string): boolean {
  return (
    origin === 'https://remotelyrogers.com' ||
    origin === 'https://www.remotelyrogers.com' ||
    origin === SITE_WORKER_ORIGIN ||
    /^http:\/\/localhost:\d+$/.test(origin)
  );
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = isAllowedBrowserOrigin(origin);

  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://remotelyrogers.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
  };
}

function withEmbedHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', FRAME_ANCESTORS);
  headers.delete('X-Frame-Options');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(request: Request, body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders(request),
      'Cache-Control': 'no-store',
    },
  });
}

function requestOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin && isAllowedBrowserOrigin(origin)) {
    return origin;
  }

  return new URL(request.url).origin;
}

export default {
  async fetch(request: Request, env: BookingWorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      if (url.pathname === '/api/availability' && request.method === 'POST') {
        const body = (await request.json()) as {
          arrival: string;
          departure: string;
          adults: number;
        };

        const client = env.BOOKINGMOOD_API_KEY?.trim()
          ? requireBookingmoodClient(env.BOOKINGMOOD_API_KEY)
          : new BookingmoodClient('offline');
        const result = await buildAvailabilityResponse(body, client, env, requestOrigin(request));
        return json(request, result);
      }

      if (url.pathname === '/api/products' && request.method === 'GET') {
        const client = requireBookingmoodClient(env.BOOKINGMOOD_API_KEY);
        const products = await listPublicProducts(client, env);
        return json(request, { products });
      }

      if (url.pathname === '/api/booking/status' && request.method === 'GET') {
        const reference = url.searchParams.get('reference')?.trim() ?? '';
        if (!reference) {
          throw new HttpError(400, 'reference query parameter is required.');
        }

        if (!env.BOOKING_COORDINATOR) {
          throw new HttpError(
            503,
            'Booking status lookup requires BOOKING_COORDINATOR durable object binding.',
          );
        }

        const status = await getPublicBookingStatusFromCoordinator(env, reference);
        const payload: PublicBookingStatus = status ?? {
          reference,
          paymentRecorded: false,
          bookingConfirmed: false,
          cancelled: false,
          updatedAt: new Date(0).toISOString(),
          verified: false,
        };

        return json(request, {
          ...payload,
          verified: !!status,
        });
      }

      if (url.pathname === '/api/checkout' && request.method === 'POST') {
        const body = (await request.json()) as GroupCheckoutRequest;
        const client = requireBookingmoodClient(env.BOOKINGMOOD_API_KEY);
        const idempotencyKey = request.headers.get('Idempotency-Key') ?? undefined;
        const result = await createBookingCheckout(
          body,
          client,
          env,
          requestOrigin(request),
          idempotencyKey,
        );

        return json(request, {
          url: result.paymentUrl,
          paymentUrl: result.paymentUrl,
          reference: result.reference,
          bookingId: result.bookingId,
          indeterminate: result.indeterminate ?? false,
        });
      }

      if (url.pathname === '/api/bookingmood/webhook' && request.method === 'POST') {
        const result = await handleBookingmoodWebhook(
          request,
          env.BOOKINGMOOD_WEBHOOK_SIGNING_SECRET,
          env,
        );
        return json(request, result);
      }

      if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
        throw new HttpError(410, 'Legacy payment webhook route is retired.');
      }

      if (url.pathname === '/api/checkout/session' && request.method === 'GET') {
        throw new HttpError(410, 'Legacy checkout session route is retired.');
      }
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof Error ? error.message : 'Unable to process the booking request.';
      return json(request, { error: message }, status);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withEmbedHeaders(assetResponse);
  },
} satisfies ExportedHandler<BookingWorkerEnv>;
