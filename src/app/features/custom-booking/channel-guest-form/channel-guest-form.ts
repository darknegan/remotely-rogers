import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { PriceSummary } from '../price-summary/price-summary';
import { BookingProgress } from '../booking-progress/booking-progress';

@Component({
  selector: 'app-channel-guest-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PriceSummary, BookingProgress],
  templateUrl: './channel-guest-form.html',
  styleUrl: './channel-guest-form.scss',
})
export class ChannelGuestForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly state = inject(BookingChannelStateService);

  readonly form = this.fb.group({});

  ngOnInit(): void {
    this.state.loadChannel();
    for (const service of this.state.formServices()) {
      const validators =
        service.type === 'email'
          ? [Validators.required, Validators.email]
          : service.type === 'name'
            ? [Validators.required]
            : [];
      this.form.addControl(service.id, this.fb.nonNullable.control('', validators));
    }
  }

  submit(): void {
    if (this.state.reservationsOff()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue() as Record<string, string>;
    const byType: Record<string, string> = {};
    for (const service of this.state.formServices()) {
      byType[service.type] = raw[service.id] ?? '';
      byType[service.id] = raw[service.id] ?? '';
    }
    this.state.continueToReview(byType);
    void this.router.navigate(['/group-booking/checkout/review']);
  }
}