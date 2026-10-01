import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import {
  DAY_PLAN,
  LOCAL_TIPS,
  MAP_LEGEND,
  RECOMMENDATION_PICKS,
  RECOMMENDATIONS_CTA_IMAGE,
  RECOMMENDATIONS_DAY_PLAN_IMAGE,
  RECOMMENDATIONS_HERO_IMAGE,
  TRIP_VIBES,
} from './recommendations.data';

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recommendations {
  private readonly title = inject(Title);

  protected readonly picks = RECOMMENDATION_PICKS;
  protected readonly localTips = LOCAL_TIPS;
  protected readonly dayPlan = DAY_PLAN;
  protected readonly tripVibes = TRIP_VIBES;
  protected readonly mapLegend = MAP_LEGEND;
  protected readonly heroImage = RECOMMENDATIONS_HERO_IMAGE;
  protected readonly dayPlanImage = RECOMMENDATIONS_DAY_PLAN_IMAGE;
  protected readonly ctaImage = RECOMMENDATIONS_CTA_IMAGE;

  constructor() {
    this.title.setTitle('Remotely Rogers — Recommendations');
  }
}
