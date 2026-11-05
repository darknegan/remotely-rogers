import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { InquiryForm } from './inquiry-form';

describe('InquiryForm', () => {
  it('stays unsent until email and name are present', () => {
    TestBed.configureTestingModule({ imports: [InquiryForm] });
    const fixture = TestBed.createComponent(InquiryForm);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.sent()).toBe(false);

    fixture.componentInstance.form.setValue({
      email: 'guest@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      guests: 2,
      checkIn: null,
      checkOut: null,
      date: null,
      time: '',
      rental: '',
      notes: 'Hello',
    });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.sent()).toBe(true);
  });
});