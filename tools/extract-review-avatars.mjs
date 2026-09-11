/**
 * Crops the circular Airbnb profile photo from each screenshot in public/reviews.
 * Writes public/reviews/avatars/{review-id}.jpg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'public', 'reviews');
const outDir = path.join(sourceDir, 'avatars');
const SKIP_IDS = new Set(['6-48-48']);
const MANUAL_BOXES = {
  // Desktop Airbnb reviews dashboard — right-hand detail panel, not the header nav.
  '6-48-36': { left: 2860, top: 700, width: 210, height: 210 },
};

function reviewIdFromFilename(name) {
  const match = name.match(/at (\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function isPaper(r, g, b, a) {
  return a < 20 || (r > 246 && g > 246 && b > 246);
}

function isInk(r, g, b, a) {
  if (a < 20) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 236 || max - min > 18;
}

function rowSpan(data, width, y, xMin = 0, xMax = width) {
  let x1 = -1;
  let x2 = -1;
  for (let x = xMin; x < xMax; x++) {
    const i = (y * width + x) * 4;
    if (!isPaper(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      if (x1 < 0) x1 = x;
      x2 = x;
    }
  }
  return { x1, x2, width: x1 < 0 ? 0 : x2 - x1 + 1 };
}

function rowDensity(data, width, y, x1, x2) {
  if (x2 < x1) return 0;
  let filled = 0;
  for (let x = x1; x <= x2; x++) {
    const i = (y * width + x) * 4;
    if (isInk(data[i], data[i + 1], data[i + 2], data[i + 3])) filled++;
  }
  return filled / (x2 - x1 + 1);
}

function longestRun(rows) {
  if (rows.length === 0) return [];
  let best = [rows[0]];
  let current = [rows[0]];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].y === current[current.length - 1].y + 1) {
      current.push(rows[i]);
    } else {
      if (current.length > best.length) best = current;
      current = [rows[i]];
    }
  }
  return current.length > best.length ? current : best;
}

function boxFromRun(run, width, height) {
  const peak = run.reduce((a, b) => (b.width >= a.width ? b : a));
  const diameter = peak.width;
  const cx = (peak.x1 + peak.x2) / 2;
  const pad = 4;
  const left = Math.max(0, Math.round(cx - diameter / 2) - pad);
  const top = Math.max(0, Math.round(peak.y - diameter / 2) - pad);
  const size = Math.min(diameter + pad * 2, width - left, height - top);
  return { left, top, width: size, height: size };
}

function collectCircleRows(data, width, height, { xMin, xMax, yMin, yMax, minD, maxD, center, slop, minDensity }) {
  const rows = [];
  for (let y = yMin; y < yMax; y++) {
    const span = rowSpan(data, width, y, xMin, xMax);
    if (span.width < minD || span.width > maxD) continue;
    const density = rowDensity(data, width, y, span.x1, span.x2);
    if (density < minDensity) continue;
    const mid = (span.x1 + span.x2) / 2;
    if (Math.abs(mid - center) > slop) continue;
    rows.push({ y, ...span, density });
  }
  return rows;
}

function tightenFace(box) {
  const shrink = Math.round(box.width * 0.18);
  return {
    left: box.left + Math.round(shrink / 2),
    top: box.top + Math.round(shrink * 0.12),
    width: box.width - shrink,
    height: box.height - shrink,
  };
}

function fallbackMobileBox(width, height) {
  const size = Math.round(width * 0.385);
  return {
    left: Math.round((width - size) / 2),
    top: Math.max(80, Math.round(height * 0.118)),
    width: size,
    height: size,
  };
}

function findAvatarBox(data, width, height) {
  const desktop = width > 1200;
  const attempts = desktop
    ? [
        {
          xMin: Math.floor(width * 0.58),
          xMax: width,
          yMin: Math.floor(height * 0.08),
          yMax: Math.floor(height * 0.55),
          minD: 120,
          maxD: 380,
          center: width * 0.78,
          slop: width * 0.12,
          minDensity: 0.32,
        },
      ]
    : [
        {
          xMin: 0,
          xMax: width,
          yMin: Math.floor(height * 0.1),
          yMax: Math.floor(height * 0.5),
          minD: Math.floor(width * 0.24),
          maxD: Math.floor(width * 0.5),
          center: width / 2,
          slop: width * 0.1,
          minDensity: 0.4,
        },
        {
          xMin: 0,
          xMax: width,
          yMin: Math.floor(height * 0.08),
          yMax: Math.floor(height * 0.55),
          minD: Math.floor(width * 0.2),
          maxD: Math.floor(width * 0.55),
          center: width / 2,
          slop: width * 0.14,
          minDensity: 0.28,
        },
      ];

  for (const attempt of attempts) {
    const rows = collectCircleRows(data, width, height, attempt);
    const run = longestRun(rows);
    if (run.length >= 24) {
      return boxFromRun(run, width, height);
    }
  }
  if (!desktop) {
    return fallbackMobileBox(width, height);
  }
  throw new Error('no circular run');
}

async function extractOne(file) {
  const id = reviewIdFromFilename(file);
  if (!id || SKIP_IDS.has(id)) return null;

  const input = path.join(sourceDir, file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rawBox = MANUAL_BOXES[id] ?? findAvatarBox(data, info.width, info.height);
  const box = MANUAL_BOXES[id] ? rawBox : tightenFace(rawBox);
  const outPath = path.join(outDir, `${id}.jpg`);

  const cropped = await sharp(input).extract(box).toBuffer();
  await sharp(cropped)
    .resize(160, 160, { fit: 'cover', position: 'north' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(outPath);

  return { id, box };
}

const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.png'));
fs.mkdirSync(outDir, { recursive: true });

const results = [];
for (const file of files) {
  try {
    const result = await extractOne(file);
    if (result) {
      results.push(result);
      console.log(`ok ${result.id} ${result.box.width}x${result.box.height} @${result.box.left},${result.box.top}`);
    }
  } catch (error) {
    console.error(`FAIL ${file}: ${error.message}`);
  }
}

console.log(`Wrote ${results.length} avatars to ${outDir}`);
