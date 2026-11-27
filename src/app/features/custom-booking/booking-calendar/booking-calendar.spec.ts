import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { nightCount, parseDateKey } from '../../../core/utils/date-utils';
import { BookingCalendar } from './booking-calendar';

class BookingChannelStateStub {
  readonly checkIn = signal<Date | null>(null);
  readonly checkOut = signal<Date | null>(null);
  readonly rangeConflictError = signal<string | null>(null);
  readonly calendarMonth = signal(parseDateKey('2026-12-01'));
  calendarDayMap(): Record<string, string> {
    return {};
  }

  beginDateSelection(checkIn: Date): void {
    this.checkIn.set(checkIn);
    this.checkOut.set(null);
  }

  setDates(checkIn: Date, checkOut: Date): void {
    this.checkIn.set(checkIn);
    this.checkOut.set(checkOut);
  }

  stayRangeAllowed(): boolean {
    return true;
  }

  completeStayRange(checkOut: Date): boolean {
    const checkIn = this.checkIn();
    if (!checkIn) {
      return false;
    }
    this.setDates(checkIn, checkOut);
    return true;
  }
}

describe('BookingCalendar pickDay', () => {
  let stub: BookingChannelStateStub;

  beforeEach(async () => {
    stub = new BookingChannelStateStub();
    await TestBed.configureTestingModule({
      imports: [BookingCalendar],
      providers: [{ provide: BookingChannelStateService, useValue: stub }],
    }).compileComponents();
  });

  it('counts Dec 7 → Dec 9 as 2 nights after check-out is chosen', () => {
    const fixture = TestBed.createComponent(BookingCalendar);
    const calendar = fixture.componentInstance;

    calendar.pickDay(parseDateKey('2026-12-07'));
    expect(stub.checkOut()).toBeNull();

    calendar.pickDay(parseDateKey('2026-12-09'));
    expect(nightCount(stub.checkIn()!, stub.checkOut()!)).toBe(2);
  });
});