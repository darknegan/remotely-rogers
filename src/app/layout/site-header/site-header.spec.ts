import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { SiteHeader } from './site-header';

describe('SiteHeader booking CTA', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows Check availability when reservations are not off', () => {
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toMatch(/Check availability/i);
    expect(fixture.nativeElement.querySelector('.rr-btn--disabled')).toBeNull();
  });

  it('shows disabled Booking unavailable when reservations are off', () => {
    const fixture = TestBed.createComponent(SiteHeader);
    const instance = fixture.componentInstance as SiteHeader & { reservationsOff: boolean };
    instance.reservationsOff = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/Booking unavailable/i);
    expect(fixture.nativeElement.querySelectorAll('.rr-btn--disabled').length).toBeGreaterThan(0);
  });
});