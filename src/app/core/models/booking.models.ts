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
  name: string;
  slug: string;
  maxGuests: number;
  imageUrl?: string;
}

export type DayStatus = 'available' | 'booked' | 'blocked';

export interface CabinAvailability {
  cabinId: number;
  nightlyRate: number;
  totalPrice: number;
  currency: string;
  available: boolean;
  days: Record<string, DayStatus>;
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
