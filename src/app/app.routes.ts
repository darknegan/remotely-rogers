import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'preview/activities', pathMatch: 'full' },
  {
    path: 'preview/activities',
    loadComponent: () =>
      import('./features/content/activities/activities').then((m) => m.Activities),
  },
  {
    path: 'preview/recommendations',
    loadComponent: () =>
      import('./features/content/recommendations/recommendations').then((m) => m.Recommendations),
  },
  {
    path: 'preview/work-stays',
    loadComponent: () =>
      import('./features/content/work-stays/work-stays').then((m) => m.WorkStays),
  },
  {
    path: 'preview/multi-cabin-stays',
    loadComponent: () =>
      import('./features/content/multi-cabin-stays/multi-cabin-stays').then(
        (m) => m.MultiCabinStays,
      ),
  },
  {
    path: 'group-booking',
    loadComponent: () =>
      import('./features/group-booking/shell/shell').then((m) => m.GroupBookingShell),
  },
];
