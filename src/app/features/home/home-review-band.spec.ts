import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { RemotelyRogersPreset } from '../../core/theme/remotely-rogers-preset';
import { CABIN_SLUGS } from '../../core/utils/reviews';
import { HomeReviewBand } from './home-review-band';

describe('HomeReviewBand', () => {
  let fixture: ComponentFixture<HomeReviewBand>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeReviewBand],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: RemotelyRogersPreset } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeReviewBand);
    fixture.componentRef.setInput('slug', CABIN_SLUGS.blackGum);
    fixture.componentRef.setInput('name', 'Black Gum Getaway');
    fixture.componentRef.setInput('imageUrl', 'https://example.com/cabin.jpg');
    fixture.detectChanges();
  });

  it('starts at the first review', () => {
    const component = fixture.componentInstance;
    expect(component.activeIndex()).toBe(0);
    expect(component.activeReview()?.guestName).toBeTruthy();
  });

  it('advances and wraps the carousel index', () => {
    const component = fixture.componentInstance;
    const count = component.reviewCount();
    const nextButton = fixture.nativeElement.querySelector(
      '.rr-home-review-band__arrow[aria-label="Next review"]',
    ) as HTMLButtonElement;

    for (let step = 0; step < count; step++) {
      nextButton.click();
      fixture.detectChanges();
    }

    expect(component.activeIndex()).toBe(0);
  });

  it('opens and closes the reviews dialog', () => {
    const component = fixture.componentInstance;
    const openButton = fixture.nativeElement.querySelector(
      '.rr-home-review-band__all',
    ) as HTMLButtonElement;
    openButton.click();
    fixture.detectChanges();
    expect(component.modalVisible()).toBe(true);

    const closeButton = fixture.nativeElement.querySelector(
      '.rr-home-reviews-dialog__close',
    ) as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();
    expect(component.modalVisible()).toBe(false);
  });
});
