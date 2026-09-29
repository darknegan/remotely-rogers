import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Drawer } from 'primeng/drawer';

import { CABIN_AMENITY_OPTIONS, BedroomFilter } from '../cabins.data';
import { CabinSearchStore } from '../cabin-search.store';

@Component({
  selector: 'app-cabins-filters',
  imports: [Drawer],
  templateUrl: './cabins-filters.html',
  styleUrl: './cabins-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinsFilters {
  protected readonly store = inject(CabinSearchStore);
  protected readonly amenityOptions = CABIN_AMENITY_OPTIONS;

  protected readonly bedroomOptions: { label: string; value: BedroomFilter }[] = [
    { label: 'Any', value: 'any' },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
  ];

  protected close(): void {
    this.store.closeFilters();
  }

  protected apply(): void {
    this.store.applyFilters();
  }

  protected clearAll(): void {
    this.store.clearFilters();
  }
}
