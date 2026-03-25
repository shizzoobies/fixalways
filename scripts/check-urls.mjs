/**
 * FixAlways — Vendor URL Health Checker
 * Scans all listing JSON files, checks each website URL,
 * and removes the website field from listings with broken links.
 *
 * Usage: node scripts/check-urls.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'fl');
const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 25;       // parallel requests
const TIMEOUT_MS = 8000;      // 8s timeout per URL
const BATCH_DELAY = 200;      // ms between batches

let totalChecked = 0;
let totalBroken = 0;
let totalFixed = 0;
let brokenList = [];

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FixAlways-LinkChecker/1.0)',
      },
    });
    clearTimeout(timer);

    // Consider 4xx and 5xx as broken (except 403 which some sites return for HEAD)
    if (res.status >= 400 && res.status !== 403) {
      // Double-check with GET for 405 (Method Not Allowed)
      if (res.status === 405) {
        const getRes = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FixAlways-LinkChecker/1.0)' },
        });
        return getRes.status < 400 || getRes.status === 403;
      }
      return false;
    }
    return true;
  } catch (err) {
    // Network error, timeout, DNS failure = broken
    return false;
  }
}

async function processBatch(items) {
  return Promise.all(items.map(async (item) => {
    const ok = await checkUrl(item.url);
    totalChecked++;
    if (!ok) {
      totalBroken++;
      brokenList.push({ file: item.file, name: item.name, url: item.url });
    }
    return { ...item, ok };
  }));
}

async function main() {
  console.log(`\n🔍 FixAlways URL Health Checker`);
  console.log(`   Data dir: ${DATA_DIR}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will remove broken URLs)'}\n`);

  // Collect all URLs to check
  const allItems = [];
  const serviceDirs = fs.readdirSync(DATA_DIR);

  for (const service of serviceDirs) {
    const serviceDir = path.join(DATA_DIR, service);
    if (!fs.statSync(serviceDir).isDirectory()) continue;

    const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(serviceDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (let i = 0; i < data.length; i++) {
        const listing = data[i];
        if (listing.website && listing.website.trim()) {
          allItems.push({
            file: filePath,
            relFile: `${service}/${file}`,
            name: listing.name,
            url: listing.website.trim(),
            index: i,
          });
        }
      }
    }
  }

  console.log(`   Found ${allItems.length} URLs to check across ${serviceDirs.length} services\n`);

  // Deduplicate URLs (same URL may appear in multiple files)
  const uniqueUrls = new Map();
  for (const item of allItems) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, []);
    }
    uniqueUrls.get(item.url).push(item);
  }

  console.log(`   ${uniqueUrls.size} unique URLs to check\n`);

  // Check URLs in batches
  const urlEntries = [...uniqueUrls.entries()];
  const urlResults = new Map(); // url -> boolean

  for (let i = 0; i < urlEntries.length; i += CONCURRENCY) {
    const batch = urlEntries.slice(i, i + CONCURRENCY);
    const batchItems = batch.map(([url]) => ({ url, file: '', name: '' }));

    const results = await processBatch(batchItems);
    for (let j = 0; j < results.length; j++) {
      urlResults.set(batch[j][0], results[j].ok);
    }

    const pct = Math.round(((i + batch.length) / urlEntries.length) * 100);
    process.stdout.write(`\r   Progress: ${i + batch.length}/${urlEntries.length} (${pct}%) — ${totalBroken} broken so far`);

    if (i + CONCURRENCY < urlEntries.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  console.log('\n');

  // Rebuild broken list with actual file info
  brokenList = [];
  for (const item of allItems) {
    if (!urlResults.get(item.url)) {
      brokenList.push(item);
    }
  }

  // Report
  console.log(`   ✅ Working: ${urlResults.size - totalBroken}`);
  console.log(`   ❌ Broken:  ${totalBroken}`);
  console.log('');

  if (brokenList.length === 0) {
    console.log('   All URLs are healthy! Nothing to fix.\n');
    return;
  }

  // Show broken URLs
  console.log('   Broken URLs:');
  const byFile = new Map();
  for (const item of brokenList) {
    if (!byFile.has(item.relFile)) byFile.set(item.relFile, []);
    byFile.get(item.relFile).push(item);
  }

  for (const [file, items] of byFile) {
    for (const item of items) {
      console.log(`   - [${file}] ${item.name}: ${item.url}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\n   Dry run — no files modified. Run without --dry-run to fix.\n`);
    return;
  }

  // Fix: remove website field from broken listings
  console.log(`\n   Fixing ${brokenList.length} listings across files...`);

  const filesToUpdate = new Map();
  for (const item of brokenList) {
    if (!filesToUpdate.has(item.file)) {
      filesToUpdate.set(item.file, new Set());
    }
    filesToUpdate.get(item.file).add(item.url);
  }

  for (const [filePath, brokenUrls] of filesToUpdate) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let changed = false;

    for (const listing of data) {
      if (listing.website && brokenUrls.has(listing.website.trim())) {
        delete listing.website;
        changed = true;
        totalFixed++;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    }
  }

  console.log(`   ✅ Fixed ${totalFixed} listings — removed broken website URLs\n`);
}

main().catch(console.error);
