import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = 'http://localhost:8787';
const outDir = '/opt/cursor/artifacts/group-booking-designer-fixes';
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { name: 'fix1-worker-pricing', path: '/group-booking' },
  { name: 'fix3-checkout-disabled', path: '/group-booking/checkout' },
];

const viewports = [
  { tag: 'desktop', width: 1280, height: 900 },
  { tag: 'mobile390', width: 390, height: 844 },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const shot of shots) {
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const file = path.join(outDir, `${shot.name}-${vp.tag}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log('wrote', file);
  }
}

// Loading skeleton: disable cache and reload group-booking quickly after navigation.
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}/group-booking`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.rr-custom-group__skeleton, app-booking-calendar', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(300);
await page.screenshot({
  path: path.join(outDir, 'fix4-skeleton-desktop.png'),
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: path.join(outDir, 'fix4-skeleton-mobile390.png'),
  fullPage: true,
});

// Reserved-range notice: select Black Gum and attempt a long range; capture if notice appears.
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}/group-booking`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const days = page.locator('button.rr-cal-day:not([disabled])');
const count = await days.count();
if (count >= 8) {
  await days.nth(2).click();
  await page.waitForTimeout(250);
  await days.nth(7).click();
}
await page.waitForTimeout(600);
const conflict = await page.locator('.rr-custom-group__notice').count();
if (conflict > 0) {
  await page.screenshot({
    path: path.join(outDir, 'fix2-reserved-range-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(outDir, 'fix2-reserved-range-mobile390.png'),
    fullPage: true,
  });
}

await browser.close();
console.log('done');