import { describe, expect, it } from 'vitest';

import { bookingmoodWidgetSrc } from './bookingmood-widget';

const BASE = 'https://www.bookingmood.com/embed/4285e82a-1454-4405-b34b-25a8cac7f4ce';

describe('bookingmoodWidgetSrc', () => {
  it('preselects one cabin, dates, and guests', () => {
    const src = bookingmoodWidgetSrc(BASE, {
      productId: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65',
      start: '2026-12-10',
      end: '2026-12-12',
      guests: 2,
    });
    const url = new URL(src);
    expect(url.searchParams.get('product_id')).toBe('936c1ff7-2900-410b-9ced-cc2cf6ec3b65');
    expect(url.searchParams.get('start')).toBe('2026-12-10');
    expect(url.searchParams.get('end')).toBe('2026-12-12');
    expect(url.searchParams.get('guests')).toBe('2');
    expect(url.searchParams.get('currency')).toBe('USD');
  });

  it('leaves the product unset so the shopping cart can hold several cabins', () => {
    const url = new URL(bookingmoodWidgetSrc(BASE, { guests: 4 }));
    expect(url.searchParams.has('product_id')).toBe(false);
    expect(url.searchParams.get('guests')).toBe('4');
  });
});
