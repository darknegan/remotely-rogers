/** Example payloads aligned with https://www.bookingmood.com/en-US/docs/developers/webhooks */

export const WEBHOOK_PAYMENTS_PAID = {
  id: '00000000-0000-0000-0000-000000000001',
  date: 1_680_064_028,
  event_type: 'payments.paid',
  payload: {
    new: {
      id: '00000000-0000-0000-0000-000000000002',
      reference: 'REF-PAID-001',
      booking_id: '00000000-0000-0000-0000-000000000003',
    },
    old: {},
  },
} as const;

export const WEBHOOK_CALENDAR_CONFIRMED = {
  id: '00000000-0000-0000-0000-000000000004',
  date: 1_680_064_100,
  event_type: 'calendar_events.confirmed',
  payload: {
    new: {
      id: '00000000-0000-0000-0000-000000000005',
      reference: 'REF-CONF-001',
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
      reference: 'REF-CANCEL-001',
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
