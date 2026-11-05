import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-header',
  imports: [RouterLink],
  templateUrl: './mobile-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeader {
  readonly menuOpen = input(false);
  readonly menuOpenChange = output<boolean>();
}
