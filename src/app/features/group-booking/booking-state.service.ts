import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { BookingApiService } from '../../core/services/booking-api.service';
import {
  CabinAvailability,
  CabinCartItem,
  CabinConfig,
  CabinSelection,
  DateRange,
  BookingStatusResponse,
  GuestDetails,
} from '../../core/models/booking.models';
import {
  addDays,
  differenceInCalendarDays,
  eachNight,
  nightCount,
  parseDateKey,
  startOfDay,
  toDateKey,
} from '../../core/utils/date-utils';
import { findNextOpenStay, formatNextOpenLabel } from './booking-next-open';

const MAX_AUTO_FILL_GAP_DAYS = 5;
const CART_STORAGE_KEY = 'rr-group-booking-cart';

export const DEFAULT_VIEW_DAYS = 7;

interface PendingCellSelection {
  cabinId: number;
  arrival: Date;
}

interface PersistedCart {
  guestCount: number;
  cabinSelections: Record<string, { cabinId: number; arrival: string; departure: string }>;
  availabilityMap: Record<number, CabinAvailability>;
}

@Injectable()
export class BookingStateService {
  private readonly api = inject(BookingApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });

  readonly config = this.api.getConfig();
  readonly cabins = this.config.cabins;

  readonly viewStartDate = signal<Date | null>(null);
  readonly guestCount = signal(2);
  readonly availabilityMap = signal<Record<number, CabinAvailability>>({});
  readonly cabinSelections = signal<Record<number, CabinSelection>>({});
  readonly pendingSelection = signal<PendingCellSelection | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dateError = signal<string | null>(null);
  readonly selectionError = signal<string | null>(null);
  readonly hasSearched = signal(false);
  readonly checkoutLoading = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly checkoutReference = signal<string | null>(null);
  readonly bookingStatus = signal<BookingStatusResponse | null>(null);
  readonly nextOpenLabels = signal<Record<number, string>>({});
  /** Stay dates from the cabins listing bar (checkout-exclusive). */
  readonly listingStayRange = signal<DateRange | null>(null);
  private readonly listingQuotes = signal<Record<number, CabinAvailability>>({});

  readonly viewRange = computed((): DateRange | null => {
    const start = this.viewStartDate();
    if (!start) {
      return null;
    }

    return {
      arrival: start,
      departure: addDays(start, DEFAULT_VIEW_DAYS),
    };
  });

  readonly timelineDates = computed(() => {
    const range = this.viewRange();
    if (!range) {
      return [];
    }

    return eachNight(range.arrival, range.departure);
  });

  readonly headerMonth = computed(() => {
    const range = this.viewRange();
    if (!range) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(range.arrival);
  });

  readonly cartItems = computed((): CabinCartItem[] => {
    const selections = this.cabinSelections();
    const quotes = this.availabilityMap();

    return this.cabins
      .filter((cabin) => selections[cabin.id])
      .map((cabin) => {
        const selection = selections[cabin.id];
        const quote = quotes[cabin.id];
        const nights = nightCount(selection.arrival, selection.departure);
        const stayNights = eachNight(selection.arrival, selection.departure);
        const nightsTotal = stayNights.reduce((sum, night) => {
          const rate = quote?.dayRates?.[toDateKey(night)];
          return sum + (rate?.price ?? quote?.nightlyRate ?? 0);
        }, 0);

        return {
          cabin,
          selection,
          nights,
          totalPrice: nightsTotal + (quote?.cleaningFee ?? 0),
          currency: quote?.currency ?? 'USD',
        };
      });
  });

  readonly selectedTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.totalPrice, 0),
  );

  readonly canCheckout = computed(
    () => this.cartItems().length > 0 && !this.loading() && !this.dateError(),
  );

  constructor() {
    this.hydrateCart();
    effect(() => {
      this.guestCount();
      this.cabinSelections();
      this.availabilityMap();
      this.persistCart();
    });
  }

  setGuestCount(count: number): void {
    const max = this.config.maxGuestsPerCabin;
    this.guestCount.set(Math.min(max, Math.max(1, count)));
  }

  /** Align embedded calendar with the cabins listing date bar. */
  syncFromListingSearch(arrival: Date, departure: Date, adults: number): void {
    this.listingStayRange.set({ arrival, departure });
    this.setGuestCount(adults);
    this.setViewStartDate(arrival);
    if (this.dateError()) {
      return;
    }

    this.searchAvailability();
  }

  /** Merge day-level quotes from the listing search into the calendar map (same API payload). */
  mergeListingAvailability(quotes: Record<number, CabinAvailability>): void {
    if (Object.keys(quotes).length === 0) {
      return;
    }

    this.listingQuotes.set(quotes);
    this.applyListingQuoteMerge();
  }

  isInListingStay(date: Date): boolean {
    const range = this.listingStayRange();
    if (!range) {
      return false;
    }

    const key = toDateKey(date);
    return key >= toDateKey(range.arrival) && key < toDateKey(range.departure);
  }

  refreshNextOpenLabels(
    cabinIds: number[],
    checkout: Date,
    quotes: Record<number, CabinAvailability>,
  ): void {
    if (cabinIds.length === 0) {
      this.nextOpenLabels.set({});
      return;
    }

    const minNights = this.config.minNights;
    const labels: Record<number, string> = {};
    const needsHorizon: number[] = [];

    for (const cabinId of cabinIds) {
      const quote = quotes[cabinId];
      const window = findNextOpenStay(quote?.days ?? {}, checkout, minNights);
      if (window) {
        labels[cabinId] = formatNextOpenLabel(window);
      } else {
        needsHorizon.push(cabinId);
      }
    }

    if (needsHorizon.length === 0) {
      this.nextOpenLabels.set(labels);
      return;
    }

    const horizonStart = startOfDay(checkout);
    const horizonEnd = addDays(horizonStart, 60);

    this.api
      .fetchAvailability({
        arrival: toDateKey(horizonStart),
        departure: toDateKey(horizonEnd),
        adults: this.guestCount(),
      })
      .subscribe({
        next: (response) => {
          const extended = Object.fromEntries(response.cabins.map((c) => [c.cabinId, c]));
          for (const cabinId of needsHorizon) {
            const quote = extended[cabinId];
            const window = findNextOpenStay(quote?.days ?? {}, checkout, minNights);
            if (window) {
              labels[cabinId] = formatNextOpenLabel(window);
            } else {
              labels[cabinId] = 'Check calendar for open nights';
            }
          }
          this.nextOpenLabels.set({ ...labels });
        },
        error: () => {
          for (const cabinId of needsHorizon) {
            labels[cabinId] = 'Check calendar for open nights';
          }
          this.nextOpenLabels.set({ ...labels });
        },
      });
  }

  getDefaultViewStartDate(): Date {
    return startOfDay(new Date());
  }

  initializeDefaultView(): void {
    if (this.viewStartDate()) {
      return;
    }

    this.setViewStartDate(this.getDefaultViewStartDate());
  }

  resetToDefaultView(): void {
    this.setViewStartDate(this.getDefaultViewStartDate());
    this.searchAvailability();
  }

  shiftView(direction: -1 | 1): void {
    const start = this.viewStartDate();
    if (!start) {
      return;
    }

    this.setViewStartDate(addDays(start, direction * DEFAULT_VIEW_DAYS));
    this.searchAvailability();
  }

  setViewStartDate(date: Date | null): void {
    if (!date) {
      this.dateError.set('Select a start date for the calendar.');
      this.viewStartDate.set(null);
      return;
    }

    const normalized = startOfDay(date);
    const today = startOfDay(new Date());

    if (normalized < today) {
      this.dateError.set('Start date cannot be in the past.');
      this.viewStartDate.set(null);
      return;
    }

    this.dateError.set(null);
    this.viewStartDate.set(normalized);
  }

  searchAvailability(): void {
    const range = this.viewRange();
    if (!range || this.dateError()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.checkoutReference.set(null);
    this.checkoutError.set(null);

    this.api
      .fetchAvailability({
        arrival: toDateKey(range.arrival),
        departure: toDateKey(range.departure),
        adults: this.guestCount(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const map: Record<number, CabinAvailability> = {};
          for (const cabin of response.cabins) {
            map[cabin.cabinId] = cabin;
          }
          this.availabilityMap.set(map);
          this.applyListingQuoteMerge();
        },
        error: () => {
          this.error.set('Availability unavailable. Please try again later.');
          this.availabilityMap.set({});
        },
      });
  }

  selectCell(cabinId: number, date: Date): void {
    this.selectionError.set(null);

    if (!this.isCellSelectable(cabinId, date)) {
      return;
    }

    const normalized = startOfDay(date);
    const existing = this.cabinSelections()[cabinId];

    if (existing && this.isDateInCabinSelection(cabinId, normalized)) {
      this.clearCabinSelection(cabinId);
      return;
    }

    if (!existing) {
      this.applySelection(cabinId, normalized, normalized, { merge: false });
      this.pendingSelection.set({ cabinId, arrival: normalized });
      return;
    }

    const pending = this.pendingSelection();
    const anchor =
      pending?.cabinId === cabinId ? startOfDay(pending.arrival) : addDays(existing.departure, -1);
    const gapDays = Math.abs(differenceInCalendarDays(anchor, normalized));

    if (gapDays >= 1 && gapDays <= MAX_AUTO_FILL_GAP_DAYS) {
      const rangeStart = anchor <= normalized ? anchor : normalized;
      const rangeEnd = anchor <= normalized ? normalized : anchor;
      this.applySelection(cabinId, rangeStart, rangeEnd);
      this.pendingSelection.set({ cabinId, arrival: normalized });
      return;
    }

    const extended = this.extendSelectionByOneDay(existing, normalized);
    if (extended && this.isRangeAvailable(cabinId, extended.arrival, extended.departure)) {
      this.cabinSelections.update((current) => ({
        ...current,
        [cabinId]: { cabinId, ...extended },
      }));
      this.pendingSelection.set({ cabinId, arrival: normalized });
      return;
    }

    this.applySelection(cabinId, normalized, normalized, { merge: false });
    this.pendingSelection.set({ cabinId, arrival: normalized });
  }

  clearCabinSelection(cabinId: number): void {
    this.cabinSelections.update((current) => {
      const next = { ...current };
      delete next[cabinId];
      return next;
    });

    if (this.pendingSelection()?.cabinId === cabinId) {
      this.pendingSelection.set(null);
    }
  }

  isCellSelectable(cabinId: number, date: Date): boolean {
    const today = startOfDay(new Date());
    if (startOfDay(date) < today) {
      return false;
    }

    const quote = this.availabilityMap()[cabinId];
    const status = quote?.days?.[toDateKey(date)];
    return status === 'available';
  }

  isCabinSelected(cabinId: number): boolean {
    return !!this.cabinSelections()[cabinId];
  }

  isDateInCabinSelection(cabinId: number, date: Date): boolean {
    const selection = this.cabinSelections()[cabinId];
    if (!selection) {
      return false;
    }

    const key = toDateKey(date);
    return key >= toDateKey(selection.arrival) && key < toDateKey(selection.departure);
  }

  isPendingAnchor(cabinId: number, date: Date): boolean {
    const pending = this.pendingSelection();
    if (!pending || pending.cabinId !== cabinId) {
      return false;
    }

    return toDateKey(pending.arrival) === toDateKey(date);
  }

  isDateInPendingRange(cabinId: number, date: Date): boolean {
    const pending = this.pendingSelection();
    if (!pending || pending.cabinId !== cabinId) {
      return false;
    }

    return toDateKey(date) === toDateKey(pending.arrival);
  }

  getCabinById(cabinId: number): CabinConfig | undefined {
    return this.cabins.find((cabin) => cabin.id === cabinId);
  }

  getCabinSelection(cabinId: number): CabinSelection | undefined {
    return this.cabinSelections()[cabinId];
  }

  submitCheckout(guest: GuestDetails): void {
    if (this.cartItems().length === 0 || this.checkoutLoading()) {
      return;
    }

    this.checkoutLoading.set(true);
    this.checkoutError.set(null);

    this.api
      .createCheckout({
        guest,
        adults: this.guestCount(),
        embed: this.route?.snapshot.queryParamMap.get('embed') === '1',
        cabins: this.cartItems().map((item) => ({
          cabinId: item.cabin.id,
          arrival: toDateKey(item.selection.arrival),
          departure: toDateKey(item.selection.departure),
        })),
      })
      .subscribe({
        next: (response) => {
          if (response.reference) {
            this.checkoutReference.set(response.reference);
          }

          const paymentUrl = response.paymentUrl ?? response.url;
          if (typeof window !== 'undefined' && paymentUrl) {
            window.location.assign(paymentUrl);
            return;
          }

          if (typeof window !== 'undefined' && response.reference) {
            void this.router.navigate(['/group-booking/checkout/success'], {
              queryParams: { reference: response.reference },
              queryParamsHandling: 'merge',
            });
            return;
          }

          this.checkoutLoading.set(false);
          this.checkoutError.set('Bookingmood did not return a payment link.');
        },
        error: (error: { error?: { error?: string } }) => {
          this.checkoutLoading.set(false);
          this.checkoutError.set(
            error?.error?.error ?? 'Unable to start checkout. Please try again.',
          );
        },
      });
  }

  loadCheckoutReference(reference: string): void {
    if (!reference) {
      return;
    }

    this.checkoutReference.set(reference);
    this.bookingStatus.set(null);
    this.checkoutLoading.set(true);
    this.checkoutError.set(null);

    this.api.getBookingStatus(reference).subscribe({
      next: (status) => {
        this.bookingStatus.set(status);
        this.checkoutLoading.set(false);
      },
      error: () => {
        this.checkoutLoading.set(false);
        this.checkoutError.set(
          'We could not verify this booking yet. Payment and confirmation are only shown after webhook-verified status is available.',
        );
      },
    });
  }

  startNewBooking(): void {
    this.checkoutReference.set(null);
    this.checkoutError.set(null);
  }

  private applySelection(
    cabinId: number,
    rangeStart: Date,
    rangeEndLastNight: Date,
    options: { merge?: boolean } = { merge: true },
  ): void {
    let arrival = startOfDay(rangeStart);
    let lastNight = startOfDay(rangeEndLastNight);

    if (lastNight < arrival) {
      [arrival, lastNight] = [lastNight, arrival];
    }

    const existing = this.cabinSelections()[cabinId];
    if (existing && options.merge !== false) {
      if (arrival > existing.arrival) {
        arrival = existing.arrival;
      }

      const existingLastNight = addDays(existing.departure, -1);
      if (lastNight < existingLastNight) {
        lastNight = existingLastNight;
      }
    }

    const departure = addDays(lastNight, 1);

    if (!this.isRangeAvailable(cabinId, arrival, departure)) {
      this.selectionError.set(
        'Some nights in that range are unavailable. Choose consecutive available dates.',
      );
      return;
    }

    this.cabinSelections.update((current) => ({
      ...current,
      [cabinId]: { cabinId, arrival, departure },
    }));
  }

  private extendSelectionByOneDay(
    selection: CabinSelection,
    date: Date,
  ): { arrival: Date; departure: Date } | null {
    const normalized = startOfDay(date);
    const dayBeforeArrival = addDays(selection.arrival, -1);
    const firstDayAfterStay = selection.departure;

    if (toDateKey(normalized) === toDateKey(dayBeforeArrival)) {
      return { arrival: normalized, departure: selection.departure };
    }

    if (toDateKey(normalized) === toDateKey(firstDayAfterStay)) {
      return { arrival: selection.arrival, departure: addDays(normalized, 1) };
    }

    return null;
  }

  private isRangeAvailable(cabinId: number, arrival: Date, departure: Date): boolean {
    const quote = this.availabilityMap()[cabinId];
    if (!quote) {
      return false;
    }

    return eachNight(arrival, departure).every(
      (night) => quote.days[toDateKey(night)] === 'available',
    );
  }

  private applyListingQuoteMerge(): void {
    const quotes = this.listingQuotes();
    if (Object.keys(quotes).length === 0) {
      return;
    }

    this.availabilityMap.update((current) => {
      const next = { ...current };
      for (const [id, quote] of Object.entries(quotes)) {
        const cabinId = Number(id);
        const existing = next[cabinId];
        if (!existing) {
          next[cabinId] = quote;
          continue;
        }

        next[cabinId] = {
          ...existing,
          days: { ...existing.days, ...quote.days },
          dayRates: { ...existing.dayRates, ...quote.dayRates },
        };
      }
      return next;
    });
  }

  private hydrateCart(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedCart;
      if (typeof parsed.guestCount === 'number') {
        this.guestCount.set(parsed.guestCount);
      }

      if (parsed.availabilityMap && typeof parsed.availabilityMap === 'object') {
        this.availabilityMap.set(parsed.availabilityMap);
      }

      if (parsed.cabinSelections && typeof parsed.cabinSelections === 'object') {
        const next: Record<number, CabinSelection> = {};
        for (const selection of Object.values(parsed.cabinSelections)) {
          if (!selection?.arrival || !selection?.departure) {
            continue;
          }

          next[selection.cabinId] = {
            cabinId: selection.cabinId,
            arrival: parseDateKey(selection.arrival),
            departure: parseDateKey(selection.departure),
          };
        }
        this.cabinSelections.set(next);
      }
    } catch {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  private persistCart(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const payload: PersistedCart = {
      guestCount: this.guestCount(),
      availabilityMap: this.availabilityMap(),
      cabinSelections: Object.fromEntries(
        Object.entries(this.cabinSelections()).map(([id, selection]) => [
          id,
          {
            cabinId: selection.cabinId,
            arrival: toDateKey(selection.arrival),
            departure: toDateKey(selection.departure),
          },
        ]),
      ),
    };

    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  }
}
