import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MobileHeader } from '../mobile-header/mobile-header';
import { MobileNav } from '../mobile-nav/mobile-nav';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-site-shell',
  imports: [RouterOutlet, SiteHeader, SiteFooter, MobileHeader, MobileNav],
  templateUrl: './site-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteShell {
  readonly menuOpen = signal(false);
}
