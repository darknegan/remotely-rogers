import { describe, expect, it } from 'vitest';

import { formatGuestCount } from './guest-label';

describe('formatGuestCount', () => {
  it('uses singular for one guest', () => {
    expect(formatGuestCount(1)).toBe('1 guest');
  });

  it('uses plural for multiple guests', () => {
    expect(formatGuestCount(4)).toBe('4 guests');
  });
});