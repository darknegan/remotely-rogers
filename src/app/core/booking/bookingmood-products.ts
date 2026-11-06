/** Public Bookingmood product ids for the six cabins. The worker allowlist stays in BOOKINGMOOD_PRODUCT_MAP. */
export const BOOKINGMOOD_PRODUCT_IDS: Record<number, string> = {
  1: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65',
  2: 'c7f5ee68-02db-49b5-ae79-85445daa73bf',
  3: '6fae95f0-7d51-4919-8a66-c097cb9e42bf',
  4: '1766c9dd-23da-4e30-95ba-c9ef9c8e89ca',
  5: '39fdf060-b2e7-47c1-9891-3fc6fcbf8804',
  6: '25557f1a-5582-4258-9eba-b08a7233e463',
};

export function bookingmoodProductId(cabinId: number): string | null {
  return BOOKINGMOOD_PRODUCT_IDS[cabinId] ?? null;
}
