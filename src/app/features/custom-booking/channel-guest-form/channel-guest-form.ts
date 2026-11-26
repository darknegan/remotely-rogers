import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { BookingmoodServiceFormValue } from '../../../core/booking/channel/booking-channel-form-values';
import { syncChannelFromGroupBooking } from '../../../core/booking/group-booking-channel-sync';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { formatGuestCount } from '../../../core/utils/guest-label';
import { BookingmoodFormService } from '../../../core/booking/channel/bookingmood-channel.types';
import { PriceSummary } from '../price-summary/price-summary';
import { BookingProgress } from '../booking-progress/booking-progress';

@Component({
  selector: 'app-channel-guest-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PriceSummary, BookingProgress],
  templateUrl: './channel-guest-form.html',
  styleUrl: './channel-guest-form.scss',
})
export class ChannelGuestForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly group = inject(BookingStateService);
  protected readonly state = inject(BookingChannelStateService);

  readonly form = this.fb.group({});

  constructor() {
    syncChannelFromGroupBooking(this.state, this.group);
    this.state.loadChannel();
    effect(() => {
      const services = this.state.formServices();
      if (services.length === 0) {
        return;
      }
      for (const service of services) {
        if (this.form.contains(service.id)) {
          continue;
        }
        this.form.addControl(service.id, this.controlForService(service));
      }
    });
  }

  submit(): void {
    if (this.state.reservationsOff()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const byServiceId: Record<string, BookingmoodServiceFormValue> = {};
    for (const service of this.state.formServices()) {
      const control = this.form.get(service.id);
      if (!control) {
        continue;
      }
      if (service.type === 'address' && control instanceof FormGroup) {
        const raw = control.getRawValue() as {
          street: string;
          city: string;
          zip: string;
          country: string;
        };
        byServiceId[service.id] = raw;
      } else {
        byServiceId[service.id] = String(control.value ?? '');
      }
    }

    this.state.continueToReview(byServiceId);
    void this.router.navigate(['/group-booking/checkout/review']);
  }

  phoneService(): BookingmoodFormService | undefined {
    return this.state.formServices().find((service) => service.type === 'phone');
  }

  tripGuests(): string {
    return formatGuestCount(this.state.totalSelectedGuests());
  }

  private controlForService(service: BookingmoodFormService) {
    if (service.type === 'address') {
      return this.fb.nonNullable.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        zip: ['', Validators.required],
        country: ['', Validators.required],
      });
    }

    const validators =
      service.type === 'email'
        ? [Validators.required, Validators.email]
        : service.type === 'name' || service.type === 'phone'
          ? [Validators.required]
          : [];
    return this.fb.nonNullable.control('', validators);
  }
}