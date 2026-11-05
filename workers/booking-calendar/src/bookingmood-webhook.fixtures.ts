/** Example payloads aligned with Bookingmood OpenAPI row shapes + webhook envelope docs. */

export const BOOKING_ID_LIFE = '00000000-0000-0000-0000-000000000010';
export const BOOKING_ID_CONFIRM = '00000000-0000-0000-0000-000000000011';
export const BOOKING_ID_CANCEL = '00000000-0000-0000-0000-000000000012';

export const WEBHOOK_PAYMENTS_PAID = {
  id: '00000000-0000-0000-0000-000000000001',
  date: 1_680_064_028,
  event_type: 'payments.paid',
  payload: {
    new: {
      id: '00000000-0000-0000-0000-000000000002',
      reference: 'REF-PAID-001',
      booking_id: '00000000-0000-0000-0000-000000000003',
      amount: 100,
      currency: 'USD',
      status: 'paid',
    },
    old: {},
  },
} as const;

/** calendar_events rows expose booking_id (no reference column). */
export const WEBHOOK_CALENDAR_CONFIRMED = {
  id: '00000000-0000-0000-0000-000000000004',
  date: 1_680_064_100,
  event_type: 'calendar_events.confirmed',
  payload: {
    new: {
      id: '00000000-0000-0000-0000-000000000005',
      booking_id: BOOKING_ID_CONFIRM,
      start: '2026-06-01',
      end: '2026-06-08',
      status: 'confirmed',
    },
    old: {},
  },
} as const;

export const WEBHOOK_CALENDAR_CANCELLED = {
  id: '00000000-0000-0000-0000-000000000006',
  date: 1_680_064_200,
  event_type: 'calendar_events.cancelled',
  payload: {
    new: {
      id: '00000000-0000-0000-0000-000000000013',
      booking_id: BOOKING_ID_CANCEL,
      start: '2026-07-01',
      end: '2026-07-08',
      status: 'cancelled',
    },
    old: {},
  },
} as const;

export const WEBHOOK_TASKS_COMPLETED = {
  id: '00000000-0000-0000-0000-000000000007',
  date: 1_680_064_300,
  event_type: 'tasks.completed',
  payload: { new: {}, old: {} },
} as const;

export function lifecyclePaymentPaid(reference: string) {
  return {
    ...WEBHOOK_PAYMENTS_PAID,
    id: '00000000-0000-0000-0000-000000000020',
    payload: {
      new: {
        ...WEBHOOK_PAYMENTS_PAID.payload.new,
        reference,
        booking_id: BOOKING_ID_LIFE,
      },
      old: {},
    },
  };
}

export function lifecycleCalendarConfirmed(eventId: string) {
  return {
    ...WEBHOOK_CALENDAR_CONFIRMED,
    id: eventId,
    payload: {
      new: {
        ...WEBHOOK_CALENDAR_CONFIRMED.payload.new,
        booking_id: BOOKING_ID_LIFE,
      },
      old: {},
    },
  };
}

export function lifecycleCalendarCancelled(eventId: string) {
  return {
    ...WEBHOOK_CALENDAR_CANCELLED,
    id: eventId,
    payload: {
      new: {
        ...WEBHOOK_CALENDAR_CANCELLED.payload.new,
        booking_id: BOOKING_ID_LIFE,
      },
      old: {},
    },
  };
}
