import { environment } from '../../../environments/environment';

/** Preview safety: custom channel UI is browsable but checkout is disabled in this build. */
export function customBookingReservationsOff(): boolean {
  return (
    environment.useCustomBookingComponents === true &&
    environment.bookingmoodChannelBookingEnabled !== true
  );
}