import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';

import { CabinsMap } from '../../cabins/cabins-map/cabins-map';
import {
  CABIN_SELECT_OPTIONS,
  HOST_ADDRESS_LINE1,
  HOST_ADDRESS_LINE2,
  HOST_EMAIL,
  HOST_MAP_URL,
  HOST_NAME,
  HOST_PHONE,
  HOST_PHONE_HREF,
  TIME_WINDOW_OPTIONS,
} from './contact.data';

@Component({
  selector: 'app-contact',
  imports: [
    ReactiveFormsModule,
    InputText,
    Textarea,
    DatePicker,
    Select,
    Button,
    Message,
    CabinsMap,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly title = inject(Title);

  protected readonly hostName = HOST_NAME;
  protected readonly hostPhone = HOST_PHONE;
  protected readonly hostPhoneHref = HOST_PHONE_HREF;
  protected readonly hostEmail = HOST_EMAIL;
  protected readonly addressLine1 = HOST_ADDRESS_LINE1;
  protected readonly addressLine2 = HOST_ADDRESS_LINE2;
  protected readonly mapUrl = HOST_MAP_URL;
  protected readonly cabinOptions = CABIN_SELECT_OPTIONS;
  protected readonly timeWindowOptions = TIME_WINDOW_OPTIONS;

  protected readonly submitSuccess = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: [''],
    phone: [''],
    date: [null as Date | null],
    timeWindow: [''],
    rental: [''],
    notes: [''],
  });

  constructor() {
    this.title.setTitle('Remotely Rogers — Contact');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitSuccess.set(true);
    this.form.reset({
      email: '',
      name: '',
      phone: '',
      date: null,
      timeWindow: '',
      rental: '',
      notes: '',
    });
  }

  protected invalid(controlName: 'email'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }
}
