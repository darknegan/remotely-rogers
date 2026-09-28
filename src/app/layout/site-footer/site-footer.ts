import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FOOTER_NAV_LINKS } from '../nav-links';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  readonly links = FOOTER_NAV_LINKS;
  readonly year = new Date().getFullYear();
}
