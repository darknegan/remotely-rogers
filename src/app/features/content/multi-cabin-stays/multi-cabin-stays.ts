import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { BookingStateService } from '../../group-booking/booking-state.service';
import { GroupBookingShell } from '../../group-booking/shell/shell';
import {
  MULTI_CABIN_HERO_IMAGE,
  MULTI_CABIN_STATS,
  MULTI_CABIN_STEPS,
} from './multi-cabin.data';

@Component({
  selector: 'app-multi-cabin-stays',
  providers: [BookingStateService],
  imports: [GroupBookingShell, RouterLink],
  templateUrl: './multi-cabin-stays.html',
  styleUrl: './multi-cabin-stays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiCabinStays implements OnInit {
  private readonly title = inject(Title);

  protected readonly heroImage = MULTI_CABIN_HERO_IMAGE;
  protected readonly stats = MULTI_CABIN_STATS;
  protected readonly steps = MULTI_CABIN_STEPS;

  ngOnInit(): void {
    this.title.setTitle('Remotely Rogers — Multi-Cabin Stays');
  }
}
