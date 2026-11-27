export function coerceCartValidateRows(raw: unknown): unknown[] {
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

/** Subtotal in cents from a cart-validate row (camelCase or snake_case). */
export function readCartValidateSubtotalCents(row: unknown): number | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const record = row as Record<string, unknown>;
  const priceRaw = record.price;
  if (!priceRaw || typeof priceRaw !== 'object') {
    return null;
  }

  const price = priceRaw as Record<string, unknown>;
  const subtotal = Number(price.subtotal ?? price.sub_total);
  if (Number.isFinite(subtotal) && subtotal > 0) {
    return subtotal;
  }

  const lines = price.lines;
  if (Array.isArray(lines) && lines.length > 0) {
    let sum = 0;
    for (const line of lines) {
      if (!line || typeof line !== 'object') {
        continue;
      }
      const amount = Number((line as { amount?: unknown }).amount);
      const quantity = Number((line as { quantity?: unknown }).quantity ?? 1);
      if (Number.isFinite(amount) && amount > 0 && Number.isFinite(quantity) && quantity > 0) {
        sum += amount * quantity;
      }
    }
    if (sum > 0) {
      return sum;
    }
  }

  return null;
}

export function readCartValidateItemId(row: unknown): string | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const id = (row as { id?: unknown }).id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}