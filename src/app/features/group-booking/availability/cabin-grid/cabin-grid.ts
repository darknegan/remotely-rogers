import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy } from '@angular/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';

import { BookingStateService } from '../../booking-state.service';
import {
  formatDateRangeLabel,
  formatShortDate,
  formatWeekday,
  startOfDay,
  toDateKey,
} from '../../../../core/utils/date-utils';
import { shortCabinName } from '../../../../core/utils/reviews';
import { CabinAvailability, DayRate, DayStatus } from '../../../../core/models/booking.models';

export interface DaySegment {
  status: DayStatus | 'available';
  dates: Date[];
  colspan: number;
}

@Component({
  selector: 'app-cabin-grid',
  imports: [CurrencyPipe, Button, Message, ProgressSpinner],
  templateUrl: './cabin-grid.html',
  styleUrl: './cabin-grid.scss',
})
export class CabinGrid implements AfterViewInit, OnDestroy {
  protected readonly state = inject(BookingStateService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly today = startOfDay(new Date());
  private resizeObserver?: ResizeObserver;
  private resizeFrame = 0;

  readonly formatShortDate = formatShortDate;
  readonly formatWeekday = formatWeekday;
  readonly formatDateRangeLabel = formatDateRangeLabel;
  readonly toDateKey = toDateKey;

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.resizeFrame);
      }
      this.resizeFrame = requestAnimationFrame(() => this.syncVisibleDays());
    });
    this.resizeObserver.observe(this.host.nativeElement);
    this.syncVisibleDays();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.resizeFrame);
    }
  }

  /** Keep the date columns from leaving a dead zone beside a short week. */
  tableMinWidth(): string {
    const days = Math.max(this.state.timelineDates().length, 1);
    return `max(100%, calc(var(--rr-cabin-col) + ${days} * var(--rr-day-col)))`;
  }

  isToday(date: Date): boolean {
    return toDateKey(date) === toDateKey(this.today);
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  isPast(date: Date): boolean {
    return toDateKey(date) < toDateKey(this.today);
  }

  dayRate(quote: CabinAvailability | undefined, date: Date): DayRate | undefined {
    if (!quote) {
      return undefined;
    }

    const exact = quote.dayRates?.[toDateKey(date)];
    if (exact && exact.price > 0) {
      return exact;
    }

    if (quote.days?.[toDateKey(date)] !== 'available' || quote.nightlyRate <= 0) {
      return exact;
    }

    return {
      price: quote.nightlyRate,
      minStay: exact?.minStay || this.state.config.minNights,
    };
  }

  segmentTrack(segment: DaySegment): string {
    return `${segment.status}-${toDateKey(segment.dates[0])}-${segment.colspan}`;
  }

  getSegments(quote: CabinAvailability | undefined, dates: Date[]): DaySegment[] {
    const segments: DaySegment[] = [];
    let current: DaySegment | null = null;

    for (const date of dates) {
      const status = quote?.days?.[toDateKey(date)] ?? 'unknown';

      if (status === 'available') {
        if (current) {
          segments.push(current);
          current = null;
        }

        segments.push({
          status: 'available',
          dates: [date],
          colspan: 1,
        });
        continue;
      }

      if (current && current.status === status) {
        current.dates.push(date);
        current.colspan += 1;
        continue;
      }

      if (current) {
        segments.push(current);
      }

      current = {
        status,
        dates: [date],
        colspan: 1,
      };
    }

    if (current) {
      segments.push(current);
    }

    return segments;
  }

  barLabel(status: DayStatus): string {
    if (status === 'booked') {
      return 'Reserved';
    }
    if (status === 'pending') {
      return 'Pending';
    }
    if (status === 'closed' || status === 'blocked') {
      return 'Unavailable';
    }
    return 'Unavailable';
  }

  displayCabinName(name: string): string {
    return shortCabinName(name);
  }

  onCellClick(cabinId: number, date: Date): void {
    this.state.selectCell(cabinId, date);
  }

  shiftView(direction: -1 | 1): void {
    this.state.shiftView(direction);
  }

  goToToday(): void {
    this.state.resetToDefaultView();
  }

  private syncVisibleDays(): void {
    const width = this.host.nativeElement.clientWidth;
    if (width < 280 || typeof window === 'undefined') {
      return;
    }

    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    const cabinCol = (narrow ? 6.5 : 14.5) * rootFont;
    const dayCol = (narrow ? 3.35 : 3.7) * rootFont;
    const days = Math.floor((width - cabinCol) / dayCol);
    this.state.setViewDayCount(days);
  }
}
