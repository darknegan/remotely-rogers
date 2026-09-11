import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'preview/activities', renderMode: RenderMode.Prerender },
  { path: 'preview/recommendations', renderMode: RenderMode.Prerender },
  { path: 'preview/work-stays', renderMode: RenderMode.Prerender },
  { path: 'preview/multi-cabin-stays', renderMode: RenderMode.Prerender },
  { path: 'preview/reviews', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
