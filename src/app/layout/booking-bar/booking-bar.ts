import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Popover } from 'primeng/popover';

import { formatGuestCount } from '../../core/utils/guest-label';
import { SearchState } from '../../core/search/search-state.service';

@Component({
  selector: 'app-booking-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.rr-booking-bar--on-hero]': 'onHero()',
  },
  imports: [FormsModule, Button, DatePicker, InputNumber, Popover],
  templateUrl: './booking-bar.html',
  styleUrl: './booking-bar.scss',
})
export class BookingBar {
  readonly onHero = input(false);
  readonly search = inject(SearchState);
  private readonly router = inject(Router);
  readonly partyLabel = computed(() => formatGuestCount(this.search.partySize()));

  searchCabins(): void {
    if (!this.search.canSearch()) {
      return;
    }
    void this.router.navigate(['/cabins'], { queryParams: this.search.toQuery() });
  }
}
