import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

type RouteConfig = {
  path?: string;
  redirectTo?: string | ((...args: unknown[]) => string);
  pathMatch?: string;
  children?: RouteConfig[];
};

function findPreviewRedirects(routeList: RouteConfig[]): RouteConfig[] {
  const preview = routeList.find((route) => route.path === 'preview');
  return preview?.children ?? [];
}

describe('app.routes preview cutover', () => {
  const previewRedirects = findPreviewRedirects(routes as RouteConfig[]);

  it('redirects legacy preview URLs to public paths', () => {
    const expected: Record<string, string> = {
      '': '/',
      foundations: '/',
      activities: '/activities',
      recommendations: '/recommendations',
      'work-stays': '/work-stays',
      'multi-cabin-stays': '/multi-cabin',
      reviews: '/',
    };

    for (const [path, redirectTo] of Object.entries(expected)) {
      const route = previewRedirects.find((entry) => entry.path === path);
      expect(route, `missing /preview/${path || '(root)'} redirect`).toBeDefined();
      expect(route?.redirectTo).toBe(redirectTo);
      expect(route?.pathMatch).toBe('full');
    }
  });

  it('does not mount preview feature components', () => {
    for (const route of previewRedirects) {
      expect(route).not.toHaveProperty('loadComponent');
      expect(route).not.toHaveProperty('component');
    }
  });
});
