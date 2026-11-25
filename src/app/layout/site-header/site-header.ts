import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Drawer } from 'primeng/drawer';

import { customBookingReservationsOff } from '../../core/booking/booking-reservations-off';
import { SITE_LINKS } from '../../core/content/site-nav';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Drawer],
  templateUrl: './site-header.html',
})
export class SiteHeader {
  readonly links = SITE_LINKS;
  readonly menuOpen = signal(false);
  readonly reservationsOff = customBookingReservationsOff();

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
