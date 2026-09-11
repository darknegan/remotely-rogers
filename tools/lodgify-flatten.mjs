/**
 * Converts prerendered PrimeNG markup into plain HTML for Lodgify Raw HTML widgets.
 */
import { JSDOM } from 'jsdom';
import { createBookingEmbed } from './lodgify-booking-embed.mjs';

const PRIME_TAG_MAP = {
  'p-tag-success': 'rr-badge--success',
  'p-tag-warn': 'rr-badge--warn',
  'p-tag-info': 'rr-badge--info',
  'p-tag-secondary': 'rr-badge--secondary',
  'p-tag-contrast': 'rr-badge--contrast',
};

const ICON_GLYPH = {
  'pi-map': '◎',
  'pi-compass': '⌖',
  'pi-eye': '◉',
  'pi-tree': '▲',
  'pi-map-marker': '📍',
  'pi-building': '🏛',
  'pi-megaphone': '♪',
  'pi-book': '📖',
  'pi-calendar': '📅',
  'pi-wifi': 'Wi‑Fi',
  'pi-desktop': '▣',
  'pi-car': '🚗',
  'pi-users': '👥',
  'pi-home': '⌂',
};

function text(el) {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function badgeClassFromTag(tagEl, hero = false) {
  if (hero) return 'rr-badge rr-badge--hero';
  for (const cls of tagEl.classList) {
    if (PRIME_TAG_MAP[cls]) {
      return `rr-badge ${PRIME_TAG_MAP[cls]}`;
    }
  }
  return 'rr-badge rr-badge--secondary';
}

function makeBadge(doc, tagEl, hero = false) {
  const span = doc.createElement('span');
  span.className = badgeClassFromTag(tagEl, hero);
  span.textContent = text(tagEl.querySelector('.p-tag-label') ?? tagEl);
  return span;
}

function convertCard(doc, cardEl, { large = false } = {}) {
  const card = doc.createElement('div');
  card.className = 'rr-card';

  const header = cardEl.querySelector('.p-card-header');
  const img = header?.querySelector('img');
  if (img) {
    const clone = img.cloneNode(true);
    clone.className = 'rr-card__image';
    clone.setAttribute('loading', 'lazy');
    if (large) {
      const media = doc.createElement('div');
      media.className = 'rr-card__media';
      media.appendChild(clone);
      card.appendChild(media);
    } else {
      card.appendChild(clone);
    }
  }

  const body = doc.createElement('div');
  body.className = 'rr-card__body';

  const titleEl = cardEl.querySelector('.p-card-title');
  if (titleEl && text(titleEl)) {
    const h3 = doc.createElement('h3');
    h3.className = 'rr-card__title';
    h3.textContent = text(titleEl);
    body.appendChild(h3);
  }

  const subtitleEl = cardEl.querySelector('.p-card-subtitle');
  if (subtitleEl && text(subtitleEl)) {
    const p = doc.createElement('p');
    p.className = 'rr-card__subtitle';
    p.textContent = text(subtitleEl);
    body.appendChild(p);
  }

  const content = cardEl.querySelector('.p-card-content');
  if (content) {
    for (const tag of content.querySelectorAll('p-tag')) {
      body.appendChild(makeBadge(doc, tag));
    }
    for (const p of content.querySelectorAll('p')) {
      const value = text(p);
      if (!value) continue;
      const out = doc.createElement('p');
      out.className = p.classList.contains('rr-card-meta') ? 'rr-card-meta' : 'rr-card__text';
      out.textContent = value;
      body.appendChild(out);
    }
  }

  card.appendChild(body);
  return card;
}

function convertCardLink(doc, linkEl) {
  const cardEl = linkEl.querySelector('p-card');
  if (!cardEl) return linkEl.cloneNode(true);

  const a = doc.createElement('a');
  for (const attr of ['href', 'target', 'rel', 'aria-label', 'data-rr-categories']) {
    if (linkEl.hasAttribute(attr)) a.setAttribute(attr, linkEl.getAttribute(attr));
  }
  a.className = 'rr-card-link';
  const isLarge =
    linkEl.classList.contains('rr-card-link--featured-large') ||
    cardEl.classList.contains('rr-feature-card--large');
  if (isLarge) {
    a.classList.add('rr-card-link--featured-large');
  }
  a.appendChild(convertCard(doc, cardEl, { large: isLarge }));
  return a;
}

function convertSelectButton(doc, el) {
  const row = doc.createElement('div');
  row.className = 'rr-chip-row';
  row.setAttribute('aria-label', el.getAttribute('arialabel') ?? 'Categories');

  for (const btn of el.querySelectorAll('p-togglebutton')) {
    const chip = doc.createElement('span');
    chip.className = btn.classList.contains('p-togglebutton-checked')
      ? 'rr-chip rr-chip--active'
      : 'rr-chip';
    chip.textContent = text(btn.querySelector('.p-togglebutton-label') ?? btn);
    row.appendChild(chip);
  }

  return row;
}

function convertFeatureListItem(doc, li) {
  const item = doc.createElement('li');
  item.className = 'rr-feature-list__item';

  const iconWrap = doc.createElement('span');
  iconWrap.className = 'rr-feature-list__icon';
  const icon = li.querySelector('i.pi');
  iconWrap.textContent = ICON_GLYPH[[...icon?.classList ?? []].find((c) => c.startsWith('pi-')) ?? ''] ?? '•';

  const copy = doc.createElement('span');
  const strong = li.querySelector('strong');
  if (strong) {
    const s = doc.createElement('strong');
    s.textContent = text(strong);
    copy.appendChild(s);
  }
  const detail = li.querySelector('.rr-feature-list__detail');
  if (detail) {
    const d = doc.createElement('span');
    d.className = 'rr-feature-list__detail';
    d.textContent = text(detail);
    copy.appendChild(d);
  }

  item.appendChild(iconWrap);
  item.appendChild(copy);
  return item;
}

function replaceElement(parent, oldEl, newEl) {
  parent.replaceChild(newEl, oldEl);
}

function flattenTree(doc, root) {
  for (const el of [...root.querySelectorAll('p-selectbutton')]) {
    replaceElement(el.parentNode, el, convertSelectButton(doc, el));
  }

  for (const link of [...root.querySelectorAll('a.rr-card-link')]) {
    replaceElement(link.parentNode, link, convertCardLink(doc, link));
  }

  for (const cardEl of [...root.querySelectorAll('p-card')]) {
    replaceElement(cardEl.parentNode, cardEl, convertCard(doc, cardEl));
  }

  for (const msg of [...root.querySelectorAll('p-message')]) {
    msg.remove();
  }

  for (const panel of [...root.querySelectorAll('p-panel.rr-hero-panel')]) {
    const banner = panel.querySelector('.rr-hero-banner');
    if (banner) {
      const tag = banner.querySelector('p-tag');
      if (tag) replaceElement(tag.parentNode, tag, makeBadge(doc, tag, true));
      replaceElement(panel.parentNode, panel, banner);
    }
  }

  for (const panel of [...root.querySelectorAll('p-panel.rr-cta-panel')]) {
    const cta = doc.createElement('div');
    cta.className = 'rr-cta-panel';
    const content = panel.querySelector('.p-panel-content');
    if (content) {
      for (const child of [...content.childNodes]) {
        if (child.nodeType === 1 && child.matches('a.p-button, a.rr-accent-btn')) {
          const a = doc.createElement('a');
          for (const attr of ['href', 'target', 'rel']) {
            if (child.hasAttribute(attr)) a.setAttribute(attr, child.getAttribute(attr));
          }
          a.className = 'rr-cta';
          a.textContent = text(child.querySelector('.p-button-label') ?? child);
          cta.appendChild(a);
        } else {
          cta.appendChild(child.cloneNode(true));
        }
      }
    }
    replaceElement(panel.parentNode, panel, cta);
  }

  for (const panel of [...root.querySelectorAll('p-panel.rr-split-panel')]) {
    const wrapper = doc.createElement('div');
    wrapper.className = 'rr-split-panel';
    const content = panel.querySelector('.p-panel-content');
    if (content) {
      for (const child of [...content.childNodes]) {
        wrapper.appendChild(child.cloneNode(true));
      }
    }
    const tag = wrapper.querySelector('p-tag');
    if (tag) replaceElement(tag.parentNode, tag, makeBadge(doc, tag));
    for (const li of [...wrapper.querySelectorAll('.rr-feature-list__item')]) {
      replaceElement(li.parentNode, li, convertFeatureListItem(doc, li));
    }
    replaceElement(panel.parentNode, panel, wrapper);
  }

  for (const panel of [...root.querySelectorAll('p-panel.rr-booking-widget-panel')]) {
    const title = text(panel.querySelector('.p-panel-title') ?? panel);
    replaceElement(panel.parentNode, panel, createBookingEmbed(doc, title || 'Group booking calendar'));
  }

  for (const tag of [...root.querySelectorAll('p-tag')]) {
    replaceElement(tag.parentNode, tag, makeBadge(doc, tag));
  }

  for (const div of [...root.querySelectorAll('p-divider')]) {
    const hr = doc.createElement('hr');
    hr.className = 'rr-divider';
    replaceElement(div.parentNode, div, hr);
  }

  for (const el of [...root.querySelectorAll('app-review-carousel')]) {
    const parent = el.parentNode;
    if (!parent) continue;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    el.remove();
  }

  for (const tagName of [
    'p-card',
    'p-panel',
    'p-togglebutton',
    'p-selectbutton',
    'p-tag',
    'p-divider',
    'p-message',
  ]) {
    for (const el of [...root.querySelectorAll(tagName)]) {
      el.remove();
    }
  }

  for (const el of root.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      if (
        attr.name.startsWith('_ng') ||
        attr.name.startsWith('ng-') ||
        attr.name.startsWith('data-p') ||
        attr.name.startsWith('data-pc') ||
        attr.name === 'styleclass' ||
        /^pc\d*$/.test(attr.name)
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Remove HTML comments left by Angular
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  for (const comment of comments) comment.remove();
}

export function flattenForLodgify(html) {
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const root = dom.window.document.getElementById('root');
  flattenTree(dom.window.document, root);
  return root.innerHTML;
}
