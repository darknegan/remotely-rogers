export function formatGuestCount(count: number): string {
  const safe = Math.max(0, Math.floor(count));
  return safe === 1 ? '1 guest' : `${safe} guests`;
}