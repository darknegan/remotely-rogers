import { describe, expect, it } from 'vitest';

import { GUEST_REVIEWS } from '../../features/content/reviews/reviews.data';

import {
  CABIN_SLUGS,
  REVIEW_BAND_INTERVAL_MS,
  airbnbListingToCabinSlug,
  averageRating,
  cabinSlugFromPathname,
  guestInitials,
  nextReviewIndex,
  prevReviewIndex,
  reviewBandImageOnLeft,
  shouldAutoAdvance,
  shortCabinName,
  visibleReviewWindow,
  visibleReviews,
} from './reviews';

import { reviewsForCabin } from '../../features/content/reviews/reviews.data';

describe('airbnbListingToCabinSlug', () => {
  it('maps Black Gum listings to the Lodgify slug', () => {
    expect(airbnbListingToCabinSlug('Black Gum- Forest Views-A-Frame-Near Bentonville')).toBe(
      'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
    );
  });

  it('maps Dogwood Den listings to the Lodgify slug', () => {
    expect(airbnbListingToCabinSlug('Dogwood Den-Forest Views-A frame-Near Bentonville')).toBe(
      'dogwood-den--cozy-forest-a-frame-near-bentonville',
    );
  });

  it('maps Still Spring listings to Running Spring Retreat', () => {
    expect(airbnbListingToCabinSlug('Still Spring- Forest Views-AFrame-Near Bentonville')).toBe(
      'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
    );
  });

  it('maps Black Walnut before Black Gum', () => {
    expect(airbnbListingToCabinSlug('Black Walnut-Forest Views-A frame-Near Bentonville')).toBe(
      'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville',
    );
  });

  it('maps White Oak listings to the Lodgify slug', () => {
    expect(airbnbListingToCabinSlug('White Oak- Forest Views- A-Frame-Near Bentonville')).toBe(
      'white-oak-haven-cozy-forest-a-frame-near-bentonville',
    );
  });

  it('maps Post Oak listings to the Lodgify slug', () => {
    expect(airbnbListingToCabinSlug('Post Oak- Forest Views - A-Frame- Near Bentonville')).toBe(
      'post-oak-perch-cozy-forest-a-frame-near-bentonville',
    );
  });

  it('returns null for an unknown listing title', () => {
    expect(airbnbListingToCabinSlug('Mystery Cabin-Near Bentonville')).toBeNull();
  });
});

describe('guestInitials', () => {
  it('uses the first letter of a single name', () => {
    expect(guestInitials('Xaine')).toBe('X');
  });

  it('uses first and last initials for a full name', () => {
    expect(guestInitials('Jeff Wolfe')).toBe('JW');
  });

  it('returns a fallback for a blank name', () => {
    expect(guestInitials('   ')).toBe('?');
  });
});

describe('averageRating', () => {
  it('rounds the mean to one decimal place', () => {
    expect(averageRating([{ rating: 5 }, { rating: 5 }, { rating: 4 }])).toBe(4.7);
  });

  it('returns 0 when there are no reviews', () => {
    expect(averageRating([])).toBe(0);
  });
});

