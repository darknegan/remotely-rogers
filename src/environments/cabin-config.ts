import { BookingConfig } from '../app/core/models/booking.models';

/** Public cabin metadata — map Bookingmood product UUIDs via Worker `BOOKINGMOOD_PRODUCT_MAP`. */
export const CABIN_CONFIG: BookingConfig = {
  minNights: 2,
  maxGuestsPerCabin: 4,
  cabins: [
    {
      id: 1,
      bookingmoodProductId: null,
      name: 'Black Gum Getaway-Cozy Forest A-frame Near Bentonville',
      slug: 'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400',
    },
    {
      id: 2,
      bookingmoodProductId: null,
      name: 'Dogwood Den- Cozy Forest A-Frame Near Bentonville',
      slug: 'dogwood-den--cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/c17b2188-7f3c-4257-8771-5503b16d1858.png?w=400',
    },
    {
      id: 3,
      bookingmoodProductId: null,
      name: 'Running Spring Retreat-Cozy Forest A-Frame near Bentonville',
      slug: 'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/91876b46-cb42-4ba4-87c8-dc2c7b190553.jpg?w=400',
    },
    {
      id: 4,
      bookingmoodProductId: null,
      name: 'Black Walnut Bungalow-Cozy Forest A-frame near Bentonville',
      slug: 'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/8c3d5c24-1ddd-472a-af57-f1717b0814e1.png?w=400',
    },
    {
      id: 5,
      bookingmoodProductId: null,
      name: 'White Oak Haven-Cozy Forest A-frame near Bentonville',
      slug: 'white-oak-haven-cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/78268e9b-81a9-42cf-92a2-dbe143cc2cfe.png?w=400',
    },
    {
      id: 6,
      bookingmoodProductId: null,
      name: 'Post Oak Perch-Cozy Forest A-frame Near Bentonville',
      slug: 'post-oak-perch-cozy-forest-a-frame-near-bentonville',
      maxGuests: 4,
      imageUrl:
        'https://l.icdbcdn.com/oh/9667e84e-457b-4086-9999-c736837136d1.jpg?w=400',
    },
  ],
};
