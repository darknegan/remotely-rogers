import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingConfig,
  CabinAvailability,
  DayRate,
  DayStatus,
  CheckoutSessionResponse,
  GroupCheckoutRequest,
  StripeCheckoutResponse,
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

  createStripeCheckout(request: GroupCheckoutRequest): Observable<StripeCheckoutResponse> {
    return this.http.post<StripeCheckoutResponse>(`${environment.apiBaseUrl}/api/checkout`, request);
  }

  getCheckoutSession(sessionId: string): Observable<CheckoutSessionResponse> {
    return this.http.get<CheckoutSessionResponse>(`${environment.apiBaseUrl}/api/checkout/session`, {
      params: { session_id: sessionId },
    });
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
      const days: Record<string, DayStatus> = {};
      const dayRates: Record<string, DayRate> = {};

      for (const night of windowNights) {
        days[toDateKey(night)] = mockDayStatus(cabin.id, night);
        const weekend = night.getDay() === 0 || night.getDay() === 6;
        dayRates[toDateKey(night)] = {
          price: weekend ? 235 : 132,
          minStay: weekend ? 2 : 1,
        };
      }

      const stayAvailable = nights.every((night) => days[toDateKey(night)] === 'available');
      const nightsTotal = nights.reduce((sum, night) => {
        return sum + (dayRates[toDateKey(night)]?.price ?? 132);
      }, 0);
      const cleaningFee = 75;

      return {
        cabinId: cabin.id,
        nightlyRate: nights.length > 0 ? nightsTotal / nights.length : 132,
        totalPrice: nightsTotal + cleaningFee,
        currency: 'USD',
        available: stayAvailable,
        days,
        dayRates,
        cleaningFee,
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
