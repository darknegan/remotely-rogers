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

export function normalizeSearchResults(raw: unknown): NormalizedSearchResult[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((row) => {
    const record = row as Record<string, unknown>;
    const priceRaw = record.price;
    let price: BookingmoodSearchResult['price'] = null;
    if (priceRaw && typeof priceRaw === 'object') {
      const min = Number((priceRaw as { min?: unknown }).min);
      const max = Number((priceRaw as { max?: unknown }).max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        price = { min, max };
      }
    }

    const productId = String(record.productId ?? record.product_id ?? '');
    return {
      productId,
      match: record.match === true,
      availability: (record.availability as BookingmoodIntervalStatus) ?? null,
      occupancyMatches: record.occupancyMatches === true,
      optionsMatch: record.optionsMatch === true,
      price,
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

  const totalCents = (min + max) / 2;
  const totalPrice = totalCents / 100;
  return {
    totalPrice,
    nightlyRate: totalPrice / nightCount,
  };
}