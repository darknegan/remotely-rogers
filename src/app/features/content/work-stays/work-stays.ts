import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';

import {
  CABIN_SELECT_OPTIONS,
  HOST_EMAIL,
  HOST_PHONE,
  STAY_OPTIONS,
  WORK_AMENITIES,
  WORK_NEEDS,
  WORK_STAYS_HERO_IMAGE,
  WORKDAY_FLOW,
} from './work-stays.data';

@Component({
  selector: 'app-work-stays',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Textarea,
    InputNumber,
    DatePicker,
    Select,
    Button,
    Message,
  ],
  templateUrl: './work-stays.html',
  styleUrl: './work-stays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkStays {
  private readonly fb = inject(FormBuilder);
  private readonly title = inject(Title);

  protected readonly amenities = WORK_AMENITIES;
  protected readonly needs = WORK_NEEDS;
  protected readonly workdayFlow = WORKDAY_FLOW;
  protected readonly stayOptions = STAY_OPTIONS;
  protected readonly cabinOptions = CABIN_SELECT_OPTIONS;
  protected readonly heroImage = WORK_STAYS_HERO_IMAGE;
  protected readonly hostPhone = HOST_PHONE;
  protected readonly hostEmail = HOST_EMAIL;

  protected readonly submitSuccess = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    guests: [null as number | null],
    phone: [''],
    checkIn: [null as Date | null],
    checkOut: [null as Date | null],
    cabin: [''],
    comment: [''],
  });

  constructor() {
    this.title.setTitle('Remotely Rogers — Work Stays');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitSuccess.set(true);
    this.form.reset({
      email: '',
      firstName: '',
      lastName: '',
      guests: null,
      phone: '',
      checkIn: null,
      checkOut: null,
      cabin: '',
      comment: '',
    });
  }

  protected invalid(controlName: 'email'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }
}
