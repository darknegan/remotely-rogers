var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/environments/cabin-config.ts
var CABIN_CONFIG = {
  minNights: 2,
  maxGuestsPerCabin: 4,
  cabins: [
    {
      id: 1,
      lodgifyPropertyId: 756289,
      lodgifyRoomTypeId: 823412,
      name: "Black Gum Getaway-Cozy Forest A-frame Near Bentonville",
      slug: "black-gum-getaway-cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400"
    },
    {
      id: 2,
      lodgifyPropertyId: 756290,
      lodgifyRoomTypeId: 823413,
      name: "Dogwood Den- Cozy Forest A-Frame Near Bentonville",
      slug: "dogwood-den--cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/c17b2188-7f3c-4257-8771-5503b16d1858.png?w=400"
    },
    {
      id: 3,
      lodgifyPropertyId: 756291,
      lodgifyRoomTypeId: 823414,
      name: "Running Spring Retreat-Cozy Forest A-Frame near Bentonville",
      slug: "running-spring-retreat-cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/91876b46-cb42-4ba4-87c8-dc2c7b190553.jpg?w=400"
    },
    {
      id: 4,
      lodgifyPropertyId: 756292,
      lodgifyRoomTypeId: 823415,
      name: "Black Walnut Bungalow-Cozy Forest A-frame near Bentonville",
      slug: "black-walnut-bungalow-cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/8c3d5c24-1ddd-472a-af57-f1717b0814e1.png?w=400"
    },
    {
      id: 5,
      lodgifyPropertyId: 756293,
      lodgifyRoomTypeId: 823416,
      name: "White Oak Haven-Cozy Forest A-frame near Bentonville",
      slug: "white-oak-haven-cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/78268e9b-81a9-42cf-92a2-dbe143cc2cfe.png?w=400"
    },
    {
      id: 6,
      lodgifyPropertyId: 756294,
      lodgifyRoomTypeId: 823417,
      name: "Post Oak Perch-Cozy Forest A-frame Near Bentonville",
      slug: "post-oak-perch-cozy-forest-a-frame-near-bentonville",
      maxGuests: 4,
      imageUrl: "https://l.icdbcdn.com/oh/9667e84e-457b-4086-9999-c736837136d1.jpg?w=400"
    }
  ]
};

// src/app/core/utils/date-utils.ts
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
__name(toDateKey, "toDateKey");
function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}
__name(parseDateKey, "parseDateKey");
function dateKeyFromIso(value) {
  return value.slice(0, 10);
}
__name(dateKeyFromIso, "dateKeyFromIso");
function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}
__name(startOfDay, "startOfDay");
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}
__name(addDays, "addDays");
function eachNight(arrival, departure) {
  const nights = [];
  let current = startOfDay(arrival);
  const end = startOfDay(departure);
  while (current < end) {
    nights.push(new Date(current));
    current = addDays(current, 1);
  }
  return nights;
}
__name(eachNight, "eachNight");

// workers/booking-calendar/src/availability-map.ts
function eachInclusiveDate(startKey, endKey) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const keys = [];
  let current = start;
  while (current <= end) {
    keys.push(toDateKey(current));
    current = addDays(current, 1);
  }
  return keys;
}
__name(eachInclusiveDate, "eachInclusiveDate");
function statusForPeriod(period) {
  if (period.available === 1) {
    return "available";
  }
  if (Array.isArray(period.bookings) && period.bookings.length > 0) {
    return "booked";
  }
  return "blocked";
}
__name(statusForPeriod, "statusForPeriod");
function mapPeriodsToDays(periods, windowNights) {
  const days = {};
  for (const night of windowNights) {
    days[toDateKey(night)] = "blocked";
  }
  for (const period of periods) {
    const start = dateKeyFromIso(period.start);
    const end = dateKeyFromIso(period.end);
    if (start.startsWith("0001-") || end.startsWith("0001-")) {
      continue;
    }
    const status = statusForPeriod(period);
    for (const key of eachInclusiveDate(start, end)) {
      if (key in days) {
        days[key] = status;
      }
    }
  }
  return days;
}
__name(mapPeriodsToDays, "mapPeriodsToDays");
function normalizeAvailabilityPeriods(payload) {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }
    const first = payload[0];
    if (first && Array.isArray(first["periods"])) {
      return payload.flatMap((item) => {
        const record = item;
        return record.periods ?? [];
      });
    }
    if (first && typeof first["start"] === "string") {
      return payload;
    }
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.periods)) {
    return payload.periods;
  }
  return [];
}
__name(normalizeAvailabilityPeriods, "normalizeAvailabilityPeriods");

