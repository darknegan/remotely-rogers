import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cabins-map',
  templateUrl: './cabins-map.html',
  styleUrl: './cabins-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinsMap {
  readonly showCard = input(true);
  readonly showPins = input(true);
  readonly compact = input(false);

  readonly directionsUrl =
    'https://maps.google.com/?q=11611+Lindy+Lane+Rogers+AR+72756';

  readonly pins = [
    { n: 1, left: '22%', top: '30%' },
    { n: 2, left: '72%', top: '20%' },
    { n: 3, left: '80%', top: '64%' },
    { n: 4, left: '34%', top: '68%' },
    { n: 5, left: '48%', top: '84%' },
    { n: 6, left: '14%', top: '52%' },
  ];
}
