const SECRET_KEY_RE = /(api[_-]?key|secret|password|token|authorization|bearer)/i;

/** Deep-clone JSON and drop keys that might carry secrets or guest PII. */
export function sanitizeBookingmoodFixture(value: unknown): unknown {
  return walk(value);
}

function walk(value: unknown): unknown {
  if (value === null || typeof value !== 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => walk(entry));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(record)) {
      if (SECRET_KEY_RE.test(key)) {
        continue;
      }
      if (key === 'form_values' && raw && typeof raw === 'object') {
        next[key] = {};
        continue;
      }
      next[key] = walk(raw);
    }
    return next;
  }

  return value;
}

export function describeBookingmoodSearchResponseShape(body: unknown): {
  responseIsArray: boolean;
  wrappedIn: string | null;
  rowCount: number;
  sampleRowKeys: string[];
  hasTopLevelProductId: boolean;
  hasTopLevelProduct_id: boolean;
  hasNestedProductId: boolean;
} {
  let rows: unknown[] = [];
  let wrappedIn: string | null = null;

  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['results', 'data', 'items'] as const) {
      if (Array.isArray(record[key])) {
        rows = record[key] as unknown[];
        wrappedIn = key;
        break;
      }
    }
  }

  const sample = rows[0];
  const sampleRowKeys =
    sample && typeof sample === 'object' ? Object.keys(sample as Record<string, unknown>) : [];

  let hasTopLevelProductId = false;
  let hasTopLevelProduct_id = false;
  let hasNestedProductId = false;

  if (sample && typeof sample === 'object') {
    const row = sample as Record<string, unknown>;
    hasTopLevelProductId = typeof row.productId === 'string' && row.productId.length > 0;
    hasTopLevelProduct_id = typeof row.product_id === 'string' && row.product_id.length > 0;
    const product = row.product;
    if (product && typeof product === 'object') {
      const id = (product as { id?: unknown }).id;
      hasNestedProductId = typeof id === 'string' && id.length > 0;
    }
  }

  return {
    responseIsArray: Array.isArray(body),
    wrappedIn,
    rowCount: rows.length,
    sampleRowKeys,
    hasTopLevelProductId,
    hasTopLevelProduct_id,
    hasNestedProductId,
  };
}