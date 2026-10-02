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
      {
        path: 'multi-cabin',
        loadComponent: () =>
          import('./features/content/multi-cabin-stays/multi-cabin-stays').then(
            (m) => m.MultiCabinStays,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/content/contact/contact').then((m) => m.Contact),
      },
    ],
  },
  {
    path: 'preview',
    children: [
      { path: '', redirectTo: '/', pathMatch: 'full' },
      { path: 'foundations', redirectTo: '/', pathMatch: 'full' },
      { path: 'activities', redirectTo: '/activities', pathMatch: 'full' },
      { path: 'recommendations', redirectTo: '/recommendations', pathMatch: 'full' },
      { path: 'work-stays', redirectTo: '/work-stays', pathMatch: 'full' },
      { path: 'multi-cabin-stays', redirectTo: '/multi-cabin', pathMatch: 'full' },
      { path: 'reviews', redirectTo: '/', pathMatch: 'full' },
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
