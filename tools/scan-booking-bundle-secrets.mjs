#!/usr/bin/env node
/**
 * Fail if the production browser bundle contains private Bookingmood REST paths or obvious secret keys.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST_ROOT = path.resolve('dist/remotely-rogers/browser');
const FORBIDDEN_SUBSTRINGS = [
  'api.bookingmood.com/v1',
  'BOOKINGMOOD_API_KEY',
  'Authorization: Bearer sk_',
];
const SUSPICIOUS_LITERAL_PATTERN =
  /(BOOKINGMOOD_API_KEY|sk_live_|sk_test_|Bearer sk_[a-z0-9])/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && /\.(js|mjs|html)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  let files = [];
  try {
    files = await walk(DIST_ROOT);
  } catch (error) {
    console.error('Bundle output not found. Run `npm run build` first.');
    console.error(error);
    process.exit(2);
  }

  const hits = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const needle of FORBIDDEN_SUBSTRINGS) {
      if (text.includes(needle)) {
        hits.push({ file, needle });
      }
    }
    if (SUSPICIOUS_LITERAL_PATTERN.test(text)) {
      hits.push({ file, needle: 'SUSPICIOUS_LITERAL_PATTERN' });
    }
  }

  if (hits.length > 0) {
    console.error('Booking bundle secret scan FAILED:');
    for (const hit of hits) {
      console.error(` - ${hit.needle} in ${hit.file}`);
    }
    process.exit(1);
  }

  console.log(`Booking bundle secret scan passed (${files.length} files under ${DIST_ROOT}).`);
}

await main();