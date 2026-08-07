import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingConfig,
  CabinAvailability,
  DayStatus,
} from '../models/booking.models';
import { eachNight, startOfDay, toDateKey } from '../utils/date-utils';
import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);

  getConfig(): BookingConfig {
    return CABIN_CONFIG;
  }

  fetchAvailability(request: AvailabilityRequest): Observable<AvailabilityResponse> {
    if (environment.useMockAvailability) {
      return of(this.buildMockAvailability(request)).pipe(delay(450));
    }

    return this.http.post<AvailabilityResponse>(
      `${environment.apiBaseUrl}/api/availability`,
      request,
    );
  }

  /** Deterministic mock blocks until the BFF + Lodgify quotes are wired. */
  private buildMockAvailability(request: AvailabilityRequest): AvailabilityResponse {
    const arrival = startOfDay(new Date(request.arrival));
    const departure = startOfDay(new Date(request.departure));
    const nights = eachNight(arrival, departure);
    const paddingBefore = 2;
    const paddingAfter = 2;
    const windowStart = startOfDay(addDaysLocal(arrival, -paddingBefore));
    const windowEnd = startOfDay(addDaysLocal(departure, paddingAfter));
    const windowNights = eachNight(windowStart, windowEnd);

    const cabins = CABIN_CONFIG.cabins.map((cabin) => {
      const nightlyRate = 132;
      const days: Record<string, DayStatus> = {};

      for (const night of windowNights) {
        days[toDateKey(night)] = mockDayStatus(cabin.id, night);
      }

      const stayAvailable = nights.every((night) => days[toDateKey(night)] === 'available');
      const totalPrice = nightlyRate * nights.length;

      return {
        cabinId: cabin.id,
        nightlyRate,
        totalPrice,
        currency: 'USD',
        available: stayAvailable,
        days,
        bookingUrl: `${environment.siteBaseUrl}/en/${cabin.slug}/`,
      } satisfies CabinAvailability;
    });

    return { cabins };
  }
}

function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mockDayStatus(cabinId: number, date: Date): DayStatus {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  if ((cabinId + dayOfYear) % 11 === 0) {
    return 'booked';
  }

  if ((cabinId * 3 + dayOfYear) % 17 === 0) {
    return 'blocked';
  }

  return 'available';
}
