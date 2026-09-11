/** Vanilla two-card rotate + modal for the Home reviews gallery. */
export const REVIEWS_CAROUSEL_SCRIPT = `<script>
(function () {
  var INTERVAL = 15000;
  var SIZE = 2;

  function init(root) {
    var slides = root.querySelectorAll('[data-rr-review-slide]');
    var modal = root.querySelector('[data-rr-review-modal]');
    if (!slides.length) return;

    var index = 0;
    var hovered = false;
    var modalOpen = false;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;

    function shouldAdvance() {
      return slides.length > SIZE && !modalOpen && !reduceMotion && !document.hidden && !hovered;
    }

    function show(nextIndex) {
      index = nextIndex;
      for (var s = 0; s < slides.length; s++) {
        var inWindow = slides.length <= SIZE;
        if (!inWindow) {
          var offset = (s - index + slides.length) % slides.length;
          inWindow = offset < SIZE;
        }
        if (inWindow) slides[s].removeAttribute('hidden');
        else slides[s].setAttribute('hidden', '');
      }
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (!shouldAdvance()) return;
      timer = setInterval(function () {
        if (!shouldAdvance()) return;
        show((index + 1) % slides.length);
      }, INTERVAL);
    }

    function openModal() {
      if (!modal) return;
      modalOpen = true;
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      restart();
    }

    function closeModal() {
      if (!modal) return;
      modalOpen = false;
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
      restart();
    }

    root.addEventListener('pointerenter', function () {
      hovered = true;
      restart();
    });
    root.addEventListener('pointerleave', function () {
      hovered = false;
      restart();
    });
    document.addEventListener('visibilitychange', restart);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalOpen) closeModal();
    });

    var showAll = root.querySelector('[data-rr-review-show-all]');
    if (showAll) showAll.addEventListener('click', openModal);

    var prevBtn = root.querySelector('[data-rr-review-prev]');
    var nextBtn = root.querySelector('[data-rr-review-next]');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        show((index - 1 + slides.length) % slides.length);
        restart();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        show((index + 1) % slides.length);
        restart();
      });
    }

    var closers = root.querySelectorAll('[data-rr-review-modal-close]');
    for (var c = 0; c < closers.length; c++) {
      closers[c].addEventListener('click', closeModal);
    }

    var images = root.querySelectorAll('.rr-review-avatar img, .rr-review-portrait img');
    for (var i = 0; i < images.length; i++) {
      images[i].addEventListener('error', function () {
        this.style.display = 'none';
      });
    }

    show(0);
    restart();
  }

  var roots = document.querySelectorAll('.rr-review-band');
  for (var r = 0; r < roots.length; r++) init(roots[r]);
})();
</script>`;
