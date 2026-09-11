export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  payment_status: string;
  payment_intent: string | StripePaymentIntent | null;
  metadata: Record<string, string> | null;
}

export interface StripePaymentIntent {
  id: string;
  metadata: Record<string, string> | null;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
}

export class StripeClient {
  constructor(private readonly secretKey: string) {}

  async createCheckoutSession(params: URLSearchParams): Promise<StripeCheckoutSession> {
    return this.request<StripeCheckoutSession>('POST', '/v1/checkout/sessions', params);
  }

  async retrieveSession(sessionId: string): Promise<StripeCheckoutSession> {
    const params = new URLSearchParams();
    params.append('expand[]', 'payment_intent');
    return this.request<StripeCheckoutSession>(
      'GET',
      `/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${params}`,
    );
  }

  async updatePaymentIntentMetadata(
    paymentIntentId: string,
    metadata: Record<string, string>,
  ): Promise<StripePaymentIntent> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
    }

    return this.request<StripePaymentIntent>(
      'POST',
      `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      params,
    );
  }

  private async request<T>(method: string, path: string, body?: URLSearchParams): Promise<T> {
    const response = await fetch(`https://api.stripe.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: method === 'GET' ? undefined : body,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(extractStripeError(text, response.status));
    }

    return JSON.parse(text) as T;
  }
}

export function paymentIntentId(session: StripeCheckoutSession): string | null {
  if (typeof session.payment_intent === 'string' && session.payment_intent) {
    return session.payment_intent;
  }

  if (session.payment_intent && typeof session.payment_intent === 'object') {
    return session.payment_intent.id;
  }

  return null;
}

export function paymentIntentMetadata(session: StripeCheckoutSession): Record<string, string> {
  if (session.payment_intent && typeof session.payment_intent === 'object') {
    return session.payment_intent.metadata ?? {};
  }

  return {};
}

export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of header.split(',')) {
    const [key, ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't') {
      timestamp = value;
    }
    if (key === 'v1') {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(Number(timestamp)) || age > toleranceSec) {
    return false;
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`);
  return signatures.some((signature) => timingSafeEqual(signature, expected));
}

export async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const max = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let i = 0; i < max; i++) {
    diff |= (leftBytes[i] ?? 0) ^ (rightBytes[i] ?? 0);
  }

  return diff === 0;
}

function extractStripeError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Use the raw body when it is not JSON.
  }

  const trimmed = body.trim();
  return trimmed || `Stripe request failed (${status}).`;
}
