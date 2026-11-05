export interface PublicProductDto {
  id: string;
  name: string;
  description: string | null;
  timezone: string | null;
  currency: string | null;
  images: unknown;
  deposit: unknown;
  fee: unknown;
}

export function mapPublicProduct(row: unknown): PublicProductDto | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const record = row as Record<string, unknown>;
  const id = record['id'];
  if (typeof id !== 'string' || !id) {
    return null;
  }

  const nameField = record['name'];
  let name = '';
  if (typeof nameField === 'string') {
    name = nameField;
  } else if (nameField && typeof nameField === 'object') {
    const localized = nameField as Record<string, unknown>;
    name = typeof localized['default'] === 'string' ? localized['default'] : '';
  }

  const descriptionField = record['description'];
  let description: string | null = null;
  if (typeof descriptionField === 'string') {
    description = descriptionField;
  } else if (descriptionField && typeof descriptionField === 'object') {
    const localized = descriptionField as Record<string, unknown>;
    description = typeof localized['default'] === 'string' ? localized['default'] : null;
  }

  return {
    id,
    name,
    description,
    timezone: typeof record['timezone'] === 'string' ? record['timezone'] : null,
    currency: typeof record['currency'] === 'string' ? record['currency'] : null,
    images: record['images'] ?? null,
    deposit: record['deposit'] ?? null,
    fee: record['fee'] ?? null,
  };
}

export function mapPublicProducts(rows: unknown[]): PublicProductDto[] {
  return rows.map(mapPublicProduct).filter((row): row is PublicProductDto => row != null);
}
