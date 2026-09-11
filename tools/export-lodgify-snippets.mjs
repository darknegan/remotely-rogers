/**
 * Builds production Angular output (with SSR prerender) and packages Lodgify-safe
 * HTML snippets: plain div markup + compact inlined CSS (no PrimeNG custom elements).
 *
 * Run: npm run export:lodgify-snippets
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { flattenForLodgify } from './lodgify-flatten.mjs';
import { ACTIVITIES_FILTER_SCRIPT } from './lodgify-activities-filter.mjs';
import { BOOKING_EMBED_RESIZE_SCRIPT } from './lodgify-booking-embed-resize.mjs';
import { REVIEWS_CAROUSEL_SCRIPT } from './lodgify-reviews-carousel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const browserDir = path.join(root, 'dist', 'remotely-rogers', 'browser');
const outDir = path.join(root, 'dist', 'lodgify-snippets');
const lodgifyScss = path.join(root, 'src', 'styles', 'lodgify-export.scss');

const PASTE_BANNER =
  '<!-- REMOTELY ROGERS LODGIFY EXPORT — paste this ENTIRE file into Lodgify Raw HTML widget. ' +
  'Plain HTML + inline CSS only (no Angular, no PrimeNG custom tags). -->';

/** @type {{ route: string; file: string; host: string }[]} */
const PAGES = [
  { route: 'preview/activities', file: 'activities.html', host: 'app-activities' },
  { route: 'preview/recommendations', file: 'recommendations.html', host: 'app-recommendations' },
  { route: 'preview/work-stays', file: 'work-stays.html', host: 'app-work-stays' },
  { route: 'preview/multi-cabin-stays', file: 'multi-cabin-stays.html', host: 'app-multi-cabin-stays' },
  { route: 'preview/reviews', file: 'reviews-home.html', host: 'app-reviews' },
];

const REVIEW_SLUGS = [
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
  'dogwood-den--cozy-forest-a-frame-near-bentonville',
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville',
  'white-oak-haven-cozy-forest-a-frame-near-bentonville',
  'post-oak-perch-cozy-forest-a-frame-near-bentonville',
];

function log(message) {
  console.log(`[export] ${message}`);
}

