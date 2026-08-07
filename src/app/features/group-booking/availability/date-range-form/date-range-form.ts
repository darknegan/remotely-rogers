import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Message } from 'primeng/message';

import { BookingStateService } from '../../booking-state.service';
import { startOfDay } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-date-range-form',
  imports: [FormsModule, DatePicker, InputNumber, Button, Message],
  templateUrl: './date-range-form.html',
  styleUrl: './date-range-form.scss',
})
export class DateRangeForm implements OnInit {
  protected readonly state = inject(BookingStateService);

  readonly minDate = startOfDay(new Date());
  readonly startDate = computed(() => this.state.viewStartDate());

  ngOnInit(): void {
    this.state.initializeDefaultView();
    if (!this.state.dateError() && this.state.viewStartDate()) {
      this.state.searchAvailability();
    }
  }

  onStartDateChange(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? value[0] : value;
    this.state.setViewStartDate(date);
  }

  onGuestsChange(value: number | null): void {
    this.state.setGuestCount(value ?? 1);
  }

  search(): void {
    this.state.searchAvailability();
  }
}
