import { RenderMode, ServerRoute } from '@angular/ssr';

/** Legacy `/preview/*` URLs — permanent redirects handled in `app.routes.ts`. */
const PREVIEW_REDIRECTS: ServerRoute[] = [
  { path: 'preview', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/foundations', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/activities', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/recommendations', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/work-stays', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/multi-cabin-stays', renderMode: RenderMode.Server, status: 301 },
  { path: 'preview/reviews', renderMode: RenderMode.Server, status: 301 },
];

export const serverRoutes: ServerRoute[] = [
  { path: 'activities', renderMode: RenderMode.Prerender },
  { path: 'recommendations', renderMode: RenderMode.Prerender },
  { path: 'work-stays', renderMode: RenderMode.Prerender },
  { path: 'multi-cabin', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  ...PREVIEW_REDIRECTS,
  { path: '**', renderMode: RenderMode.Server },
];
