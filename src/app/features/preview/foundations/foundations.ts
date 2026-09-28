import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BookingBar } from '../../../layout/booking-bar/booking-bar';

interface PaletteSwatch {
  name: string;
  hex: string;
  role: string;
}

interface TypeSample {
  label: string;
  className: string;
  text: string;
}

@Component({
  selector: 'app-foundations-preview',
  imports: [BookingBar],
  templateUrl: './foundations.html',
  styleUrl: './foundations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsPreview {
  readonly palette: PaletteSwatch[] = [
    { name: 'Limestone', hex: '#F5F0E6', role: 'Page ground' },
    { name: 'Limestone deep', hex: '#E9E2D6', role: 'Alternating bands, panels' },
    { name: 'Paper', hex: '#FBF8F1', role: 'Cards, fields, popovers' },
    { name: 'Walnut', hex: '#3E2C22', role: 'Display type, dark bands' },
    { name: 'Walnut ink', hex: '#4A382C', role: 'Body copy' },
    { name: 'Bark', hex: '#7A6552', role: 'Secondary text, meta' },
    { name: 'Walnut deep', hex: '#2B1F17', role: 'Footer, lightbox' },
    { name: 'Oxblood', hex: '#6C2029', role: 'Primary action, active nav' },
    { name: 'Oxblood hover', hex: '#882A34', role: 'Hover · pressed #561920' },
    { name: 'Brass', hex: '#B08A4A', role: 'Rules, stars, secondary action' },
    { name: 'Brass light', hex: '#E6D3AE', role: 'Labels on dark and photo' },
    { name: 'Rust', hex: '#9C2B1B', role: 'Errors and warnings only' },
  ];

  readonly typeSamples: TypeSample[] = [
    { label: 'Display 86/1.02', className: 'rr-type-display-86', text: 'Remotely' },
    { label: 'H1 56/1.08', className: 'rr-type-h1', text: 'Six private A-frames' },
    { label: 'H2 40/1.2', className: 'rr-type-h2', text: 'Comfortable cabins' },
    { label: 'H3 26/1.25', className: 'rr-type-h3', text: 'Black Gum Getaway' },
    { label: 'Quote 24 italic', className: 'rr-type-quote', text: '“It feels like a piece of home.”' },
    {
      label: 'Body 18/1.75',
      className: 'rr-type-body',
      text: 'Seventy acres of Ozark woodland, fifteen minutes from downtown Rogers.',
    },
    {
      label: 'UI 15 / 400',
      className: 'rr-type-ui',
      text: 'Vacation Home · 4 guests · Wifi',
    },
    { label: 'Label 11 caps', className: 'rr-type-label', text: 'From $132 per night' },
  ];
}
