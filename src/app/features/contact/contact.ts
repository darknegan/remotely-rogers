import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  SITE_ADDRESS,
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_PHONE,
  SITE_PHONE_TEL,
} from '../../core/content/site-nav';
import { MapEmbed } from '../../layout/map-embed/map-embed';
import { InquiryForm } from '../../shared/inquiry-form/inquiry-form';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MapEmbed, InquiryForm],
  templateUrl: './contact.html',
})
export class Contact {
  readonly phone = SITE_PHONE;
  readonly phoneHref = SITE_PHONE_TEL;
  readonly email = SITE_EMAIL;
  readonly emailHref = SITE_EMAIL_MAILTO;
  readonly address = SITE_ADDRESS;
}
