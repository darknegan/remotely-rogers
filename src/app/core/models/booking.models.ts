export interface DateRange {
  arrival: Date;
  departure: Date;
}

export interface CabinSelection {
  cabinId: number;
  arrival: Date;
  departure: Date;
}

export interface CabinCartItem {
  cabin: CabinConfig;
  selection: CabinSelection;
  nights: number;
  totalPrice: number;
  currency: string;
}

export interface CabinConfig {
  id: number;
  /** Bookingmood product UUID — prefer BOOKINGMOOD_PRODUCT_MAP in Worker env for production. */
  bookingmoodProductId?: string | null;
  name: string;
  slug: string;
  maxGuests: number;
  imageUrl?: string;
}

export type DayStatus = 'available' | 'booked' | 'blocked' | 'closed' | 'pending' | 'unknown';

export type AvailabilityState = 'ok' | 'error' | 'unconfigured';

export interface DayRate {
  price: number;
  minStay: number;
}

export interface CabinAvailability {
  cabinId: number;
  nightlyRate: number;
  totalPrice: number;
  currency: string;
  available: boolean;
  days: Record<string, DayStatus>;
  dayRates: Record<string, DayRate>;
  cleaningFee: number;
  bookingUrl?: string;
  availabilityState?: AvailabilityState;
}

export interface BookingConfig {
  cabins: CabinConfig[];
  minNights: number;
  maxGuestsPerCabin: number;
}

export interface AvailabilityRequest {
  arrival: string;
  departure: string;
  adults: number;
}

export interface AvailabilityResponse {
  cabins: CabinAvailability[];
  bookingEnabled?: boolean;
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface GroupCheckoutCabin {
  cabinId: number;
  arrival: string;
  departure: string;
}

export interface GroupCheckoutRequest {
  guest: GuestDetails;
  adults: number;
  cabins: GroupCheckoutCabin[];
  embed?: boolean;
}

export interface BookingCheckoutResponse {
  url: string | null;
  paymentUrl?: string | null;
  reference: string;
  bookingId: string;
  indeterminate?: boolean;
}

export interface PublicBookingStatus {
  reference: string;
  paymentRecorded: boolean;
  bookingConfirmed: boolean;
  cancelled: boolean;
  updatedAt: string;
}

export interface BookingStatusResponse extends PublicBookingStatus {
  verified: boolean;
}

export interface CabinCheckoutResult {
  cabinId: number;
  ok: boolean;
  bookingId?: string;
  reference?: string;
  error?: string;
}

export interface GroupCheckoutResponse {
  reference: string;
  results: CabinCheckoutResult[];
}
