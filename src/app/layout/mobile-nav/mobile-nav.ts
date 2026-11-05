import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Drawer } from 'primeng/drawer';

import { SITE_NAV_LINKS } from '../nav-links';

@Component({
  selector: 'app-mobile-nav',
  imports: [Drawer, RouterLink, RouterLinkActive],
  templateUrl: './mobile-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNav {
  readonly visible = input(false);
  readonly visibleChange = output<boolean>();
  readonly links = SITE_NAV_LINKS;

  close(): void {
    this.visibleChange.emit(false);
  }
}
