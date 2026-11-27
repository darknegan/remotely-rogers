import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { addDays, nightCount, startOfDay, toDateKey } from '../../../core/utils/date-utils';
import { CalendarDayKind } from '../../../core/booking/channel/bookingmood-channel.types';

@Component({
  selector: 'app-booking-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-calendar.html',
  styleUrl: './booking-calendar.scss',
})
export class BookingCalendar {
  readonly disabled = input(false);
  readonly daySelected = output<Date>();

  protected readonly state = inject(BookingChannelStateService);

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      this.state.calendarMonth(),
    ),
  );

  readonly weeks = computed(() => {
    const monthStart = this.state.calendarMonth();
    const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const gridStart = addDays(first, -first.getDay());
    const cells: Array<{ date: Date; inMonth: boolean; kind: CalendarDayKind }> = [];

    for (let i = 0; i < 42; i++) {
      const date = addDays(gridStart, i);
      const key = toDateKey(date);
      cells.push({
        date,
        inMonth: date.getMonth() === monthStart.getMonth(),
        kind: this.state.calendarDayMap()[key] ?? 'available',
      });
    }

    const weeks: (typeof cells)[] = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }
    return weeks;
  });

  pickDay(date: Date): void {
    if (this.disabled()) {
      return;
    }

    const normalized = startOfDay(date);
    const checkIn = this.state.checkIn();
    const checkOut = this.state.checkOut();

    if (!checkIn || checkOut) {
      this.state.beginDateSelection(normalized);
      return;
    }

    if (normalized <= checkIn) {
      if (this.state.stayRangeAllowed(checkIn, addDays(checkIn, 1))) {
        this.state.setDates(normalized, addDays(checkIn, 1));
      } else {
        this.state.beginDateSelection(normalized);
      }
      return;
    }

    const minNights = CABIN_CONFIG.minNights;
    if (nightCount(checkIn, normalized) < minNights) {
      this.state.completeStayRange(normalized);
      return;
    }
    if (this.state.completeStayRange(normalized)) {
      this.daySelected.emit(normalized);
    }
  }

  classFor(kind: CalendarDayKind, inMonth: boolean): string {
    if (!inMonth) {
      return 'rr-cal-day rr-cal-day--muted';
    }
    return `rr-cal-day rr-cal-day--${kind}`;
  }
}