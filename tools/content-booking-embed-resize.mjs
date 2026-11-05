/** Auto-resize the booking iframe when the embedded calendar posts its height. */
export const BOOKING_EMBED_RESIZE_SCRIPT = `<script>
(function () {
  var iframe = document.querySelector('.rr-booking-embed');
  if (!iframe) return;
  var lastHeight = 0;
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'rr-group-booking-height' || typeof data.height !== 'number') return;
    var nextHeight = Math.max(640, Math.ceil(data.height + 16));
    if (Math.abs(nextHeight - lastHeight) < 4) return;
    lastHeight = nextHeight;
    iframe.style.height = nextHeight + 'px';
  });
})();
</script>`;
