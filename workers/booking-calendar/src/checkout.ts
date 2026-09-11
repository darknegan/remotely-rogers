import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  CabinCheckoutResult,
  CheckoutSessionResponse,
  GroupCheckoutRequest,
  GroupCheckoutResponse,
  StripeCheckoutResponse,
} from '../../../src/app/core/models/booking.models';
import { isCabinRangeAvailable } from './availability';
import {
  formatCabinCsv,
  formatLodgifyResults,
  formatStayLabel,
  parseCabinCsv,
  parseLodgifyResults,
  quoteStayCents,
  shortCabinName,
  truncateMeta,
} from './checkout-format';
import { LodgifyClient } from './lodgify';
import {
  paymentIntentId,
  paymentIntentMetadata,
  StripeClient,
  StripeCheckoutSession,
} from './stripe';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SESSION_ID = /^cs_(test|live)_/;

export async function createStripeCheckoutSession(
  request: GroupCheckoutRequest,
  client: LodgifyClient,
  stripe: StripeClient,
  origin: string,
): Promise<StripeCheckoutResponse> {
  const guest = request.guest;
  const firstName = guest?.firstName?.trim() ?? '';
  const lastName = guest?.lastName?.trim() ?? '';
  const email = guest?.email?.trim() ?? '';
  const phone = guest?.phone?.trim() ?? '';
  const notes = guest?.notes?.trim() ?? '';
  const adults = Math.max(1, request.adults || 1);
  const cabins = Array.isArray(request.cabins) ? request.cabins : [];

  if (!firstName || !lastName || !email) {
    throw new HttpError(400, 'First name, last name, and email are required.');
  }

  if (cabins.length === 0) {
    throw new HttpError(400, 'Select at least one cabin.');
  }

  const priced: Array<{
    cabinId: number;
    name: string;
    arrival: string;
    departure: string;
    amountCents: number;
  }> = [];
  const unavailable: string[] = [];

  for (const line of cabins) {
    const cabin = CABIN_CONFIG.cabins.find((item) => item.id === line.cabinId);
    if (!cabin) {
      throw new HttpError(400, `Unknown cabin ${line.cabinId}.`);
    }

    if (!DATE_KEY.test(line.arrival) || !DATE_KEY.test(line.departure)) {
      throw new HttpError(400, 'Arrival and departure must be YYYY-MM-DD.');
    }

    const open = await isCabinRangeAvailable(
      client,
      cabin.lodgifyPropertyId,
      line.arrival,
      line.departure,
    );
    if (!open) {
      unavailable.push(shortCabinName(cabin.name));
      continue;
    }

    const rates = await client.getRatesCalendar(
      cabin.lodgifyPropertyId,
      cabin.lodgifyRoomTypeId,
      line.arrival,
      line.departure,
    );
    const amountCents = rates
      ? quoteStayCents(rates.dayRates, rates.cleaningFee, line.arrival, line.departure)
      : null;
    if (amountCents == null || amountCents < 50) {
      throw new HttpError(400, `Unable to price ${shortCabinName(cabin.name)}.`);
    }

    priced.push({
      cabinId: cabin.id,
      name: shortCabinName(cabin.name),
      arrival: line.arrival,
      departure: line.departure,
      amountCents,
    });
  }

  if (unavailable.length > 0) {
    throw new HttpError(
      409,
      `Some cabins are no longer available: ${unavailable.join(', ')}.`,
    );
  }

  if (priced.length === 0) {
    throw new HttpError(409, 'None of the selected cabins are available.');
  }

  const groupId = crypto.randomUUID();
  const embedQuery = request.embed ? '&embed=1' : '';
  const cancelEmbed = request.embed ? '?embed=1' : '';
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('customer_email', email);
  params.set(
    'success_url',
    `${origin}/group-booking/checkout/success?session_id={CHECKOUT_SESSION_ID}${embedQuery}`,
  );
  params.set('cancel_url', `${origin}/group-booking/checkout${cancelEmbed}`);
  params.set('metadata[groupId]', groupId);
  params.set('metadata[adults]', String(adults));
  params.set('metadata[firstName]', truncateMeta(firstName, 200));
  params.set('metadata[lastName]', truncateMeta(lastName, 200));
  params.set('metadata[email]', truncateMeta(email, 200));
  if (phone) {
    params.set('metadata[phone]', truncateMeta(phone, 200));
  }
  if (notes) {
    params.set('metadata[notes]', truncateMeta(notes, 200));
  }
  params.set(
    'metadata[cabins]',
    truncateMeta(
      formatCabinCsv(
        priced.map((item) => ({
          cabinId: item.cabinId,
          arrival: item.arrival,
          departure: item.departure,
        })),
      ),
    ),
  );

  priced.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, '1');
    params.set(`line_items[${index}][price_data][currency]`, 'usd');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.amountCents));
    params.set(
      `line_items[${index}][price_data][product_data][name]`,
      `${item.name} — ${formatStayLabel(item.arrival, item.departure)}`,
    );
  });

  const session = await stripe.createCheckoutSession(params);
  if (!session.url) {
    throw new HttpError(502, 'Stripe did not return a checkout URL.');
  }

  return { url: session.url };
}

