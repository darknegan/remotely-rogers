import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import {
  ACTIVITY_CULTURE_IMAGE,
  ACTIVITY_EMPTY_IMAGE,
  ACTIVITY_HERO_IMAGE,
  ADVENTURE_DAY,
  CATEGORY_OPTIONS,
  CULTURE_SPOTS,
  DINING_SPOTS,
  FEATURED_ACTIVITIES,
  OUTDOOR_SPOTS,
  TRAIL_SPOTS,
  ActivityCategory,
  FeaturedActivity,
  filterCulture,
  filterFeatured,
  filterSummary,
  hasVisibleContent,
  isBikingFilter,
  showCultureSection,
  showDiningSection,
  showFeaturedGrid,
  showOutdoorSection,
  showTrailsBand,
  showTrailsCards,
} from './activities.data';

@Component({
  selector: 'app-activities',
  imports: [RouterLink],
  templateUrl: './activities.html',
  styleUrl: './activities.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Activities {
  private readonly title = inject(Title);

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly featured = FEATURED_ACTIVITIES;
  protected readonly outdoorSpots = OUTDOOR_SPOTS;
  protected readonly trails = TRAIL_SPOTS;
  protected readonly cultureSpots = CULTURE_SPOTS;
  protected readonly diningSpots = DINING_SPOTS;
  protected readonly adventureDay = ADVENTURE_DAY;
  protected readonly heroImage = ACTIVITY_HERO_IMAGE;
  protected readonly cultureImage = ACTIVITY_CULTURE_IMAGE;
  protected readonly emptyImage = ACTIVITY_EMPTY_IMAGE;

  protected readonly selectedCategory = signal<ActivityCategory>('All');

  protected readonly filteredFeatured = computed(() =>
    filterFeatured(this.selectedCategory()),
  );

  protected readonly filteredCulture = computed(() =>
    filterCulture(this.selectedCategory()),
  );

  protected readonly isAllView = computed(() => this.selectedCategory() === 'All');
  protected readonly isEmptyFilter = computed(
    () => !hasVisibleContent(this.selectedCategory()) && !this.isAllView(),
  );
  protected readonly filterSummaryLabel = computed(() =>
    filterSummary(this.selectedCategory()),
  );
  protected readonly showOutdoor = computed(() => showOutdoorSection(this.selectedCategory()));
  protected readonly showTrailsBandSection = computed(() =>
    showTrailsBand(this.selectedCategory()),
  );
  protected readonly showTrailsCardGrid = computed(() =>
    showTrailsCards(this.selectedCategory()),
  );
  protected readonly showCulture = computed(() =>
    showCultureSection(this.selectedCategory()),
  );
  protected readonly showDining = computed(() => showDiningSection(this.selectedCategory()));
  protected readonly showFeaturedLayout = computed(() =>
    showFeaturedGrid(this.selectedCategory()),
  );
  protected readonly bikingFilter = computed(() => isBikingFilter(this.selectedCategory()));

  constructor() {
    this.title.setTitle('Remotely Rogers — Activities');
  }

  protected selectCategory(category: ActivityCategory): void {
    this.selectedCategory.set(category);
  }

  protected showAll(): void {
    this.selectedCategory.set('All');
  }

  protected isFeaturedLarge(item: FeaturedActivity): boolean {
    return !!item.large && this.showFeaturedLayout();
  }
}
