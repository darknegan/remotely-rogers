const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Trim whitespace and peel one or more wrapping quote pairs from Wrangler values. */
export function normalizeEnvUuid(value: string | undefined): string | null {
  let trimmed = value?.trim() ?? '';
  while (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return UUID.test(trimmed) ? trimmed : null;
}

export function diagnoseCapacityGroupEnv(raw: string | undefined): {
  capacityGroupIdConfigured: boolean;
  capacityGroupIdLooksLikeUuid: boolean;
} {
  const configured = !!(raw?.trim());
  return {
    capacityGroupIdConfigured: configured,
    capacityGroupIdLooksLikeUuid: normalizeEnvUuid(raw) !== null,
  };
}