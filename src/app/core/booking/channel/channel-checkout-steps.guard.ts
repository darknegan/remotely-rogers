import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { environment } from '../../../../environments/environment';

/** Guest and review steps are only reachable when custom booking is on and checkout is enabled for this build. */
export const channelCheckoutStepsGuard: CanActivateFn = () => {
  if (
    environment.useCustomBookingComponents === true &&
    environment.bookingmoodChannelBookingEnabled === true
  ) {
    return true;
  }

  return inject(Router).createUrlTree(['/group-booking', 'checkout']);
};