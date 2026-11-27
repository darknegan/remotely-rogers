/**
 * Capture booking-off stepper (2 guests) and min-stay summary on local wrangler test build.
 * Usage: node tools/capture-booking-stepper-minstay.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787';
const OUT = '/opt/cursor/artifacts';

async function goToMonth(page, label) {
  const want = label.toUpperCase();
  const title = page.locator('.rr-booking-calendar__title');
  for (let i = 0; i < 18; i++) {
    const text = (await title.innerText()).toUpperCase();
    if (text.includes(want)) {
      return;
    }
    await page.locator('.rr-booking-calendar__head button', { hasText: '›' }).click();
    await page.waitForTimeout(200);
  }
  throw new Error(`Could not reach calendar month ${label}`);
}

async function pickMinStayViolation(page) {
  await goToMonth(page, 'DECEMBER 2026');
  const available = page.locator('button.rr-cal-day--available');
  await available.getByText('7', { exact: true }).click();
  await page.waitForTimeout(200);
  await available.getByText('8', { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole('alert').first().waitFor({ timeout: 15_000 });
}

async function selectFirstCabinAndTwoGuests(page) {
  const checkbox = page.locator('.rr-cabin-pick-list input[type="checkbox"]').first();
  await checkbox.waitFor({ state: 'visible', timeout: 30_000 });
  await checkbox.check();
  const plus = page.locator('.rr-cabin-pick-list li.is-selected button', { hasText: '+' }).first();
  await plus.waitFor({ state: 'visible' });
  await plus.click();
  await page.waitForTimeout(200);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  for (const [ctx, tag] of [
    [desktop, 'desktop'],
    [mobile, 'mobile-390'],
  ]) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/group-booking`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.getByRole('heading', { name: /Pick shared dates/i }).waitFor({ timeout: 60_000 });
    await pickMinStayViolation(page);
    await shot(page, `booking-minstay-summary-${tag}.png`);
    await page.goto(`${BASE}/group-booking`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.getByRole('heading', { name: /Pick shared dates/i }).waitFor({ timeout: 60_000 });
    await goToMonth(page, 'DECEMBER 2026');
    const available = page.locator('button.rr-cal-day--available');
    await available.getByText('7', { exact: true }).click();
    await page.waitForTimeout(150);
    await available.getByText('10', { exact: true }).click();
    await page.waitForTimeout(400);
    await selectFirstCabinAndTwoGuests(page);
    await shot(page, `booking-stepper-2-guests-off-${tag}.png`);
    await page.close();
  }

  await browser.close();
  console.log('Saved screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});