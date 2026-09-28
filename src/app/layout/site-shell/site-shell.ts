import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-site-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteHeader, SiteFooter],
  templateUrl: './site-shell.html',
})
export class SiteShell {
  readonly showChrome = input(true);
}
