import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingPanel } from './booking-panel';

const PRODUCT_ID = '936c1ff7-2900-410b-9ced-cc2cf6ec3b65';

describe('BookingPanel reservations-off UI', () => {
  const mockState = {
    loadChannel: vi.fn(),
    refreshAvailability: vi.fn(),
    setSingleProductForCabin: vi.fn(),
    reservationsOff: signal(true),
    loading: signal(false),
    error: signal<string | null>(null),
    checkIn: signal<Date | null>(null),
    checkOut: signal<Date | null>(null),
    calendarDayMap: signal({}),
    formServices: signal([]),
    products: signal([]),
    validatedItems: signal(null),
    validating: signal(false),
    validateError: signal(null),
    productForCabinId: () => ({ id: PRODUCT_ID }),
    singleProductId: () => PRODUCT_ID,
    capacityGroupIdForProduct: () => 'f8558449-6548-4559-8f5d-31448942969d',
    maxGuestsForProduct: () => 2,
    occupancyByProduct: signal({}),
    changeOccupancy: vi.fn(),
    totalGuestsForProduct: () => 2,
    guestStepperLabel: () => 'Guests',
    calendarMonth: signal(new Date()),
    shiftMonth: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingPanel],
      providers: [
        provideRouter([]),
        { provide: BookingChannelStateService, useValue: mockState },
      ],
    })
      .overrideComponent(BookingPanel, { set: { providers: [] } })
      .compileComponents();
  });

  it('shows booking unavailable CTA and panel notice when reservations are off', () => {
    const fixture = TestBed.createComponent(BookingPanel);
    fixture.componentRef.setInput('cabinId', 1);
    fixture.componentRef.setInput('nightlyFrom', 132);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toMatch(/Preview · Reservations off/i);
    expect(text).toMatch(/Booking unavailable/i);
    const cta = fixture.nativeElement.querySelector('.rr-booking-panel__cta') as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });
});