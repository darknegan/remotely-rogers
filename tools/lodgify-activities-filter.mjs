/** Inline script for Lodgify Activities category filter (vanilla JS). */
export const ACTIVITIES_FILTER_SCRIPT = `<script>
(function () {
  var root = document.currentScript && document.currentScript.previousElementSibling;
  if (!root || !root.classList.contains('rr-lodgify-root')) {
    root = document.querySelector('.rr-lodgify-root');
  }
  if (!root) return;

  function matches(categories, filter) {
    if (filter === 'All') return true;
    return categories.split(',').some(function (part) {
      return part.trim() === filter;
    });
  }

  function isHidden(el) {
    return el.style.display === 'none';
  }

  function applyFilter(filter) {
    root.querySelectorAll('[data-rr-filter]').forEach(function (btn) {
      btn.classList.toggle('rr-chip--active', btn.getAttribute('data-rr-filter') === filter);
    });

    var visible = 0;
    root.querySelectorAll('[data-rr-categories]').forEach(function (el) {
      var show = matches(el.getAttribute('data-rr-categories') || '', filter);
      el.style.display = show ? '' : 'none';
      if (
        show &&
        (el.classList.contains('rr-card-link') ||
          el.tagName === 'SECTION' ||
          el.classList.contains('rr-content-section__head'))
      ) {
        visible++;
      }
    });

    var empty = root.querySelector('[data-rr-filter-empty]');
    if (empty) empty.classList.toggle('is-visible', visible === 0);

    var grid = root.querySelector('[data-rr-featured-grid]');
    if (grid) {
      var links = Array.prototype.slice.call(grid.querySelectorAll('.rr-card-link'));
      var visibleLinks = links.filter(function (link) {
        return !isHidden(link);
      });
      var largeVisible = visibleLinks.some(function (link) {
        return link.classList.contains('rr-card-link--featured-large');
      });
      grid.classList.toggle(
        'rr-card-grid--featured',
        largeVisible && visibleLinks.length > 1,
      );
    }
  }

  root.querySelectorAll('[data-rr-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.getAttribute('data-rr-filter') || 'All');
    });
  });
})();
</script>`;
