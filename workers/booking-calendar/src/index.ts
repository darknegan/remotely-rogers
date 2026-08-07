import { buildAvailabilityResponse } from './availability';

interface Env {
  ASSETS: Fetcher;
}

const FRAME_ANCESTORS =
  "frame-ancestors 'self' https://remotelyrogers.com https://*.remotelyrogers.com http://localhost:*";

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://remotelyrogers.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/api/availability' && request.method === 'POST') {
      const body = (await request.json()) as {
        arrival: string;
        departure: string;
        adults: number;
      };

      return Response.json(buildAvailabilityResponse(body), {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'no-store',
        },
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withEmbedHeaders(assetResponse);
  },
} satisfies ExportedHandler<Env>;
