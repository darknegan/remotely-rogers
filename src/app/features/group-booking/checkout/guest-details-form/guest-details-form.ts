import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';

import { BookingStateService } from '../../booking-state.service';

@Component({
  selector: 'app-guest-details-form',
  imports: [ReactiveFormsModule, InputText, Textarea, Button, Message],
  templateUrl: './guest-details-form.html',
  styleUrl: './guest-details-form.scss',
})
export class GuestDetailsForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly state = inject(BookingStateService);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.submitCheckout(this.form.getRawValue());
  }

  backToCalendar(): void {
    void this.router.navigate(['/group-booking'], { queryParamsHandling: 'preserve' });
  }

  invalid(controlName: 'firstName' | 'lastName' | 'email'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }
}