// workers/booking-calendar/src/availability.ts
var SITE_BASE_URL = "https://remotelyrogers.com";
async function buildAvailabilityResponse(request, client) {
  const arrival = parseDateKey(request.arrival);
  const departure = parseDateKey(request.departure);
  const nights = eachNight(arrival, departure);
  const windowStart = addDays(arrival, -2);
  const windowEnd = addDays(departure, 2);
  const windowNights = eachNight(windowStart, windowEnd);
  const cabins = await Promise.all(
    CABIN_CONFIG.cabins.map(async (cabin) => {
      let days = {};
      for (const night of windowNights) {
        days[toDateKey(night)] = "blocked";
      }
      try {
        const payload = await client.getAvailability(
          cabin.lodgifyPropertyId,
          toDateKey(windowStart),
          toDateKey(windowEnd)
        );
        days = mapPeriodsToDays(normalizeAvailabilityPeriods(payload), windowNights);
      } catch (error) {
        console.error("lodgify_availability_failed", {
          propertyId: cabin.lodgifyPropertyId,
          message: error instanceof Error ? error.message : String(error)
        });
      }
      const stayAvailable = nights.length > 0 && nights.every((night) => days[toDateKey(night)] === "available");
      let dayRates = {};
      let cleaningFee = 0;
      let nightlyRate = 0;
      let totalPrice = 0;
      let currency = "USD";
      try {
        const rates = await client.getRatesCalendar(
          cabin.lodgifyPropertyId,
          cabin.lodgifyRoomTypeId,
          toDateKey(windowStart),
          toDateKey(windowEnd)
        );
        if (rates) {
          dayRates = rates.dayRates;
          cleaningFee = rates.cleaningFee;
          currency = rates.currency;
          const windowPrices = windowNights.map((night) => dayRates[toDateKey(night)]?.price).filter((price) => price != null);
          nightlyRate = windowPrices.length > 0 ? windowPrices.reduce((sum, price) => sum + price, 0) / windowPrices.length : 0;
          const stayPrices = nights.map((night) => dayRates[toDateKey(night)]?.price).filter((price) => price != null);
          totalPrice = stayPrices.reduce((sum, price) => sum + price, 0) + cleaningFee;
        }
      } catch (error) {
        console.error("lodgify_rates_failed", {
          propertyId: cabin.lodgifyPropertyId,
          message: error instanceof Error ? error.message : String(error)
        });
      }
      return {
        cabinId: cabin.id,
        nightlyRate,
        totalPrice,
        currency,
        available: stayAvailable,
        days,
        dayRates,
        cleaningFee,
        bookingUrl: `${SITE_BASE_URL}/en/${cabin.slug}/`
      };
    })
  );
  return { cabins };
}
__name(buildAvailabilityResponse, "buildAvailabilityResponse");
async function isCabinRangeAvailable(client, propertyId, arrival, departure) {
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  if (nights.length === 0) {
    return false;
  }
  const payload = await client.getAvailability(propertyId, arrival, departure);
  const days = mapPeriodsToDays(normalizeAvailabilityPeriods(payload), nights);
  return nights.every((night) => days[toDateKey(night)] === "available");
}
__name(isCabinRangeAvailable, "isCabinRangeAvailable");

