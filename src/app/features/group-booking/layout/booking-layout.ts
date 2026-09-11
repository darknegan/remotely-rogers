import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { BookingStateService } from '../booking-state.service';

@Component({
  selector: 'app-booking-layout',
  providers: [BookingStateService],
  imports: [RouterOutlet],
  templateUrl: './booking-layout.html',
  styleUrl: './booking-layout.scss',
})
export class BookingLayout implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private lastPostedHeight = 0;
  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.postHeight();
    new ResizeObserver(() => this.postHeight()).observe(this.host.nativeElement);
  }

  private postHeight(): void {
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const height = Math.ceil(this.host.nativeElement.getBoundingClientRect().height);
    if (Math.abs(height - this.lastPostedHeight) < 4) {
      return;
    }

    this.lastPostedHeight = height;
    window.parent.postMessage({ type: 'rr-group-booking-height', height }, '*');
  }
}
