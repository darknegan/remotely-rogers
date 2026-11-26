import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../../environments/environment';
import { channelCheckoutStepsGuard } from './channel-checkout-steps.guard';

describe('channelCheckoutStepsGuard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('redirects to the booking panel when checkout is off in this build', () => {
    expect(environment.bookingmoodChannelBookingEnabled).toBe(false);

    const result = TestBed.runInInjectionContext(() => channelCheckoutStepsGuard(null!, null!));

    if (result === true) {
      throw new Error('Expected redirect when booking gate is off');
    }

    const router = TestBed.inject(Router);
    const url = router.serializeUrl(result as ReturnType<Router['createUrlTree']>);
    expect(url).toBe('/group-booking/checkout');
  });
});