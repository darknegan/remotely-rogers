import { GroupCheckoutRequest } from '../../../src/app/core/models/booking.models';
import { buildAvailabilityResponse } from './availability';
import {
  createStripeCheckoutSession,
  getCheckoutSessionStatus,
  HttpError,
} from './checkout';
import { LodgifyClient } from './lodgify';
import { StripeClient, StripeWebhookEvent, verifyStripeSignature } from './stripe';

interface Env {
  ASSETS: Fetcher;
  LODGIFY_API_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

const FRAME_ANCESTORS =
  "frame-ancestors 'self' https://remotelyrogers.com https://*.remotelyrogers.com http://localhost:*";

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed =
    origin === 'https://remotelyrogers.com' ||
    origin === 'https://www.remotelyrogers.com' ||
    /^http:\/\/localhost:\d+$/.test(origin);

  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://remotelyrogers.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  if (origin && /^https:\/\/(www\.)?remotelyrogers\.com$|^http:\/\/localhost:\d+$/.test(origin)) {
    return origin;
  }

  return new URL(request.url).origin;
}

function requireLodgifyClient(env: Env): LodgifyClient {
  const apiKey = env.LODGIFY_API_KEY?.trim();
  if (!apiKey) {
    throw new HttpError(503, 'LODGIFY_API_KEY is not configured on the booking worker.');
  }

  console.log('lodgify_key_meta', { length: apiKey.length });
  return new LodgifyClient(apiKey);
}

function requireStripeClient(env: Env): StripeClient {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new HttpError(503, 'STRIPE_SECRET_KEY is not configured on the booking worker.');
  }

  return new StripeClient(secret);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

        const cabins = await buildAvailabilityResponse(body, requireLodgifyClient(env));
        return json(request, cabins);
      }

      if (url.pathname === '/api/checkout' && request.method === 'POST') {
        const body = (await request.json()) as GroupCheckoutRequest;
        const result = await createStripeCheckoutSession(
          body,
          requireLodgifyClient(env),
          requireStripeClient(env),
          requestOrigin(request),
        );
        return json(request, result);
      }

      if (url.pathname === '/api/checkout/session' && request.method === 'GET') {
        const sessionId = url.searchParams.get('session_id') ?? '';
        const result = await getCheckoutSessionStatus(
          sessionId,
          requireLodgifyClient(env),
          requireStripeClient(env),
        );
        return json(request, result);
      }

      if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
        const payload = await request.text();
        const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!secret) {
          throw new HttpError(503, 'STRIPE_WEBHOOK_SECRET is not configured on the booking worker.');
        }

        const signature = request.headers.get('Stripe-Signature') ?? '';
        const valid = await verifyStripeSignature(payload, signature, secret);
        if (!valid) {
          throw new HttpError(400, 'Invalid Stripe signature.');
        }

        const event = JSON.parse(payload) as StripeWebhookEvent;
        if (event.type === 'checkout.session.completed' && event.data.object.id) {
          await getCheckoutSessionStatus(
            event.data.object.id,
            requireLodgifyClient(env),
            requireStripeClient(env),
          );
        }

        return json(request, { received: true });
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
} satisfies ExportedHandler<Env>;
