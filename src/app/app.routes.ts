import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'cabins',
    loadComponent: () => import('./features/cabins/cabin-listing').then((m) => m.CabinListing),
  },
  {
    path: 'cabins/:slug',
    loadComponent: () => import('./features/cabins/cabin-detail').then((m) => m.CabinDetail),
  },
  {
    path: 'activities',
    loadComponent: () => import('./features/content/activities/activities').then((m) => m.Activities),
  },
  {
    path: 'recommendations',
    loadComponent: () =>
      import('./features/content/recommendations/recommendations').then((m) => m.Recommendations),
  },
  {
    path: 'work-stays',
    loadComponent: () => import('./features/content/work-stays/work-stays').then((m) => m.WorkStays),
  },
  {
    path: 'multi-cabin',
    loadComponent: () =>
      import('./features/content/multi-cabin-stays/multi-cabin-stays').then((m) => m.MultiCabinStays),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'preview/foundations',
    loadComponent: () => import('./features/foundations/foundations').then((m) => m.Foundations),
  },
  { path: 'preview/activities', redirectTo: 'activities', pathMatch: 'full' },
  { path: 'preview/recommendations', redirectTo: 'recommendations', pathMatch: 'full' },
  { path: 'preview/work-stays', redirectTo: 'work-stays', pathMatch: 'full' },
  { path: 'preview/multi-cabin-stays', redirectTo: 'multi-cabin', pathMatch: 'full' },
  {
    path: 'preview/reviews',
    loadComponent: () => import('./features/content/reviews/reviews').then((m) => m.Reviews),
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