// workers/booking-calendar/src/checkout-format.ts
function shortCabinName(name) {
  return name.split("-")[0]?.trim() || name;
}
__name(shortCabinName, "shortCabinName");
function formatStayLabel(arrival, departure) {
  const start = parseDateKey(arrival);
  const end = parseDateKey(departure);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthDay.format(start)}\u2013${end.getDate()}`;
  }
  return `${monthDay.format(start)}\u2013${monthDay.format(end)}`;
}
__name(formatStayLabel, "formatStayLabel");
function formatCabinCsv(cabins) {
  return cabins.map((cabin) => `${cabin.cabinId}:${cabin.arrival}:${cabin.departure}`).join(",");
}
__name(formatCabinCsv, "formatCabinCsv");
function parseCabinCsv(value) {
  if (!value) {
    return [];
  }
  return value.split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [cabinId, arrival, departure] = part.split(":");
    return {
      cabinId: Number(cabinId),
      arrival,
      departure
    };
  }).filter((line) => Number.isFinite(line.cabinId) && line.arrival && line.departure);
}
__name(parseCabinCsv, "parseCabinCsv");
function formatLodgifyResults(results) {
  return results.map(
    (result) => result.ok ? `${result.cabinId}:ok:${result.bookingId ?? ""}` : `${result.cabinId}:fail`
  ).join(",");
}
__name(formatLodgifyResults, "formatLodgifyResults");
function parseLodgifyResults(value) {
  if (!value) {
    return [];
  }
  return value.split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [cabinId, status, bookingId] = part.split(":");
    const id = Number(cabinId);
    if (status === "ok") {
      const parsedId = Number(bookingId);
      return {
        cabinId: id,
        ok: true,
        bookingId: Number.isFinite(parsedId) ? parsedId : void 0
      };
    }
    return { cabinId: id, ok: false, error: "Reservation was not created." };
  });
}
__name(parseLodgifyResults, "parseLodgifyResults");
function quoteStayCents(dayRates, cleaningFee, arrival, departure) {
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  if (nights.length === 0) {
    return null;
  }
  let sum = 0;
  for (const night of nights) {
    const price = dayRates[toDateKey(night)]?.price;
    if (price == null) {
      return null;
    }
    sum += price;
  }
  return Math.round((sum + cleaningFee) * 100);
}
__name(quoteStayCents, "quoteStayCents");
function truncateMeta(value, max = 500) {
  return value.length <= max ? value : value.slice(0, max);
}
__name(truncateMeta, "truncateMeta");

// workers/booking-calendar/src/stripe.ts
var StripeClient = class {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  secretKey;
  static {
    __name(this, "StripeClient");
  }
  async createCheckoutSession(params) {
    return this.request("POST", "/v1/checkout/sessions", params);
  }
  async retrieveSession(sessionId) {
    const params = new URLSearchParams();
    params.append("expand[]", "payment_intent");
    return this.request(
      "GET",
      `/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${params}`
    );
  }
  async updatePaymentIntentMetadata(paymentIntentId2, metadata) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, value);
    }
    return this.request(
      "POST",
      `/v1/payment_intents/${encodeURIComponent(paymentIntentId2)}`,
      params
    );
  }
  async request(method, path, body) {
    const response = await fetch(`https://api.stripe.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: method === "GET" ? void 0 : body
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(extractStripeError(text, response.status));
    }
    return JSON.parse(text);
  }
};
function paymentIntentId(session) {
  if (typeof session.payment_intent === "string" && session.payment_intent) {
    return session.payment_intent;
  }
  if (session.payment_intent && typeof session.payment_intent === "object") {
    return session.payment_intent.id;
  }
  return null;
}
__name(paymentIntentId, "paymentIntentId");
function paymentIntentMetadata(session) {
  if (session.payment_intent && typeof session.payment_intent === "object") {
    return session.payment_intent.metadata ?? {};
  }
  return {};
}
__name(paymentIntentMetadata, "paymentIntentMetadata");
async function verifyStripeSignature(payload, header, secret, toleranceSec = 300) {
  let timestamp = "";
  const signatures = [];
  for (const part of header.split(",")) {
    const [key, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (key === "t") {
      timestamp = value;
    }
    if (key === "v1") {
      signatures.push(value);
    }
  }
  if (!timestamp || signatures.length === 0) {
    return false;
  }
  const age = Math.abs(Math.floor(Date.now() / 1e3) - Number(timestamp));
  if (!Number.isFinite(Number(timestamp)) || age > toleranceSec) {
    return false;
  }
  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`);
  return signatures.some((signature) => timingSafeEqual(signature, expected));
}
__name(verifyStripeSignature, "verifyStripeSignature");
async function hmacSha256Hex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hmacSha256Hex, "hmacSha256Hex");
function timingSafeEqual(left, right) {
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
__name(timingSafeEqual, "timingSafeEqual");
function extractStripeError(body, status) {
  try {
    const parsed = JSON.parse(body);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
  }
  const trimmed = body.trim();
  return trimmed || `Stripe request failed (${status}).`;
}
__name(extractStripeError, "extractStripeError");

// workers/booking-calendar/src/checkout.ts
var DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
var SESSION_ID = /^cs_(test|live)_/;
async function createStripeCheckoutSession(request, client, stripe, origin) {
  const guest = request.guest;
  const firstName = guest?.firstName?.trim() ?? "";
  const lastName = guest?.lastName?.trim() ?? "";
  const email = guest?.email?.trim() ?? "";
  const phone = guest?.phone?.trim() ?? "";
  const notes = guest?.notes?.trim() ?? "";
  const adults = Math.max(1, request.adults || 1);
  const cabins = Array.isArray(request.cabins) ? request.cabins : [];
  if (!firstName || !lastName || !email) {
    throw new HttpError(400, "First name, last name, and email are required.");
  }
  if (cabins.length === 0) {
    throw new HttpError(400, "Select at least one cabin.");
  }
  const priced = [];
  const unavailable = [];
  for (const line of cabins) {
    const cabin = CABIN_CONFIG.cabins.find((item) => item.id === line.cabinId);
    if (!cabin) {
      throw new HttpError(400, `Unknown cabin ${line.cabinId}.`);
    }
    if (!DATE_KEY.test(line.arrival) || !DATE_KEY.test(line.departure)) {
      throw new HttpError(400, "Arrival and departure must be YYYY-MM-DD.");
    }
    const open = await isCabinRangeAvailable(
      client,
      cabin.lodgifyPropertyId,
      line.arrival,
      line.departure
    );
    if (!open) {
      unavailable.push(shortCabinName(cabin.name));
      continue;
    }
    const rates = await client.getRatesCalendar(
      cabin.lodgifyPropertyId,
      cabin.lodgifyRoomTypeId,
      line.arrival,
      line.departure
    );
    const amountCents = rates ? quoteStayCents(rates.dayRates, rates.cleaningFee, line.arrival, line.departure) : null;
    if (amountCents == null || amountCents < 50) {
      throw new HttpError(400, `Unable to price ${shortCabinName(cabin.name)}.`);
    }
    priced.push({
      cabinId: cabin.id,
      name: shortCabinName(cabin.name),
      arrival: line.arrival,
      departure: line.departure,
      amountCents
    });
  }
  if (unavailable.length > 0) {
    throw new HttpError(
      409,
      `Some cabins are no longer available: ${unavailable.join(", ")}.`
    );
  }
  if (priced.length === 0) {
    throw new HttpError(409, "None of the selected cabins are available.");
  }
  const groupId = crypto.randomUUID();
  const embedQuery = request.embed ? "&embed=1" : "";
  const cancelEmbed = request.embed ? "?embed=1" : "";
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("customer_email", email);
  params.set(
    "success_url",
    `${origin}/group-booking/checkout/success?session_id={CHECKOUT_SESSION_ID}${embedQuery}`
  );
  params.set("cancel_url", `${origin}/group-booking/checkout${cancelEmbed}`);
  params.set("metadata[groupId]", groupId);
  params.set("metadata[adults]", String(adults));
  params.set("metadata[firstName]", truncateMeta(firstName, 200));
  params.set("metadata[lastName]", truncateMeta(lastName, 200));
  params.set("metadata[email]", truncateMeta(email, 200));
  if (phone) {
    params.set("metadata[phone]", truncateMeta(phone, 200));
  }
  if (notes) {
    params.set("metadata[notes]", truncateMeta(notes, 200));
  }
  params.set(
    "metadata[cabins]",
    truncateMeta(
      formatCabinCsv(
        priced.map((item) => ({
          cabinId: item.cabinId,
          arrival: item.arrival,
          departure: item.departure
        }))
      )
    )
  );
  priced.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, "1");
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.amountCents));
    params.set(
      `line_items[${index}][price_data][product_data][name]`,
      `${item.name} \u2014 ${formatStayLabel(item.arrival, item.departure)}`
    );
  });
  const session = await stripe.createCheckoutSession(params);
  if (!session.url) {
    throw new HttpError(502, "Stripe did not return a checkout URL.");
  }
  return { url: session.url };
}
__name(createStripeCheckoutSession, "createStripeCheckoutSession");
async function getCheckoutSessionStatus(sessionId, client, stripe) {
  if (!SESSION_ID.test(sessionId)) {
    throw new HttpError(400, "Invalid Stripe session.");
  }
  const session = await stripe.retrieveSession(sessionId);
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { paid: false, fulfilled: false };
  }
  const fulfilled = await fulfillPaidSession(session, client, stripe);
  return {
    paid: true,
    fulfilled: true,
    groupId: fulfilled.groupId,
    results: fulfilled.results
  };
}
__name(getCheckoutSessionStatus, "getCheckoutSessionStatus");
async function fulfillPaidSession(session, client, stripe) {
  const metadata = session.metadata ?? {};
  const existing = paymentIntentMetadata(session);
  if (existing["lodgify_fulfilled"] === "1" && existing["lodgify_results"]) {
    return {
      groupId: existing["lodgify_group"] || metadata["groupId"] || "",
      results: parseLodgifyResults(existing["lodgify_results"])
    };
  }
  if (existing["lodgify_fulfilled"] === "pending") {
    const refreshed = await stripe.retrieveSession(session.id);
    const refreshedMeta = paymentIntentMetadata(refreshed);
    if (refreshedMeta["lodgify_fulfilled"] === "1" && refreshedMeta["lodgify_results"]) {
      return {
        groupId: refreshedMeta["lodgify_group"] || metadata["groupId"] || "",
        results: parseLodgifyResults(refreshedMeta["lodgify_results"])
      };
    }
  }
  const groupId = metadata["groupId"] || crypto.randomUUID();
  const intentId = paymentIntentId(session);
  if (intentId) {
    await stripe.updatePaymentIntentMetadata(intentId, {
      lodgify_fulfilled: "pending",
      lodgify_group: groupId
    });
  }
  const results = await createBookedGroupReservations(
    {
      groupId,
      sessionId: session.id,
      firstName: metadata["firstName"] ?? "",
      lastName: metadata["lastName"] ?? "",
      email: metadata["email"] ?? "",
      phone: metadata["phone"] || null,
      notes: metadata["notes"] ?? "",
      adults: Math.max(1, Number(metadata["adults"]) || 1),
      cabins: parseCabinCsv(metadata["cabins"] ?? "")
    },
    client
  );
  if (intentId) {
    await stripe.updatePaymentIntentMetadata(intentId, {
      lodgify_fulfilled: "1",
      lodgify_group: groupId,
      lodgify_results: truncateMeta(formatLodgifyResults(results))
    });
  }
  return { groupId, results };
}
__name(fulfillPaidSession, "fulfillPaidSession");
async function createBookedGroupReservations(input, client) {
  const results = [];
  for (const line of input.cabins) {
    const cabin = CABIN_CONFIG.cabins.find((item) => item.id === line.cabinId);
    if (!cabin) {
      results.push({ cabinId: line.cabinId, ok: false, error: "Unknown cabin." });
      continue;
    }
    try {
      const groupNote = [`Group ${input.groupId}`, `Stripe ${input.sessionId}`, input.notes].filter(Boolean).join("; ");
      const bookingId = await client.createBookedBooking({
        property_id: cabin.lodgifyPropertyId,
        arrival: line.arrival,
        departure: line.departure,
        status: "Booked",
        source_text: `Remotely Rogers group booking ${input.groupId}`,
        notes: groupNote,
        guest: {
          guest_name: {
            first_name: input.firstName,
            last_name: input.lastName
          },
          email: input.email,
          phone: input.phone
        },
        rooms: [
          {
            room_type_id: cabin.lodgifyRoomTypeId,
            guest_breakdown: {
              adults: input.adults,
              children: 0,
              infants: 0
            }
          }
        ]
      });
      results.push({ cabinId: cabin.id, ok: true, bookingId });
    } catch (error) {
      results.push({
        cabinId: cabin.id,
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create this reservation."
      });
    }
  }
  return results;
}
__name(createBookedGroupReservations, "createBookedGroupReservations");
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
  status;
  static {
    __name(this, "HttpError");
  }
};

// workers/booking-calendar/src/lodgify.ts
var LODGIFY_BASE = "https://api.lodgify.com";
var LodgifyClient = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  apiKey;
  static {
    __name(this, "LodgifyClient");
  }
  async request(path, init = {}) {
    return fetch(`${LODGIFY_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-ApiKey": this.apiKey,
        ...init.headers ?? {}
      }
    });
  }
  async getAvailability(propertyId, from, to) {
    const params = new URLSearchParams({ start: from, end: to });
    const response = await this.request(`/v2/availability/${propertyId}?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Availability for property ${propertyId} failed (${response.status}): ${body.slice(0, 200)}`
      );
    }
    return response.json();
  }
  async getRatesCalendar(propertyId, roomTypeId, from, to) {
    const params = new URLSearchParams({
      HouseId: String(propertyId),
      RoomTypeId: String(roomTypeId),
      StartDate: from,
      EndDate: to
    });
    const response = await this.request(`/v2/rates/calendar?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("lodgify_rates_http_error", {
        propertyId,
        status: response.status,
        body: body.slice(0, 200)
      });
      return null;
    }
    return parseRatesCalendarDays(await response.json());
  }
  async createTentativeBooking(payload) {
    return this.createBooking(payload, "tentative");
  }
  async createBookedBooking(payload) {
    return this.createBooking(payload, "book");
  }
  async createBooking(payload, statusPath) {
    const response = await this.request("/v1/reservation/booking", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(extractErrorMessage(text, response.status));
    }
    const bookingId = parseBookingId(text);
    if (bookingId == null) {
      throw new Error("Lodgify created a booking but did not return an id.");
    }
    try {
      await this.request(`/v1/reservation/booking/${bookingId}/${statusPath}`, {
        method: "PUT"
      });
    } catch {
    }
    return bookingId;
  }
};
function parseRatesCalendarDays(payload) {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record["calendar_items"])) {
    return null;
  }
  const dayRates = {};
  for (const item of record["calendar_items"]) {
    const day = asRecord(item);
    const date = day ? asString(day["date"]) : null;
    if (!date) {
      continue;
    }
    const prices = Array.isArray(day?.["prices"]) ? day["prices"] : [];
    const firstPrice = asRecord(prices[0]);
    const nightly = firstPrice ? asNumber(firstPrice["price_per_day"]) : null;
    if (nightly == null) {
      continue;
    }
    dayRates[date] = {
      price: nightly,
      minStay: firstPrice ? asNumber(firstPrice["min_stay"]) ?? 1 : 1
    };
  }
  if (Object.keys(dayRates).length === 0) {
    return null;
  }
  let cleaningFee = 0;
  const settings = asRecord(record["rate_settings"]);
  const feeList = settings && Array.isArray(settings["fees"]) ? settings["fees"] : [];
  for (const fee of feeList) {
    const feeRecord = asRecord(fee);
    const price = feeRecord ? asRecord(feeRecord["price"]) : null;
    const amount = price ? asNumber(price["amount"]) : null;
    if (amount != null) {
      cleaningFee += amount;
    }
  }
  return {
    dayRates,
    cleaningFee,
    currency: settings && asString(settings["currency_code"]) || "USD"
  };
}
__name(parseRatesCalendarDays, "parseRatesCalendarDays");
function parseBookingId(body) {
  const trimmed = body.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return parsed;
    }
    const record = asRecord(parsed);
    const id = record ? asNumber(record["id"]) : null;
    return id;
  } catch {
    return null;
  }
}
__name(parseBookingId, "parseBookingId");
function extractErrorMessage(body, status) {
  try {
    const record = asRecord(JSON.parse(body));
    const message = record ? asString(record["message"]) ?? asString(record["error"]) : null;
    if (message) {
      return message;
    }
  } catch {
  }
  const trimmed = body.trim();
  return trimmed || `Lodgify booking failed (${status}).`;
}
__name(extractErrorMessage, "extractErrorMessage");
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}
__name(asRecord, "asRecord");
function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
__name(asNumber, "asNumber");
function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
__name(asString, "asString");

// workers/booking-calendar/src/index.ts
var FRAME_ANCESTORS = "frame-ancestors 'self' https://remotelyrogers.com https://*.remotelyrogers.com http://localhost:*";
function corsHeaders(request) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = origin === "https://remotelyrogers.com" || origin === "https://www.remotelyrogers.com" || /^http:\/\/localhost:\d+$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://remotelyrogers.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(corsHeaders, "corsHeaders");
function withEmbedHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", FRAME_ANCESTORS);
  headers.delete("X-Frame-Options");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(withEmbedHeaders, "withEmbedHeaders");
function json(request, body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "no-store"
    }
  });
}
__name(json, "json");
function requestOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && /^https:\/\/(www\.)?remotelyrogers\.com$|^http:\/\/localhost:\d+$/.test(origin)) {
    return origin;
  }
  return new URL(request.url).origin;
}
__name(requestOrigin, "requestOrigin");
function requireLodgifyClient(env) {
  const apiKey = env.LODGIFY_API_KEY?.trim();
  if (!apiKey) {
    throw new HttpError(503, "LODGIFY_API_KEY is not configured on the booking worker.");
  }
  console.log("lodgify_key_meta", { length: apiKey.length });
  return new LodgifyClient(apiKey);
}
__name(requireLodgifyClient, "requireLodgifyClient");
function requireStripeClient(env) {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new HttpError(503, "STRIPE_SECRET_KEY is not configured on the booking worker.");
  }
  return new StripeClient(secret);
}
__name(requireStripeClient, "requireStripeClient");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    try {
      if (url.pathname === "/api/availability" && request.method === "POST") {
        const body = await request.json();
        const cabins = await buildAvailabilityResponse(body, requireLodgifyClient(env));
        return json(request, cabins);
      }
      if (url.pathname === "/api/checkout" && request.method === "POST") {
        const body = await request.json();
        const result = await createStripeCheckoutSession(
          body,
          requireLodgifyClient(env),
          requireStripeClient(env),
          requestOrigin(request)
        );
        return json(request, result);
      }
      if (url.pathname === "/api/checkout/session" && request.method === "GET") {
        const sessionId = url.searchParams.get("session_id") ?? "";
        const result = await getCheckoutSessionStatus(
          sessionId,
          requireLodgifyClient(env),
          requireStripeClient(env)
        );
        return json(request, result);
      }
      if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
        const payload = await request.text();
        const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!secret) {
          throw new HttpError(503, "STRIPE_WEBHOOK_SECRET is not configured on the booking worker.");
        }
        const signature = request.headers.get("Stripe-Signature") ?? "";
        const valid = await verifyStripeSignature(payload, signature, secret);
        if (!valid) {
          throw new HttpError(400, "Invalid Stripe signature.");
        }
        const event = JSON.parse(payload);
        if (event.type === "checkout.session.completed" && event.data.object.id) {
          await getCheckoutSessionStatus(
            event.data.object.id,
            requireLodgifyClient(env),
            requireStripeClient(env)
          );
        }
        return json(request, { received: true });
      }
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unable to process the booking request.";
      return json(request, { error: message }, status);
    }
    const assetResponse = await env.ASSETS.fetch(request);
    return withEmbedHeaders(assetResponse);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-RXo097/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-RXo097/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
