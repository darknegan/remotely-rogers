import { Injectable, computed, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../services/booking-api.service';
import { CabinAvailability } from '../../models/booking.models';

/** Manual capacity group max from Bookingmood when channel capacity is not loaded yet. */
const BOOKINGMOOD_CAPACITY_GROUP_MAX_FALLBACK = 2;
import { environment } from '../../../../environments/environment';
import { BOOKINGMOOD_PRODUCT_IDS, bookingmoodProductId } from '../bookingmood-products';
import { addDays, formatDateRangeLabel, nightCount, startOfDay, toDateKey } from '../../utils/date-utils';
import {
  assertAllowedPaymentUrl,
} from './booking-payment-url';
import {
  BookingmoodChannelClient,
  BookingmoodChannelError,
} from './bookingmood-channel-client';
import { BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED } from './bookingmood-channel-checkout-gate';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from './bookingmood-channel-allowlist';
import {
  RESERVED_STAY_RANGE_NOTICE,
  buildDayKinds,
  mergeScopedCalendarDayKinds,
  mergeWorkerBlockedDays,
  overlayWorkerDayStatuses,
  productLabel,
  stayRangeIsBookable,
  stayRangeIsWorkerAvailable,
} from './booking-channel-calendar';
import {
  buildFormValuesForCart,
  BookingmoodServiceFormValue,
} from './booking-channel-form-values';
import {
  BookingmoodCartItemRequest,
  BookingmoodCartValidateItem,
  BookingmoodChannelPayload,
  BookingmoodChannelProduct,
  BookingmoodFormService,
  BookingmoodProductAvailability,
  CalendarDayKind,
} from './bookingmood-channel.types';

export type CustomBookingStep = 'dates' | 'guest' | 'review' | 'payment' | 'status';

export interface SelectedCabinOccupancy {
  productId: string;
  cabinId: number;
  occupancy: Record<string, number>;
}

export interface WorkerPriceLine {
  productId: string;
  subtotalDollars: number;
  available: boolean;
  hasPricedQuote: boolean;
}

@Injectable()
export class BookingChannelStateService {
  private readonly client = new BookingmoodChannelClient();
  private readonly api = inject(BookingApiService);

  readonly channelId = signal(environment.bookingmoodChannelId || DEV_BOOKINGMOOD_CHANNEL_ID);
  readonly channelPayload = signal<BookingmoodChannelPayload | null>(null);
  readonly availabilityByProduct = signal<Record<string, BookingmoodProductAvailability>>({});
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly validating = signal(false);
  readonly validateError = signal<string | null>(null);
  readonly validatedItems = signal<BookingmoodCartValidateItem[] | null>(null);
  readonly quoteLoading = signal(false);
  readonly quoteError = signal<string | null>(null);
  readonly workerQuotesByProduct = signal<Record<string, CabinAvailability>>({});
  readonly workerQuotesByCabinId = signal<Record<number, CabinAvailability>>({});
  readonly rangeConflictError = signal<string | null>(null);

  readonly checkIn = signal<Date | null>(null);
  readonly checkOut = signal<Date | null>(null);
  readonly calendarMonth = signal(startOfDay(new Date()));

  readonly selectedProductIds = signal<string[]>([]);
  readonly occupancyByProduct = signal<Record<string, Record<string, number>>>({});
  readonly formValues = signal<Record<string, BookingmoodServiceFormValue>>({});

  readonly step = signal<CustomBookingStep>('dates');
  readonly bookingId = signal<string | null>(null);
  readonly bookingSecret = signal<string | null>(null);
  readonly bookingRecord = signal<unknown | null>(null);

  readonly bookingUiEnabled = computed(
    () => environment.bookingmoodChannelBookingEnabled === true && this.channelBookable(),
  );

  readonly reservationsOff = computed(() => !BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED);

  readonly capacityGroups = computed(
    () => this.channelPayload()?.organization.capacity_groups ?? [],
  );

  readonly products = computed(() => this.channelPayload()?.products ?? []);

  readonly primaryCapacityGroupId = computed(() => this.capacityGroups()[0]?.id ?? null);

  readonly nights = computed(() => {
    const start = this.checkIn();
    const end = this.checkOut();
    if (!start || !end) {
      return 0;
    }
    return nightCount(start, end);
  });

  readonly totalSelectedGuests = computed(() =>
    this.selectedProductIds().reduce(
      (sum, productId) => sum + this.totalGuestsForProduct(productId),
      0,
    ),
  );

  readonly sharedRangeLabel = computed(() => {
    const start = this.checkIn();
    const end = this.checkOut();
    if (!start || !end) {
      return '';
    }
    return formatDateRangeLabel(start, end);
  });

  readonly minStayError = computed(() => {
    const start = this.checkIn();
    const end = this.checkOut();
    if (!start || !end) {
      return null;
    }
    const min = CABIN_CONFIG.minNights;
    if (nightCount(start, end) < min) {
      return `Minimum stay is ${min} nights.`;
    }
    return null;
  });

  /** Nights line in summaries; flags min-stay violations alongside selected night count. */
  readonly pricingReady = computed(() => {
    const start = this.checkIn();
    const end = this.checkOut();
    if (!start || !end) {
      return false;
    }
    return !this.minStayError() && !this.rangeConflictError();
  });

  readonly summaryNightsLabel = computed(() => {
    const nights = this.nights();
    if (nights <= 0) {
      return '0 nights';
    }
    const nightsWord = nights === 1 ? '1 night' : `${nights} nights`;
    if (this.minStayError()) {
      return `${nightsWord} (minimum ${CABIN_CONFIG.minNights} nights)`;
    }
    return nightsWord;
  });

  readonly cartLineItems = computed(() => this.validatedItems() ?? []);

  readonly cartTotalCents = computed(() =>
    this.cartLineItems().reduce((sum, row) => sum + (row.price?.total ?? 0), 0),
  );

  readonly workerPriceLines = computed((): WorkerPriceLine[] =>
    this.selectedProductIds().map((productId) => {
      const quote = this.workerQuotesByProduct()[productId];
      const hasPricedQuote = Boolean(quote?.available && (quote.totalPrice ?? 0) > 0);
      return {
        productId,
        subtotalDollars: hasPricedQuote ? quote!.totalPrice : 0,
        available: quote?.available ?? false,
        hasPricedQuote,
      };
    }),
  );

  readonly workerTotalDollars = computed(() =>
    this.workerPriceLines().reduce(
      (sum, row) => sum + (row.hasPricedQuote ? row.subtotalDollars : 0),
      0,
    ),
  );

  readonly formServices = computed(() => {
    const product = this.products()[0];
    return product?.services ?? [];
  });

  readonly calendarDayMap = computed((): Record<string, CalendarDayKind> => {
    const scopeIds = this.calendarScopeProductIds();
    if (scopeIds.length === 0) {
      return {};
    }
    const month = this.calendarMonth();
    const visibleEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const start = this.checkIn();
    const end = this.checkOut();
    const range = start
      ? end
        ? { checkIn: start, checkOut: end }
        : { checkIn: start, checkOut: addDays(start, 1) }
      : null;

    const perProduct = scopeIds.map((productId) => {
      const row = this.availabilityByProduct()[productId];
      return buildDayKinds(row?.events, row?.price_calendar_entries, range, month, visibleEnd);
    });
    let kinds =
      scopeIds.length === 1 ? perProduct[0]! : mergeScopedCalendarDayKinds(perProduct);

    const workerMaps = scopeIds.map((productId) => {
      const cabinId = this.cabinIdForProductId(productId);
      return cabinId != null ? this.workerQuotesByCabinId()[cabinId]?.days : undefined;
    });
    const workerDays =
      scopeIds.length === 1 ? workerMaps[0] : mergeWorkerBlockedDays(workerMaps);
    if (workerDays) {
      kinds = overlayWorkerDayStatuses(kinds, workerDays);
    }
    return kinds;
  });

  private channelBookable(): boolean {
    return this.channelPayload()?.channel.bookable === true;
  }

  singleProductId(): string | null {
    return this.selectedProductIds()[0] ?? null;
  }

  setSingleProductForCabin(cabinId: number): void {
    const productId = bookingmoodProductId(cabinId);
    if (!productId) {
      return;
    }
    this.selectedProductIds.set([productId]);
    this.seedOccupancy(productId);
    this.revalidateSelectedStayRange();
  }

  seedOccupancy(productId: string): void {
    const groupId = this.capacityGroupIdForProduct(productId);
    if (!groupId) {
      return;
    }
    const product = this.products().find((p) => p.id === productId);
    const max = this.maxGuestsForProduct(productId);
    const min = product?.capacity?.[groupId]?.min ?? 1;
    this.occupancyByProduct.update((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? {}),
        [groupId]: Math.min(Math.max(min, 1), max),
      },
    }));
  }

  loadChannel(): void {
    if (!environment.useCustomBookingComponents) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    void this.client
      .getChannel(this.channelId())
      .then((payload) => {
        this.channelPayload.set(payload);
        const availability = payload.availability ?? [];
        const map: Record<string, BookingmoodProductAvailability> = {};
        for (const row of availability) {
          map[row.product_id] = row;
        }
        this.availabilityByProduct.set(map);
        this.loading.set(false);
        this.refreshWorkerCalendarWindow();
      })
      .catch((err: unknown) => {
        this.loading.set(false);
        this.error.set(this.readableError(err));
      });
  }

  refreshAvailability(productIds: string[]): void {
    if (!environment.useCustomBookingComponents || productIds.length === 0) {
      return;
    }

    void this.client
      .getAvailability(this.channelId(), productIds)
      .then((rows) => {
        this.availabilityByProduct.update((current) => {
          const next = { ...current };
          for (const row of rows) {
            next[row.product_id] = row;
          }
          return next;
        });
      })
      .catch(() => {
        this.error.set('Could not refresh availability. Try again.');
      });
  }

  beginDateSelection(checkIn: Date): void {
    this.clearDateSelection();
    this.checkIn.set(startOfDay(checkIn));
  }

  clearDateSelection(): void {
    this.checkIn.set(null);
    this.checkOut.set(null);
    this.validatedItems.set(null);
    this.validateError.set(null);
    this.rangeConflictError.set(null);
    this.workerQuotesByProduct.set({});
    this.quoteLoading.set(false);
    this.quoteError.set(null);
  }

  setDates(checkIn: Date, checkOut: Date): void {
    this.checkIn.set(startOfDay(checkIn));
    this.checkOut.set(startOfDay(checkOut));
    this.validatedItems.set(null);
    this.validateError.set(null);
    this.rangeConflictError.set(null);
    if (this.minStayError()) {
      this.validateError.set(this.minStayError());
    }
    if (!this.stayRangeAllowed(checkIn, checkOut)) {
      this.rangeConflictError.set(RESERVED_STAY_RANGE_NOTICE);
    }
    this.refreshWorkerQuotes();
  }

  /** Complete a stay range; returns false when reserved/closed nights block the range (mock 03). */
  completeStayRange(checkOut: Date): boolean {
    const checkIn = this.checkIn();
    if (!checkIn) {
      return false;
    }
    const normalizedOut = startOfDay(checkOut);
    if (!this.stayRangeAllowed(checkIn, normalizedOut)) {
      this.checkIn.set(null);
      this.checkOut.set(null);
      this.workerQuotesByProduct.set({});
      this.quoteError.set(null);
      this.rangeConflictError.set(RESERVED_STAY_RANGE_NOTICE);
      return false;
    }
    this.setDates(checkIn, normalizedOut);
    return true;
  }

  refreshWorkerQuotes(): void {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    const productIds = this.selectedProductIds();
    if (!checkIn || !checkOut || !this.pricingReady()) {
      this.workerQuotesByProduct.set({});
      this.quoteLoading.set(false);
      this.quoteError.set(null);
      return;
    }

    const pricingRequest = productIds.length > 0;
    if (pricingRequest) {
      this.quoteLoading.set(true);
      this.quoteError.set(null);
    }

    const adults = Math.max(1, productIds.length > 0 ? this.totalSelectedGuests() : 2);
    this.api
      .fetchAvailability({
        arrival: toDateKey(checkIn),
        departure: toDateKey(checkOut),
        adults,
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.storeWorkerCabins(response.cabins);
          const byProduct: Record<string, CabinAvailability> = {};
          for (const productId of productIds) {
            const cabinId = this.cabinIdForProductId(productId);
            if (cabinId == null) {
              continue;
            }
            const row = this.workerQuotesByCabinId()[cabinId];
            if (row) {
              byProduct[productId] = row;
            }
          }
          this.workerQuotesByProduct.set(byProduct);
          if (pricingRequest) {
            this.quoteLoading.set(false);
          }
        },
        error: () => {
          if (pricingRequest) {
            this.quoteLoading.set(false);
            this.quoteError.set(
              'We could not load pricing right now. Your dates are saved — try again in a moment.',
            );
          }
        },
      });
  }

  refreshWorkerCalendarWindow(): void {
    const month = this.calendarMonth();
    const windowStart = startOfDay(month);
    const windowEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const adults = Math.max(1, this.totalSelectedGuests() || 2);

    this.api
      .fetchAvailability({
        arrival: toDateKey(windowStart),
        departure: toDateKey(windowEnd),
        adults,
      })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.storeWorkerCabins(response.cabins);
        },
        error: () => {
          /* calendar still works from channel events */
        },
      });
  }

  private storeWorkerCabins(cabins: CabinAvailability[]): void {
    this.workerQuotesByCabinId.update((current) => {
      const next = { ...current };
      for (const row of cabins) {
        next[row.cabinId] = row;
      }
      return next;
    });
  }

  shiftMonth(delta: number): void {
    const month = this.calendarMonth();
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    const ids = this.selectedProductIds().length
      ? this.selectedProductIds()
      : this.products().map((p) => p.id);
    this.refreshAvailability(ids);
    this.refreshWorkerCalendarWindow();
  }

  toggleProductSelection(productId: string): void {
    const selected = new Set(this.selectedProductIds());
    if (selected.has(productId)) {
      selected.delete(productId);
    } else {
      selected.add(productId);
      this.seedOccupancy(productId);
    }
    this.selectedProductIds.set([...selected]);
    this.validatedItems.set(null);
    this.revalidateSelectedStayRange();
    this.refreshWorkerQuotes();
  }

  changeOccupancy(productId: string, groupId: string, delta: number): void {
    const product = this.products().find((p) => p.id === productId);
    const limits = product?.capacity?.[groupId];
    const max = limits?.max ?? this.maxGuestsForProduct(productId);
    const min = limits?.min ?? 1;
    this.occupancyByProduct.update((current) => {
      const row = { ...(current[productId] ?? {}) };
      const next = Math.min(max, Math.max(min, (row[groupId] ?? min) + delta));
      row[groupId] = next;
      return { ...current, [productId]: row };
    });
    this.validatedItems.set(null);
    this.refreshWorkerQuotes();
  }

  totalGuestsForProduct(productId: string): number {
    const row = this.occupancyByProduct()[productId] ?? {};
    return Object.values(row).reduce((sum, value) => sum + value, 0);
  }

  productForCabinId(cabinId: number): BookingmoodChannelProduct | undefined {
    const id = bookingmoodProductId(cabinId);
    return this.products().find((p) => p.id === id);
  }

  isProductSelectable(productId: string): boolean {
    return this.productStayAllowed(productId, this.checkIn(), this.checkOut());
  }

  stayRangeAllowed(checkIn: Date, checkOut: Date): boolean {
    const selected = this.selectedProductIds();
    const scopeIds = selected.length > 0 ? selected : this.calendarScopeProductIds();
    if (scopeIds.length === 0) {
      return false;
    }
    if (selected.length > 0) {
      return selected.every((productId) => this.productStayAllowed(productId, checkIn, checkOut));
    }
    return scopeIds.some((productId) => this.productStayAllowed(productId, checkIn, checkOut));
  }

  /** Cabins whose channel + Worker data feed the group calendar when pickers have no selection yet. */
  private calendarScopeProductIds(): string[] {
    const selected = this.selectedProductIds();
    if (selected.length > 0) {
      return selected;
    }
    const fromChannel = this.products().map((product) => product.id);
    if (fromChannel.length > 0) {
      return fromChannel;
    }
    return Object.values(BOOKINGMOOD_PRODUCT_IDS);
  }

  private revalidateSelectedStayRange(): void {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) {
      return;
    }
    if (!this.stayRangeAllowed(checkIn, checkOut)) {
      this.rangeConflictError.set(RESERVED_STAY_RANGE_NOTICE);
    } else {
      this.rangeConflictError.set(null);
    }
  }

  private productStayAllowed(
    productId: string,
    checkIn: Date | null,
    checkOut: Date | null,
  ): boolean {
    if (!checkIn || !checkOut) {
      return false;
    }
    const row = this.availabilityByProduct()[productId];
    if (!stayRangeIsBookable(checkIn, checkOut, row?.events, row?.price_calendar_entries)) {
      return false;
    }
    const cabinId = this.cabinIdForProductId(productId);
    if (cabinId == null) {
      return false;
    }
    const workerDays = this.workerQuotesByCabinId()[cabinId]?.days;
    return stayRangeIsWorkerAvailable(checkIn, checkOut, workerDays);
  }

  private cabinIdForProductId(productId: string): number | null {
    for (const [id, pid] of Object.entries(BOOKINGMOOD_PRODUCT_IDS)) {
      if (pid === productId) {
        return Number(id);
      }
    }
    return null;
  }

  buildCartItems(): BookingmoodCartItemRequest[] {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) {
      return [];
    }

    const formValues = this.mapFormValuesForApi();
    return this.selectedProductIds().map((productId, index) => ({
      id: `item-${index + 1}`,
      product_id: productId,
      interval: { start: toDateKey(checkIn), end: toDateKey(checkOut) },
      occupancy: { ...(this.occupancyByProduct()[productId] ?? {}) },
      form_values: formValues,
    }));
  }

  mapFormValuesForApi(): Record<string, BookingmoodServiceFormValue> {
    return buildFormValuesForCart(this.formServices(), this.formValues());
  }

  capacityGroupIdForProduct(productId: string): string | null {
    const product = this.products().find((p) => p.id === productId);
    if (product?.capacity) {
      const keys = Object.keys(product.capacity);
      if (keys.length > 0) {
        return keys[0] ?? null;
      }
    }
    return this.primaryCapacityGroupId();
  }

  maxGuestsForProduct(productId: string): number {
    const groupId = this.capacityGroupIdForProduct(productId);
    const product = this.products().find((p) => p.id === productId);
    if (groupId && product?.capacity?.[groupId]?.max != null) {
      return product.capacity[groupId].max!;
    }
    return BOOKINGMOOD_CAPACITY_GROUP_MAX_FALLBACK;
  }

  validateCart(): void {
    const items = this.buildCartItems();
    if (items.length === 0) {
      return;
    }

    this.validating.set(true);
    this.validateError.set(null);

    void this.client
      .validateCart(this.channelId(), items)
      .then((result) => {
        this.validatedItems.set(result);
        this.validating.set(false);
      })
      .catch((err: unknown) => {
        this.validating.set(false);
        this.validateError.set(this.readableError(err));
        this.validatedItems.set(null);
      });
  }

  continueToGuestDetails(): void {
    if (this.reservationsOff()) {
      return;
    }
    this.validateCart();
    this.step.set('guest');
  }

  continueToReview(formValues: Record<string, BookingmoodServiceFormValue>): void {
    if (this.reservationsOff()) {
      return;
    }
    this.formValues.set(formValues);
    this.step.set('review');
    this.validateCart();
  }

  async proceedToPayment(): Promise<void> {
    if (this.reservationsOff() || !BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED) {
      return;
    }

    const items = this.buildCartItems();
    try {
      const result = await this.client.cartCheckout(this.channelId(), items);
      this.bookingId.set(result.booking_id);
      this.bookingSecret.set(result.secret ?? null);
      this.step.set('payment');
      if (result.payment_url) {
        assertAllowedPaymentUrl(result.payment_url);
        if (typeof window !== 'undefined') {
          window.location.assign(result.payment_url);
        }
      }
    } catch (err: unknown) {
      this.validateError.set(this.readableError(err));
    }
  }

  loadBookingStatus(bookingId: string, secret: string): void {
    void this.client.getBooking(bookingId, secret).then((record) => {
      this.bookingRecord.set(record);
      this.step.set('status');
    });
  }

  guestFacingChannelError(err: unknown): string {
    if (err instanceof BookingmoodChannelError) {
      if (err.code === 'channel_not_bookable') {
        return 'Online pricing is unavailable right now. You can still review dates and cabins.';
      }
      if (err.status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Something went wrong. Please try again.';
  }

  readableError(err: unknown): string {
    return this.guestFacingChannelError(err);
  }

  guestStepperLabel(): string {
    return 'Guests';
  }

  productName(product: BookingmoodChannelProduct): string {
    return productLabel(product.name);
  }

  serviceLabel(service: BookingmoodFormService): string {
    return service.label?.default ?? service.type;
  }

  isServiceRequired(service: BookingmoodFormService): boolean {
    return service.type === 'name' || service.type === 'email' || service.type === 'address';
  }
}