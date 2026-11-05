import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import { WorkStays } from './work-stays';
import { CABIN_SELECT_OPTIONS, STAY_OPTIONS, WORK_NEEDS } from './work-stays.data';

describe('work-stays.data', () => {
  it('lists six work needs', () => {
    expect(WORK_NEEDS).toHaveLength(6);
  });

  it('includes three stay options', () => {
    expect(STAY_OPTIONS).toHaveLength(3);
  });

  it('includes all cabins plus no preference in the select', () => {
    expect(CABIN_SELECT_OPTIONS[0]?.label).toBe('No preference');
    expect(CABIN_SELECT_OPTIONS.length).toBe(7);
  });
});

describe('WorkStays inquiry form', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkStays],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('requires a valid email before submit', () => {
    const fixture = TestBed.createComponent(WorkStays);
    const component = fixture.componentInstance;

    component['submit']();

    expect(component['submitSuccess']()).toBe(false);
    expect(component['form'].controls.email.invalid).toBe(true);
  });

  it('shows success message after a valid submit', () => {
    const fixture = TestBed.createComponent(WorkStays);
    const component = fixture.componentInstance;

    component['form'].patchValue({
      email: 'guest@example.com',
      firstName: 'Alex',
      lastName: 'Rivera',
      guests: 4,
      phone: '479-555-0100',
      comment: 'Need two desks and reliable Wi-Fi.',
      cabin: 'Black Gum Getaway',
    });

    component['submit']();

    expect(component['submitSuccess']()).toBe(true);
    expect(component['form'].controls.email.value).toBe('');
  });
});
