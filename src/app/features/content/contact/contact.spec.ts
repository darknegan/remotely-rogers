import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { Contact } from './contact';
import { CABIN_SELECT_OPTIONS, TIME_WINDOW_OPTIONS } from './contact.data';

describe('contact.data', () => {
  it('lists four time window options', () => {
    expect(TIME_WINDOW_OPTIONS).toHaveLength(4);
  });

  it('includes all cabins plus no preference in the select', () => {
    expect(CABIN_SELECT_OPTIONS[0]?.label).toBe('No preference');
    expect(CABIN_SELECT_OPTIONS.length).toBe(7);
  });
});

describe('Contact inquiry form', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('requires a valid email before submit', () => {
    const fixture = TestBed.createComponent(Contact);
    const component = fixture.componentInstance;

    component['submit']();

    expect(component['submitSuccess']()).toBe(false);
    expect(component['form'].controls.email.invalid).toBe(true);
  });

  it('shows success message after a valid submit', () => {
    const fixture = TestBed.createComponent(Contact);
    const component = fixture.componentInstance;

    component['form'].patchValue({
      email: 'guest@example.com',
      name: 'Alex Rivera',
      phone: '479-555-0100',
      timeWindow: 'morning',
      rental: 'Black Gum Getaway',
      notes: 'Looking for a weekend in October.',
    });

    component['submit']();

    expect(component['submitSuccess']()).toBe(true);
    expect(component['form'].controls.email.value).toBe('');
  });
});
