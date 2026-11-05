import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  SITE_ADDRESS,
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_INSTAGRAM,
  SITE_LINKS,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_TEL,
} from '../../core/content/site-nav';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  readonly links = SITE_LINKS.filter((link) => link.path !== '/');
  readonly phone = SITE_PHONE;
  readonly phoneHref = SITE_PHONE_TEL;
  readonly email = SITE_EMAIL;
  readonly emailHref = SITE_EMAIL_MAILTO;
  readonly address = SITE_ADDRESS;
  readonly map = SITE_MAP_LINK;
  readonly instagram = SITE_INSTAGRAM;
  readonly year = 2026;
}
