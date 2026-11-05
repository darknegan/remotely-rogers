import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { SITE_MAP_EMBED } from '../../core/content/site-nav';

@Component({
  selector: 'app-map-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iframe class="rr-map-frame" title="Remotely Rogers on the map" [src]="src" loading="lazy"></iframe>`,
})
export class MapEmbed {
  readonly src: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE_MAP_EMBED);
}
