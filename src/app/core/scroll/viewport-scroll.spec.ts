import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollPageToTop } from './viewport-scroll';

describe('scrollPageToTop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls the window to the top', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('window', { scrollTo });

    scrollPageToTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });
});
