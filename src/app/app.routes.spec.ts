import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { routes } from './app.routes';
import { SITE_LINKS } from './core/content/site-nav';

function runRedirect(path: string): UrlTree {
  const route = routes.find((entry) => entry.path === path);
  expect(route?.redirectTo).toBeDefined();
  const redirectTo = route!.redirectTo!;
  expect(typeof redirectTo).toBe('function');
  return TestBed.runInInjectionContext(() => (redirectTo as () => UrlTree)());
}

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('redirects multi-cabin to /cabins#group', () => {
    const url = runRedirect('multi-cabin');
    expect(url.toString()).toBe('/cabins#group');
  });

  it('redirects preview/multi-cabin-stays to /cabins#group', () => {
    const url = runRedirect('preview/multi-cabin-stays');
    expect(url.toString()).toBe('/cabins#group');
  });

  it('does not expose Multi-Cabin in primary nav links', () => {
    expect(SITE_LINKS.some((link) => link.path === '/multi-cabin')).toBe(false);
  });
});
