import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Popover } from 'primeng/popover';

import { SearchState } from '../../core/search/search-state.service';

@Component({
  selector: 'app-booking-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Button, DatePicker, InputNumber, Popover],
  templateUrl: './booking-bar.html',
})
export class BookingBar {
  readonly search = inject(SearchState);
  private readonly router = inject(Router);
  readonly guestLabel = signal('Guests');

  searchCabins(): void {
    if (!this.search.canSearch()) {
      return;
    }
    void this.router.navigate(['/cabins'], { queryParams: this.search.toQuery() });
  }
}
