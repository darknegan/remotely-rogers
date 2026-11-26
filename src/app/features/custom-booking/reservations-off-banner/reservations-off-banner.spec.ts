import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { ReservationsOffBanner } from './reservations-off-banner';

describe('ReservationsOffBanner', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsOffBanner],
    }).compileComponents();
  });

  it('renders preview reservations-off copy', () => {
    const fixture = TestBed.createComponent(ReservationsOffBanner);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toMatch(/Reservations off/i);
    expect(text).toMatch(/browse cabins and dates/i);
  });
});