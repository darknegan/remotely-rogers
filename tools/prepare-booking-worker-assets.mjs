/**
 * Prepares Angular browser output for Cloudflare Workers static assets (SPA).
 * Copies index.csr.html → index.html so not_found_handling can bootstrap the app.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browserDir = path.join(__dirname, '..', 'dist', 'remotely-rogers', 'browser');
const csrEntry = path.join(browserDir, 'index.csr.html');
const spaEntry = path.join(browserDir, 'index.html');
const staticEntry = path.join(browserDir, 'index.html');

const sourceEntry = fs.existsSync(csrEntry) ? csrEntry : staticEntry;

if (!fs.existsSync(sourceEntry)) {
  throw new Error(`Missing ${csrEntry} or ${staticEntry}. Run "ng build --configuration=booking-worker" first.`);
}

if (sourceEntry !== spaEntry) {
  fs.copyFileSync(sourceEntry, spaEntry);
}

console.log(`[prepare-booking-worker-assets] Wrote ${spaEntry}`);
