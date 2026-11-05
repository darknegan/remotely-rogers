import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';

import { CABIN_LISTINGS } from '../../core/content/cabin-catalog';

@Component({
  selector: 'app-inquiry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, DatePicker, InputText, Message, Select, Textarea],
  templateUrl: './inquiry-form.html',
})
export class InquiryForm {
  readonly variant = input<'work' | 'contact'>('contact');
  readonly sent = signal(false);
  readonly cabins = CABIN_LISTINGS.map((cabin) => ({ label: cabin.name, value: cabin.slug }));
  readonly times = [
    '00:00 - 02:00',
    '02:00 - 04:00',
    '04:00 - 06:00',
    '06:00 - 08:00',
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00',
    '22:00 - 00:00',
  ].map((label) => ({ label, value: label }));

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    guests: [2],
    checkIn: [null as Date | null],
    checkOut: [null as Date | null],
    date: [null as Date | null],
    time: [''],
    rental: [''],
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
  }
}
