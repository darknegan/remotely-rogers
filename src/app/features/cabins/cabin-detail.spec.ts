import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { SearchState } from '../../core/search/search-state.service';
import { CabinDetail } from './cabin-detail';

describe('CabinDetail single-cabin booking entry', () => {
  beforeEach(async () => {
    const slug = CABIN_CONFIG.cabins[0]?.slug ?? 'black-gum-getaway';

    await TestBed.configureTestingModule({
      imports: [CabinDetail],
      providers: [
        SearchState,
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug })),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();
  });

  it('Book now targets internal group-booking, not external payment URLs', () => {
    const fixture = TestBed.createComponent(CabinDetail);
    fixture.detectChanges();

    const href = fixture.componentInstance.bookHref();

    expect(href.startsWith('/group-booking')).toBe(true);
    expect(href).toContain('cabin=');
    expect(href).not.toMatch(/lodgify|stripe|bookingmood\.com\/pay/i);
  });
});

describe('Cabin catalog bookUrl policy', () => {
  it('maps every cabin bookUrl to group-booking with cabin slug', async () => {
    const { CABIN_LISTINGS } = await import('../../core/content/cabin-catalog');

    for (const cabin of CABIN_LISTINGS) {
      expect(cabin.bookUrl).toMatch(/\/group-booking\?cabin=/);
      expect(cabin.bookUrl).not.toMatch(/lodgify|stripe/i);
    }
  });
});
