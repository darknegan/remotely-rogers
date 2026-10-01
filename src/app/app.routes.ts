import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/site-shell/site-shell').then((m) => m.SiteShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'cabins',
        loadComponent: () => import('./features/cabins/cabins').then((m) => m.Cabins),
      },
      {
        path: 'cabins/:slug',
        loadComponent: () =>
          import('./features/cabin-detail/cabin-detail').then((m) => m.CabinDetail),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./features/content/activities/activities').then((m) => m.Activities),
      },
      {
        path: 'recommendations',
        loadComponent: () =>
          import('./features/content/recommendations/recommendations').then(
            (m) => m.Recommendations,
          ),
      },
      {
        path: 'work-stays',
        loadComponent: () =>
          import('./features/content/work-stays/work-stays').then((m) => m.WorkStays),
      },
    ],
  },
  {
    path: 'preview',
    loadComponent: () => import('./layout/site-shell/site-shell').then((m) => m.SiteShell),
    children: [
      {
        path: 'foundations',
        loadComponent: () =>
          import('./features/preview/foundations/foundations').then((m) => m.FoundationsPreview),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./features/content/activities/activities').then((m) => m.Activities),
      },
      {
        path: 'recommendations',
        loadComponent: () =>
          import('./features/content/recommendations/recommendations').then(
            (m) => m.Recommendations,
          ),
      },
      {
        path: 'work-stays',
        loadComponent: () =>
          import('./features/content/work-stays/work-stays').then((m) => m.WorkStays),
      },
      {
        path: 'multi-cabin-stays',
        loadComponent: () =>
          import('./features/content/multi-cabin-stays/multi-cabin-stays').then(
            (m) => m.MultiCabinStays,
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/content/reviews/reviews').then((m) => m.Reviews),
      },
    ],
  },
  {
    path: 'group-booking',
    loadComponent: () =>
      import('./features/group-booking/layout/booking-layout').then((m) => m.BookingLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/group-booking/shell/shell').then((m) => m.GroupBookingShell),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/group-booking/checkout/checkout-page/checkout-page').then(
            (m) => m.CheckoutPage,
          ),
      },
      {
        path: 'checkout/success',
        loadComponent: () =>
          import('./features/group-booking/checkout/checkout-success/checkout-success').then(
            (m) => m.CheckoutSuccessPage,
          ),
      },
    ],
  },
];
