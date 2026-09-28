import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectButton } from 'primeng/selectbutton';

import {
  ADVENTURE_DAY,
  CULTURE_SPOTS,
  DINING_SPOTS,
  FEATURED_ACTIVITIES,
  OUTDOOR_SPOTS,
  TRAILS,
} from './activities.data';

@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, SelectButton],
  templateUrl: './activities.html',
})
export class Activities {
  readonly categoryOptions = [
    { label: 'All', value: 'All' },
    { label: 'Outdoor', value: 'Outdoor' },
    { label: 'Biking', value: 'Biking' },
    { label: 'History', value: 'History' },
    { label: 'Dining', value: 'Dining' },
    { label: 'Nightlife', value: 'Nightlife' },
    { label: 'Weekend', value: 'Weekend trips' },
  ];

  readonly selectedCategory = signal('All');

  readonly featured = FEATURED_ACTIVITIES;
  readonly outdoorSpots = OUTDOOR_SPOTS;
  readonly adventureDay = ADVENTURE_DAY;
  readonly trails = TRAILS;
  readonly cultureSpots = CULTURE_SPOTS;
  readonly diningSpots = DINING_SPOTS;

  private matchesCategory(categories: string[]): boolean {
    const selected = this.selectedCategory();
    if (selected === 'All') {
      return true;
    }
    if (selected === 'Weekend trips') {
      return false;
    }
    return categories.includes(selected);
  }

  readonly filteredFeatured = computed(() =>
    this.featured.filter((item) => this.matchesCategory(item.categories)),
  );

  readonly showOutdoorSection = computed(() => this.matchesCategory(['Outdoor']));

  readonly showBikingSection = computed(() => this.matchesCategory(['Biking']));

  readonly filteredCultureSpots = computed(() =>
    this.cultureSpots.filter((spot) => this.matchesCategory(spot.categories)),
  );

  readonly showDiningSection = computed(() => this.matchesCategory(['Dining']));

  readonly hasVisibleContent = computed(
    () =>
      this.filteredFeatured().length > 0 ||
      this.showOutdoorSection() ||
      this.showBikingSection() ||
      this.filteredCultureSpots().length > 0 ||
      this.showDiningSection(),
  );

  showAll(): void {
    this.selectedCategory.set('All');
  }
}