export async function getCheckoutSessionStatus(
  sessionId: string,
  client: LodgifyClient,
  stripe: StripeClient,
): Promise<CheckoutSessionResponse> {
  if (!SESSION_ID.test(sessionId)) {
    throw new HttpError(400, 'Invalid Stripe session.');
  }

  const session = await stripe.retrieveSession(sessionId);
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { paid: false, fulfilled: false };
  }

  const fulfilled = await fulfillPaidSession(session, client, stripe);
  return {
    paid: true,
    fulfilled: true,
    groupId: fulfilled.groupId,
    results: fulfilled.results,
  };
}

export async function fulfillPaidSession(
  session: StripeCheckoutSession,
  client: LodgifyClient,
  stripe: StripeClient,
): Promise<GroupCheckoutResponse> {
  const metadata = session.metadata ?? {};
  const existing = paymentIntentMetadata(session);
  if (existing['lodgify_fulfilled'] === '1' && existing['lodgify_results']) {
    return {
      groupId: existing['lodgify_group'] || metadata['groupId'] || '',
      results: parseLodgifyResults(existing['lodgify_results']),
    };
  }

  if (existing['lodgify_fulfilled'] === 'pending') {
    const refreshed = await stripe.retrieveSession(session.id);
    const refreshedMeta = paymentIntentMetadata(refreshed);
    if (refreshedMeta['lodgify_fulfilled'] === '1' && refreshedMeta['lodgify_results']) {
      return {
        groupId: refreshedMeta['lodgify_group'] || metadata['groupId'] || '',
        results: parseLodgifyResults(refreshedMeta['lodgify_results']),
      };
    }
  }

  const groupId = metadata['groupId'] || crypto.randomUUID();
  const intentId = paymentIntentId(session);
  if (intentId) {
    await stripe.updatePaymentIntentMetadata(intentId, {
      lodgify_fulfilled: 'pending',
      lodgify_group: groupId,
    });
  }

  const results = await createBookedGroupReservations(
    {
      groupId,
      sessionId: session.id,
      firstName: metadata['firstName'] ?? '',
      lastName: metadata['lastName'] ?? '',
      email: metadata['email'] ?? '',
      phone: metadata['phone'] || null,
      notes: metadata['notes'] ?? '',
      adults: Math.max(1, Number(metadata['adults']) || 1),
      cabins: parseCabinCsv(metadata['cabins'] ?? ''),
    },
    client,
  );

  if (intentId) {
    await stripe.updatePaymentIntentMetadata(intentId, {
      lodgify_fulfilled: '1',
      lodgify_group: groupId,
      lodgify_results: truncateMeta(formatLodgifyResults(results)),
    });
  }

  return { groupId, results };
}

async function createBookedGroupReservations(
  input: {
    groupId: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    notes: string;
    adults: number;
    cabins: Array<{ cabinId: number; arrival: string; departure: string }>;
  },
  client: LodgifyClient,
): Promise<CabinCheckoutResult[]> {
  const results: CabinCheckoutResult[] = [];

  for (const line of input.cabins) {
    const cabin = CABIN_CONFIG.cabins.find((item) => item.id === line.cabinId);
    if (!cabin) {
      results.push({ cabinId: line.cabinId, ok: false, error: 'Unknown cabin.' });
      continue;
    }

    try {
      const groupNote = [`Group ${input.groupId}`, `Stripe ${input.sessionId}`, input.notes]
        .filter(Boolean)
        .join('; ');
      const bookingId = await client.createBookedBooking({
        property_id: cabin.lodgifyPropertyId,
        arrival: line.arrival,
        departure: line.departure,
        status: 'Booked',
        source_text: `Remotely Rogers group booking ${input.groupId}`,
        notes: groupNote,
        guest: {
          guest_name: {
            first_name: input.firstName,
            last_name: input.lastName,
          },
          email: input.email,
          phone: input.phone,
        },
        rooms: [
          {
            room_type_id: cabin.lodgifyRoomTypeId,
            guest_breakdown: {
              adults: input.adults,
              children: 0,
              infants: 0,
            },
          },
        ],
      });

      results.push({ cabinId: cabin.id, ok: true, bookingId });
    } catch (error) {
      results.push({
        cabinId: cabin.id,
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to create this reservation.',
      });
    }
  }

  return results;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
