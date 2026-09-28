import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';

import { CabinSearchStore } from '../../core/cabins/cabin-search.store';
import { BookingBar } from '../../layout/booking-bar/booking-bar';
import { MapEmbed } from '../../layout/map-embed/map-embed';

@Component({
  selector: 'app-cabin-listing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Button, Dialog, Select, BookingBar, MapEmbed],
  templateUrl: './cabin-listing.html',
})
export class CabinListing {
  readonly store = inject(CabinSearchStore);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap);

  readonly sortOptions = [
    { label: 'Price: low to high', value: 'asc' as const },
    { label: 'Price: high to low', value: 'desc' as const },
  ];

  readonly bedroomOptions = [
    { label: 'Any bedrooms', value: 0 },
    { label: '2+ bedrooms', value: 2 },
    { label: '3+ bedrooms', value: 3 },
  ];

  readonly amenityKeys = [
    ['wifi', 'Wi-Fi'],
    ['pets', 'Pets welcome'],
    ['parking', 'Parking'],
    ['workspace', 'Dedicated workspace'],
    ['fireplace', 'Fireplace'],
  ] as const;

  constructor() {
    effect(() => {
      const params = this.params();
      if (params) {
        this.store.search.hydrate(params);
      }
    });
  }
}
