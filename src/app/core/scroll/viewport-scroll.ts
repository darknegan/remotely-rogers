/** Scroll the document to the top (browser only). */
export function scrollPageToTop(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}
