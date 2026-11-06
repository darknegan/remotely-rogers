import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { bookingmoodProductId } from '../../../../core/booking/bookingmood-products';
import { bookingmoodWidgetSrc } from '../../../../core/booking/bookingmood-widget';
import { toDateKey } from '../../../../core/utils/date-utils';
import { environment } from '../../../../../environments/environment';
import { BookingStateService } from '../../booking-state.service';
import { CartSummary } from '../../cart/cart-summary/cart-summary';

@Component({
  selector: 'app-checkout-page',
  imports: [CartSummary],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private readonly state = inject(BookingStateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap, {
    initialValue: inject(ActivatedRoute).snapshot.queryParamMap,
  });

  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );

  readonly widgetUrl = computed(() => {
    const params = this.query();
    const items = this.state.cartItems();
    const single = items.length === 1 ? items[0] : undefined;
    const productFromQuery = params.get('product_id');
    const useSelection = Boolean(productFromQuery) || items.length === 1;
    const productId = productFromQuery || (single ? bookingmoodProductId(single.cabin.id) : null);
    const start = useSelection ? params.get('start') || (single ? toDateKey(single.selection.arrival) : null) : null;
    const end = useSelection ? params.get('end') || (single ? toDateKey(single.selection.departure) : null) : null;
    const guests = Number(params.get('guests') || this.state.guestCount() || 1);

    return bookingmoodWidgetSrc(environment.bookingmoodWidgetUrl, {
      productId: useSelection ? productId : null,
      start,
      end,
      guests,
    });
  });

  readonly widgetSrc = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.widgetUrl()));
}
