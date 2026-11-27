import { environment } from '../../../environments/environment';

/** Standalone /group-booking uses the custom channel UI on the test Worker build only. */
export function useCustomGroupBookingShell(): boolean {
  return environment.useCustomBookingComponents === true;
}

/** Legacy cart UX: keep Continue enabled while availability is unknown/loading (#35). */
export function groupCartBlocksContinueWhileLoading(): boolean {
  return useCustomGroupBookingShell();
}