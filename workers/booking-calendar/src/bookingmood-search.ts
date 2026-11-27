export type BookingmoodIntervalStatus =
  | 'available'
  | 'booked'
  | 'closed'
  | 'pending'
  | 'unavailable';

export interface NormalizedSearchResult {
  productId: string;
  match: boolean;
  availability: BookingmoodIntervalStatus | null;
  occupancyMatches: boolean;
  optionsMatch: boolean;
  price: { min: number; max: number } | null;
}

/** Accept a raw JSON array or common PostgREST / API wrappers. */
export function coerceSearchResultRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    for (const key of ['data', 'results', 'items'] as const) {
      const nested = record[key];
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  return [];
}

function readSearchPrice(record: Record<string, unknown>): { min: number; max: number } | null {
  const priceRaw = record.price;
  if (!priceRaw || typeof priceRaw !== 'object') {
    return null;
  }

  const price = priceRaw as Record<string, unknown>;
  const min = Number(price.min ?? price.minimum);
  const max = Number(price.max ?? price.maximum);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return { min, max };
  }

  return null;
}

function readSearchProductId(record: Record<string, unknown>): string {
  const direct = record.productId ?? record.product_id;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const product = record.product;
  if (product && typeof product === 'object') {
    const id = (product as { id?: unknown }).id;
    if (typeof id === 'string' && id.trim()) {
      return id.trim();
    }
  }

  return '';
}

function readBoolean(record: Record<string, unknown>, camel: string, snake: string): boolean {
  const value = record[camel] ?? record[snake];
  return value === true;
}

export function normalizeSearchResults(raw: unknown): NormalizedSearchResult[] {
  return coerceSearchResultRows(raw).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      productId: readSearchProductId(record),
      match: readBoolean(record, 'match', 'match'),
      availability: (record.availability as BookingmoodIntervalStatus) ?? null,
      occupancyMatches: readBoolean(record, 'occupancyMatches', 'occupancy_matches'),
      optionsMatch: readBoolean(record, 'optionsMatch', 'options_match'),
      price: readSearchPrice(record),
    };
  });
}

export function stayTotalDollarsFromSearch(
  search: NormalizedSearchResult | undefined,
  nightCount: number,
): { totalPrice: number; nightlyRate: number } | null {
  if (!search?.price || nightCount <= 0) {
    return null;
  }

  const { min, max } = search.price;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0) {
    return null;
  }

  if (min !== max) {
    return null;
  }

  const totalPrice = min / 100;
  return {
    totalPrice,
    nightlyRate: totalPrice / nightCount,
  };
}