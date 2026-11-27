import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { useCustomGroupBookingShell } from './core/booking/booking-group-flow';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('keeps site chrome visible on /group-booking when using custom shell', () => {
    if (!useCustomGroupBookingShell()) {
      return;
    }
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['chromeVisible']('/group-booking')).toBe(true);
    expect(app['chromeVisible']('/group-booking/checkout')).toBe(true);
  });

  it('should render the Remotely Rogers wordmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Remotely Rogers');
  });
});