function runBuild() {
  log('Building Angular app with SSR prerender...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

function compileLodgifyCss() {
  return execSync(`npx sass "${lodgifyScss}" --style=compressed --no-source-map`, {
    cwd: root,
    encoding: 'utf8',
  }).trim();
}

function readPrerenderedPage(route) {
  const candidates = [
    path.join(browserDir, route, 'index.html'),
    path.join(browserDir, `${route}.html`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }

  throw new Error(
    `Prerendered HTML not found for /${route}. Expected one of:\n${candidates.join('\n')}`,
  );
}

function extractHostHtml(fullHtml, hostTag) {
  const dom = new JSDOM(fullHtml);
  const host = dom.window.document.querySelector(hostTag);
  if (!host) {
    throw new Error(`Could not find <${hostTag}> in prerendered page`);
  }
  if (!host.querySelector('.rr-page')) {
    throw new Error(`<${hostTag}> missing .rr-page — prerender may have failed`);
  }
  return host.innerHTML;
}

function assertHomeReviewsSnippet(html) {
  for (const slug of REVIEW_SLUGS) {
    if (!html.includes(`data-cabin-slug="${slug}"`)) {
      throw new Error(`reviews-home.html missing cabin ${slug}`);
    }
  }
  if (!html.includes('rr-review-band--image-right')) {
    throw new Error('reviews-home.html missing alternating image-right bands');
  }
  if ((html.match(/class="rr-review-band/g) || []).length < 6) {
    throw new Error('reviews-home.html does not include six review bands');
  }
}

function rewritePreviewLinks(html) {
  return html.replace(/href="\/preview\/([^"]+)"/g, 'href="https://remotelyrogers.com/en/$1/"');
}

function inlineReviewAvatars(html) {
  return html.replace(/src="(\/reviews\/avatars\/[^"]+)"/g, (_, src) => {
    const filePath = path.join(root, 'public', src.replace(/^\//, '').replace(/\//g, path.sep));
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing review avatar: ${filePath}`);
    }
    return `src="data:image/jpeg;base64,${fs.readFileSync(filePath).toString('base64')}"`;
  });
}

function assertCompiledHtml(html, label) {
  const patterns = [
    { re: /@if\s/, name: '@if' },
    { re: /@for\s/, name: '@for' },
    { re: /<p-card[\s>]/, name: 'p-card' },
    { re: /<p-panel[\s>]/, name: 'p-panel' },
    { re: /<p-tag[\s>]/, name: 'p-tag' },
    { re: /<p-selectbutton[\s>]/, name: 'p-selectbutton' },
    { re: /\{\{/, name: '{{' },
    { re: /<script[\s>]/, name: 'script (only allowed in activities, multi-cabin, reviews exports)' },
  ];
  const found = patterns.filter(({ re }) => re.test(html)).map(({ name }) => name);
  const scriptOnly =
    found.length === 1 && found[0].includes('script') && /script/i.test(found[0]);
  const allowsScript =
    (label === 'activities.html' ||
      label === 'multi-cabin-stays.html' ||
      label === 'reviews-home.html') &&
    scriptOnly;
  if (found.length > 0 && !allowsScript) {
    throw new Error(
      `${label} still contains non-Lodgify markup (${found.join(', ')}). Flatten step failed.`,
    );
  }
}

function wrapSnippet(
  bodyHtml,
  css,
  {
    withActivitiesFilter = false,
    withBookingEmbedResize = false,
    withReviewsCarousel = false,
    homeContained = false,
  } = {},
) {
  let script = '';
  if (withActivitiesFilter) script += ACTIVITIES_FILTER_SCRIPT;
  if (withBookingEmbedResize) script += BOOKING_EMBED_RESIZE_SCRIPT;
  if (withReviewsCarousel) script += REVIEWS_CAROUSEL_SCRIPT;
  const rootClass = homeContained ? 'rr-lodgify-root rr-lodgify-root--home' : 'rr-lodgify-root';
  return (
    `${PASTE_BANNER}` +
    `<style>${css}</style>` +
    `<div class="${rootClass}">${bodyHtml}</div>` +
    script
  );
}

function exportSnippets() {
  runBuild();

  if (!fs.existsSync(browserDir)) {
    throw new Error(`Build output missing: ${browserDir}`);
  }

  const lodgifyCss = compileLodgifyCss();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lodgify-styles.css'), lodgifyCss, 'utf8');
  log(`Wrote lodgify-styles.css (${(lodgifyCss.length / 1024).toFixed(1)} KB)`);

  for (const entry of PAGES) {
    log(`Packaging /${entry.route}...`);
    const fullHtml = readPrerenderedPage(entry.route);
    const rawBody = extractHostHtml(fullHtml, entry.host);
    const flatBody = inlineReviewAvatars(rewritePreviewLinks(flattenForLodgify(rawBody)));
    const html = wrapSnippet(flatBody, lodgifyCss, {
      withActivitiesFilter: entry.file === 'activities.html',
      withBookingEmbedResize: entry.file === 'multi-cabin-stays.html',
      withReviewsCarousel: entry.file === 'reviews-home.html',
      homeContained: entry.file === 'reviews-home.html',
    });

    assertCompiledHtml(html, entry.file);
    if (entry.file === 'reviews-home.html') {
      assertHomeReviewsSnippet(html);
      if (html.includes('/reviews/avatars/')) {
        throw new Error('reviews-home.html still has /reviews/avatars/ URLs');
      }
    }

    const outPath = path.join(outDir, entry.file);
    fs.writeFileSync(outPath, html, 'utf8');
    log(`Wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB)`);
  }

  const staleReviewFiles = [
    'cabin-reviews.html',
    'reviews-black-gum.html',
    'reviews-dogwood.html',
    'reviews-running-spring.html',
    'reviews-black-walnut.html',
    'reviews-white-oak.html',
    'reviews-post-oak.html',
  ];
  for (const name of staleReviewFiles) {
    const stalePath = path.join(outDir, name);
    if (fs.existsSync(stalePath)) {
      fs.unlinkSync(stalePath);
      log(`Removed stale ${name}`);
    }
  }

  fs.writeFileSync(
    path.join(outDir, 'PASTE-INSTRUCTIONS.txt'),
    [
      'Remotely Rogers — Lodgify paste instructions',
      '',
      'Paste ONE of these files into Lodgify → Pages → Raw HTML widget:',
      '  dist/lodgify-snippets/activities.html',
      '  dist/lodgify-snippets/recommendations.html',
      '  dist/lodgify-snippets/work-stays.html',
      '  dist/lodgify-snippets/multi-cabin-stays.html',
      '',
      'Guest reviews — paste onto the Home page Raw HTML widget:',
      '  dist/lodgify-snippets/reviews-home.html',
      '',
      'Each file is plain HTML + a single <style> block (~11 KB).',
      'Guest reviews on Home sit in the same content column as other Home widgets (no extra right gap).',
      'No external fonts or CSS files required — uses your Lodgify site font.',
      '',
      'DO NOT paste from src/app/features/content/ (Angular templates).',
      '',
      'Steps (repeat for EACH page you update):',
      '  1. npm run export:lodgify-snippets',
      '  2. Open the matching .html file in dist/lodgify-snippets/',
      '  3. Ctrl+A, copy ALL, paste into that page’s Raw HTML widget in Lodgify',
      '  4. Save → Publish website → check LIVE URL (not builder preview)',
      '',
      'Page → snippet file:',
      '  Activities        → activities.html',
      '  Recommendations   → recommendations.html',
      '  Work Stays        → work-stays.html',
      '  Multi-Cabin Stays → multi-cabin-stays.html',
      '  Home              → reviews-home.html',
      '',
      'Multi-Cabin Stays calendar:',
      '  The snippet embeds the interactive calendar via iframe.',
      '  Deploy this Angular app first (ng build), then host dist/remotely-rogers/browser',
      '  at a public URL and set GROUP_BOOKING_EMBED_URL before export, e.g.:',
      '    GROUP_BOOKING_EMBED_URL=https://booking.remotelyrogers.com/group-booking npm run export:lodgify-snippets',
      '',
    ].join('\n'),
    'utf8',
  );

  log(`Done — ${PAGES.length} snippets in ${outDir}`);
  log('Paste each file into Lodgify → Pages → Raw HTML widget → Publish');
}

exportSnippets();
