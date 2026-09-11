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
  lodgifyPropertyId: number;
  lodgifyRoomTypeId: number;
  name: string;
  slug: string;
  maxGuests: number;
  imageUrl?: string;
}

export type DayStatus = 'available' | 'booked' | 'blocked';

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

export interface StripeCheckoutResponse {
  url: string;
}

export interface CheckoutSessionResponse {
  paid: boolean;
  fulfilled: boolean;
  groupId?: string;
  results?: CabinCheckoutResult[];
}

export interface CabinCheckoutResult {
  cabinId: number;
  ok: boolean;
  bookingId?: number;
  error?: string;
}

export interface GroupCheckoutResponse {
  groupId: string;
  results: CabinCheckoutResult[];
}
