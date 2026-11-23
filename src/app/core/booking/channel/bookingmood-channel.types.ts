export interface LocalizedString {
  default: string;
}

export interface BookingmoodChannelModifiers {
  show_booked_as?: string;
  show_closed_as?: string;
  show_past?: boolean;
  show_pending_as?: string;
}

export interface BookingmoodChannelMeta {
  id: string;
  bookable?: boolean;
  modifiers?: BookingmoodChannelModifiers;
}

export interface BookingmoodCapacityGroup {
  id: string;
  name?: LocalizedString;
  name_singular?: LocalizedString;
  type?: string;
}

export interface BookingmoodFormService {
  id: string;
  type: string;
  label?: LocalizedString;
  order?: number;
}

export interface BookingmoodChannelProduct {
  id: string;
  name: LocalizedString | string;
  currency?: string;
  capacity?: Record<string, { min?: number; max?: number }>;
  services?: BookingmoodFormService[];
}

export interface BookingmoodChannelEvent {
  start_date: string;
  end_date: string;
  status: string;
  type: string;
  padding?: number;
}

export interface BookingmoodPriceCalendarRate {
  rate: number;
  duration?: number;
  occupancy?: number;
}

export interface BookingmoodPriceCalendarEntry {
  product_id: string;
  min_duration?: number;
  max_duration?: number;
  rates?: BookingmoodPriceCalendarRate[];
  check_in_days?: boolean[];
  checkout_days?: boolean[];
}

export interface BookingmoodProductAvailability {
  product_id: string;
  events?: BookingmoodChannelEvent[];
  price_calendar_entries?: BookingmoodPriceCalendarEntry[];
  fee?: {
    price?: {
      value?: Array<{ value: number }>;
    };
  };
}

export interface BookingmoodChannelPayload {
  channel: BookingmoodChannelMeta;
  organization: {
    id?: string;
    capacity_groups?: BookingmoodCapacityGroup[];
  };
  products: BookingmoodChannelProduct[];
  availability?: BookingmoodProductAvailability[];
}

export type BookingmoodCartFormValue =
  | string
  | {
      street: string;
      city: string;
      zip: string;
      country: string;
    };

export interface BookingmoodCartItemRequest {
  id: string;
  product_id: string;
  interval: { start: string; end: string };
  occupancy: Record<string, number>;
  form_values: Record<string, BookingmoodCartFormValue>;
}

export interface BookingmoodCartValidateItem {
  id: string;
  valid: boolean;
  availabilityMatch: boolean;
  occupancyMatch: boolean;
  message?: string;
  price?: {
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    deposit: number;
    lines?: Array<{ label?: string; amount: number; type?: string }>;
  };
}

export interface BookingmoodCheckoutResult {
  booking_id: string;
  secret?: string;
  payment_url?: string | null;
}

export interface BookingmoodBookingRecord {
  id: string;
  status?: string;
  payment_url?: string | null;
  reference?: string;
}

export type CalendarDayKind =
  | 'available'
  | 'reserved'
  | 'closed'
  | 'past'
  | 'selected-endpoint'
  | 'in-stay';

export interface BookingmoodChannelErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
  hint?: unknown;
}