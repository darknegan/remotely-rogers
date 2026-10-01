import { describe, expect, it } from 'vitest';

import {
  filterCulture,
  filterFeatured,
  filterSummary,
  hasVisibleContent,
  matchesCategory,
  showCultureSection,
  showDiningSection,
  showOutdoorSection,
  showTrailsCards,
} from './activities.data';

describe('matchesCategory', () => {
  it('returns all items when All is selected', () => {
    expect(matchesCategory('All', ['Biking'])).toBe(true);
  });

  it('matches a specific category tag', () => {
    expect(matchesCategory('Biking', ['Biking'])).toBe(true);
    expect(matchesCategory('Biking', ['Outdoor'])).toBe(false);
  });
});

describe('filterFeatured', () => {
  it('returns all featured picks for All', () => {
    expect(filterFeatured('All')).toHaveLength(3);
  });

  it('returns only biking featured for Biking filter (F-04b)', () => {
    const results = filterFeatured('Biking');

    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe('World-class biking');
  });
});

describe('section visibility', () => {
  it('shows outdoor section for All and Outdoor filters', () => {
    expect(showOutdoorSection('All')).toBe(true);
    expect(showOutdoorSection('Outdoor')).toBe(true);
    expect(showOutdoorSection('Biking')).toBe(false);
  });

  it('shows trail cards only for Biking filter', () => {
    expect(showTrailsCards('All')).toBe(false);
    expect(showTrailsCards('Biking')).toBe(true);
  });

  it('shows culture for History and Nightlife filters', () => {
    expect(showCultureSection('History')).toBe(true);
    expect(showCultureSection('Nightlife')).toBe(true);
    expect(filterCulture('History')).toHaveLength(2);
    expect(filterCulture('Nightlife')).toHaveLength(2);
  });

  it('shows dining only for All and Dining filters', () => {
    expect(showDiningSection('All')).toBe(true);
    expect(showDiningSection('Dining')).toBe(true);
    expect(showDiningSection('Biking')).toBe(false);
  });
});

describe('hasVisibleContent', () => {
  it('has content for All and Biking filters', () => {
    expect(hasVisibleContent('All')).toBe(true);
    expect(hasVisibleContent('Biking')).toBe(true);
    expect(hasVisibleContent('Outdoor')).toBe(true);
    expect(hasVisibleContent('Dining')).toBe(true);
  });

  it('returns empty for Weekend trips filter (F-04c)', () => {
    expect(hasVisibleContent('Weekend trips')).toBe(false);
  });
});

describe('filterSummary', () => {
  it('summarizes the Biking filter state', () => {
    expect(filterSummary('Biking')).toBe('1 featured · 4 trails');
  });

  it('reports zero results for Weekend trips', () => {
    expect(filterSummary('Weekend trips')).toBe('0 results');
  });

  it('returns an empty label for All', () => {
    expect(filterSummary('All')).toBe('');
  });
});
