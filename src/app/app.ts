import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SiteShell } from './layout/site-shell/site-shell';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteShell],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly showChrome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.chromeVisible(event.urlAfterRedirects)),
      startWith(this.chromeVisible(this.router.url)),
    ),
    { initialValue: this.chromeVisible(this.router.url) },
  );

  /** Marketing chrome stays off the full-screen group calendar and Lodgify embeds. */
  private chromeVisible(url: string): boolean {
    const tree = this.router.parseUrl(url);
    if (tree.queryParams['embed'] === '1') {
      return false;
    }
    const path = url.split('?')[0];
    return path !== '/group-booking' && !path.startsWith('/group-booking/');
  }
}
