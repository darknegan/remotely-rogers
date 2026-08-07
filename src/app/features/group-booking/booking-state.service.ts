import { Injectable, computed, inject, signal } from '@angular/core';

import { finalize } from 'rxjs';



import { BookingApiService } from '../../core/services/booking-api.service';

import {

  CabinAvailability,

  CabinCartItem,

  CabinConfig,

  CabinSelection,

  DateRange,

} from '../../core/models/booking.models';

import {

  addDays,

  differenceInCalendarDays,

  eachNight,

  nightCount,

  startOfDay,

  toDateKey,

} from '../../core/utils/date-utils';

const MAX_AUTO_FILL_GAP_DAYS = 5;



export const DEFAULT_VIEW_DAYS = 7;



interface PendingCellSelection {

  cabinId: number;

  arrival: Date;

}



@Injectable()

export class BookingStateService {

  private readonly api = inject(BookingApiService);



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



        return {

          cabin,

          selection,

          nights,

          totalPrice: (quote?.nightlyRate ?? 0) * nights,

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



  setGuestCount(count: number): void {

    const max = this.config.maxGuestsPerCabin;

    this.guestCount.set(Math.min(max, Math.max(1, count)));

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

        },

        error: () => {

          this.error.set('Unable to load availability. Please try again.');

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
      pending?.cabinId === cabinId
        ? startOfDay(pending.arrival)
        : addDays(existing.departure, -1);
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

    return quote?.days?.[toDateKey(date)] === 'available';

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



  private isRangeAvailable(cabinId: number, arrival: Date, departure: Date): boolean {

    const quote = this.availabilityMap()[cabinId];

    if (!quote) {

      return false;

    }



    return eachNight(arrival, departure).every(

      (night) => quote.days[toDateKey(night)] === 'available',

    );

  }

}