describe('visibleReviews', () => {
  const reviews = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('shows the first four reviews until expanded', () => {
    expect(visibleReviews(reviews, false)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('shows every review when expanded', () => {
    expect(visibleReviews(reviews, true)).toEqual(reviews);
  });

  it('returns the full list when it is already at or under the limit', () => {
    expect(visibleReviews(['a', 'b', 'c'], false)).toEqual(['a', 'b', 'c']);
  });
});

describe('cabinSlugFromPathname', () => {
  it('reads a Lodgify rental path', () => {
    expect(
      cabinSlugFromPathname('/en/black-gum-getaway-cozy-forest-a-frame-near-bentonville/'),
    ).toBe(CABIN_SLUGS.blackGum);
  });

  it('returns null on marketing pages', () => {
    expect(cabinSlugFromPathname('/en/activities/')).toBeNull();
    expect(cabinSlugFromPathname('/preview/reviews')).toBeNull();
  });
});

describe('GUEST_REVIEWS', () => {
  const slugs = new Set<string>(Object.values(CABIN_SLUGS));

  it('maps every review to a known cabin slug', () => {
    for (const review of GUEST_REVIEWS) {
      expect(slugs.has(review.cabinSlug)).toBe(true);
      expect(review.quote.length).toBeGreaterThan(10);
      expect(review.avatarUrl).toBe(`/reviews/avatars/${review.id}.jpg`);
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
    }
  });

  it('includes reviews for all six cabins', () => {
    const used = new Set(GUEST_REVIEWS.map((review) => review.cabinSlug));
    expect(used.size).toBe(6);
    expect(GUEST_REVIEWS).toHaveLength(66);
    for (const slug of slugs) {
      expect(GUEST_REVIEWS.filter((review) => review.cabinSlug === slug).length).toBeGreaterThanOrEqual(
        4,
      );
    }
  });

  it('keeps unique ids and drops the duplicate Justin screenshot', () => {
    const ids = GUEST_REVIEWS.map((review) => review.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      GUEST_REVIEWS.filter(
        (review) => review.guestName === 'Justin' && review.cabinSlug === CABIN_SLUGS.blackWalnut,
      ),
    ).toHaveLength(1);
  });

  it('returns only the requested cabin from reviewsForCabin', () => {
    for (const slug of slugs) {
      const reviews = reviewsForCabin(slug);
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews.every((review) => review.cabinSlug === slug)).toBe(true);
    }
    expect(reviewsForCabin('not-a-cabin')).toEqual([]);
  });
});

describe('review band helpers', () => {
  it('uses a 15 second interval', () => {
    expect(REVIEW_BAND_INTERVAL_MS).toBe(15_000);
  });

  it('wraps a two-review window past the last card', () => {
    expect(visibleReviewWindow(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['a', 'b']);
    expect(visibleReviewWindow(['a', 'b', 'c', 'd'], 3, 2)).toEqual(['d', 'a']);
    expect(visibleReviewWindow(['a', 'b'], 0, 2)).toEqual(['a', 'b']);
    expect(visibleReviewWindow(['a'], 0, 2)).toEqual(['a']);
  });

  it('puts the photo on the left for odd rows and the right for even rows', () => {
    expect(reviewBandImageOnLeft(0)).toBe(true);
    expect(reviewBandImageOnLeft(1)).toBe(false);
    expect(reviewBandImageOnLeft(2)).toBe(true);
    expect(reviewBandImageOnLeft(5)).toBe(false);
  });

  it('uses the short cabin name before the first dash', () => {
    expect(shortCabinName('Black Gum Getaway-Cozy Forest A-frame Near Bentonville')).toBe(
      'Black Gum Getaway',
    );
  });

  it('wraps next and previous indexes', () => {
    expect(nextReviewIndex(0, 4)).toBe(1);
    expect(nextReviewIndex(3, 4)).toBe(0);
    expect(prevReviewIndex(0, 4)).toBe(3);
    expect(prevReviewIndex(2, 4)).toBe(1);
    expect(nextReviewIndex(0, 0)).toBe(0);
  });

  it('auto-advances only when three or more reviews are idle', () => {
    const idle = {
      reviewCount: 5,
      modalOpen: false,
      reduceMotion: false,
      documentHidden: false,
      hovered: false,
    };
    expect(shouldAutoAdvance(idle)).toBe(true);
    expect(shouldAutoAdvance({ ...idle, reviewCount: 2 })).toBe(false);
    expect(shouldAutoAdvance({ ...idle, reviewCount: 1 })).toBe(false);
    expect(shouldAutoAdvance({ ...idle, modalOpen: true })).toBe(false);
    expect(shouldAutoAdvance({ ...idle, reduceMotion: true })).toBe(false);
    expect(shouldAutoAdvance({ ...idle, documentHidden: true })).toBe(false);
    expect(shouldAutoAdvance({ ...idle, hovered: true })).toBe(false);
  });
});
