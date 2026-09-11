import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
export class CabinGrid {
  protected readonly state = inject(BookingStateService);
  private readonly today = startOfDay(new Date());

  readonly formatShortDate = formatShortDate;
  readonly formatWeekday = formatWeekday;
  readonly formatDateRangeLabel = formatDateRangeLabel;
  readonly toDateKey = toDateKey;

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
    return quote?.dayRates?.[toDateKey(date)];
  }

  segmentTrack(segment: DaySegment): string {
    return `${segment.status}-${toDateKey(segment.dates[0])}-${segment.colspan}`;
  }

  getSegments(quote: CabinAvailability | undefined, dates: Date[]): DaySegment[] {
    const segments: DaySegment[] = [];
    let current: DaySegment | null = null;

    for (const date of dates) {
      const status = quote?.days?.[toDateKey(date)] ?? 'available';

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
    return status === 'booked' ? 'Reserved' : 'Closed period';
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
}
