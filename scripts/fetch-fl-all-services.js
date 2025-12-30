/**
 * Fetch business listings for all Florida cities and all services
 * using Google Places API (Text Search + Details).
 *
 * Output:
 *   src/data/fl/{serviceFolder}/{citySlug}.json
 *
 * Usage:
 *   node scripts/fetch-fl-all-services.js
 *
 * Required env:
 *   GOOGLE_API_KEY=...            (or GOOGLE_PLACES_API_KEY)
 *
 * Optional env:
 *   LIMIT_PER_CITY=20             // how many to save per city/service
 *   SKIP_EXISTING=true            // skip existing files (unless MIN_RESULTS forces overwrite)
 *   MIN_RESULTS=0                 // if >0, skip only if existing file has >= MIN_RESULTS items
 *
 *   CITY_LIMIT=0                  // 0 = all cities, else first N cities (test mode)
 *   SERVICE_LIMIT=0               // 0 = all services, else first N services (test mode)
 *   SERVICE_FILTER=hvac           // run only one service key (e.g. hvac, plumbing)
 *
 *   SLEEP_MS=250
 *   DETAILS_SLEEP_MS=150
 *   MAX_PAGES=2                   // max pages of Text Search (each page up to 20)
 *
 *   RETRIES=3
 *   RETRY_DELAY_MS=1500
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

import { floridaCities } from "../src/data/fl-cities.js";
import { services } from "../src/data/services.js";

dotenv.config();

// ✅ accept either env var name
const API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.PLACES_API_KEY ||
  process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ Missing GOOGLE_API_KEY (or GOOGLE_PLACES_API_KEY) in .env");
  process.exit(1);
}

// =========================
// Config
// =========================
const OUT_DIR = path.resolve("src/data/fl");

const LIMIT_PER_CITY = Number(process.env.LIMIT_PER_CITY || 20);
const SKIP_EXISTING = String(process.env.SKIP_EXISTING || "true") === "true";

// ✅ NEW: top-up mode: skip only if existing has >= MIN_RESULTS
const MIN_RESULTS = Number(process.env.MIN_RESULTS || 0);

const CITY_LIMIT = Number(process.env.CITY_LIMIT || 0);
const SERVICE_LIMIT = Number(process.env.SERVICE_LIMIT || 0);

// ✅ run only one service key
const SERVICE_FILTER = (process.env.SERVICE_FILTER || "").trim().toLowerCase();

const SLEEP_MS = Number(process.env.SLEEP_MS || 250);
const DETAILS_SLEEP_MS = Number(process.env.DETAILS_SLEEP_MS || 150);

const MAX_PAGES = Number(process.env.MAX_PAGES || 2);

const RETRIES = Number(process.env.RETRIES || 3);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS || 1500);

// =========================
// Helpers
// =========================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugifyCity(city) {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function buildQuery(service, cityName) {
  // expects services.js field: query
  return `${service.query} in ${cityName}, FL`;
}

function readExistingCount(filePath) {
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return -1; // unreadable
  }
}

/**
 * ✅ Retry wrapper for transient Google errors
 */
async function withRetry(fn, label = "request") {
  let last = null;

  for (let i = 0; i < RETRIES; i++) {
    try {
      const res = await fn();
      const status = res?.status;

      if (
        status === "REQUEST_DENIED" ||
        status === "OVER_QUERY_LIMIT" ||
        status === "UNKNOWN_ERROR"
      ) {
        const msg = res?.error_message || "(no message)";
        console.log(
          `⚠️  ${label}: ${status} — ${msg} (retry ${i + 1}/${RETRIES})`
        );
        last = res;
        await sleep(RETRY_DELAY_MS * (i + 1));
        continue;
      }

      return res;
    } catch (e) {
      console.log(`⚠️  ${label}: exception (retry ${i + 1}/${RETRIES})`);
      last = e;
      await sleep(RETRY_DELAY_MS * (i + 1));
    }
  }

  return last;
}

// =========================
// Google Places API calls
// =========================
async function placesTextSearch(query, pagetoken = "") {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", API_KEY);
  if (pagetoken) url.searchParams.set("pagetoken", pagetoken);

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    console.log("Google TextSearch error:", json.status, json.error_message || "(no message)");
  }

  return json;
}

async function placeDetails(placeId) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);

  url.searchParams.set(
    "fields",
    [
      "name",
      "rating",
      "user_ratings_total",
      "formatted_phone_number",
      "website",
      "formatted_address",
      "url",
      "business_status",
    ].join(",")
  );

  url.searchParams.set("key", API_KEY);

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK") {
    console.log("Google Details error:", json.status, json.error_message || "(no message)");
  }

  return json;
}

// =========================
// Fetch one city+service
// =========================
async function fetchCityService(service, cityName) {
  const citySlug = slugifyCity(cityName);
  const serviceFolder = service.folder || service.key;

  const serviceDir = path.join(OUT_DIR, serviceFolder);
  ensureDir(serviceDir);

  const outFile = path.join(serviceDir, `${citySlug}.json`);

  // ✅ NEW: smarter skipping with MIN_RESULTS
  if (SKIP_EXISTING && exists(outFile)) {
    if (MIN_RESULTS > 0) {
      const count = readExistingCount(outFile);
      if (count >= MIN_RESULTS) {
        return { status: "skipped", citySlug, outFile, reason: `has ${count}` };
      }
      if (count >= 0 && count < MIN_RESULTS) {
        // overwrite to top-up
      } else if (count === -1) {
        // unreadable file, overwrite
      }
    } else {
      return { status: "skipped", citySlug, outFile, reason: "exists" };
    }
  }

  const query = buildQuery(service, cityName);

  // Gather results from Text Search (up to MAX_PAGES)
  let rawResults = [];
  let nextToken = "";

  for (let page = 0; page < MAX_PAGES; page++) {
    // next_page_token requires a short delay before it works
    if (page > 0) {
      await sleep(2000);
    } else {
      await sleep(SLEEP_MS);
    }

    const search = await withRetry(
      () => placesTextSearch(query, nextToken),
      `TextSearch ${service.key}/${citySlug} page ${page + 1}`
    );

    if (!search || !search.status) {
      return { status: "error", error: "NO_RESPONSE", citySlug, outFile };
    }

    if (search.status !== "OK" && search.status !== "ZERO_RESULTS") {
      return { status: "error", error: search.status, citySlug, outFile };
    }

    rawResults = rawResults.concat(search.results || []);
    nextToken = search.next_page_token || "";
    if (!nextToken) break;
  }

  // Deduplicate place IDs
  const unique = new Map();
  for (const r of rawResults) {
    if (r?.place_id && !unique.has(r.place_id)) unique.set(r.place_id, r);
  }

  // Grab a bit more than limit so details filtering doesn't drop us too low
  const placeIds = Array.from(unique.keys()).slice(0, Math.max(LIMIT_PER_CITY, 25));
  const final = [];

  for (const placeId of placeIds) {
    await sleep(DETAILS_SLEEP_MS);

    const details = await withRetry(
      () => placeDetails(placeId),
      `Details ${service.key}/${citySlug}`
    );

    if (!details || details.status !== "OK") continue;

    const d = details.result || {};

    // Keep only operational businesses
    if (d.business_status && d.business_status !== "OPERATIONAL") continue;

    final.push({
      name: d.name || "",
      rating: safeNumber(d.rating, 0),
      reviews: safeNumber(d.user_ratings_total, 0),
      phone: d.formatted_phone_number || "",
      website: d.website || "",
      address: d.formatted_address || "",
      place_id: placeId,
      maps_url: d.url || "",
    });

    if (final.length >= LIMIT_PER_CITY) break;
  }

  writeJSON(outFile, final);

  return {
    status: "ok",
    count: final.length,
    citySlug,
    outFile,
  };
}

// =========================
// Main runner
// =========================
async function run() {
  ensureDir(OUT_DIR);

  const cities = CITY_LIMIT > 0 ? floridaCities.slice(0, CITY_LIMIT) : floridaCities;

  // Start with full list
  let svcList = SERVICE_LIMIT > 0 ? services.slice(0, SERVICE_LIMIT) : services;

  // ✅ filter by service key if provided
  if (SERVICE_FILTER) {
    svcList = svcList.filter((s) => s.key.toLowerCase() === SERVICE_FILTER);

    if (!svcList.length) {
      console.error(`❌ SERVICE_FILTER="${SERVICE_FILTER}" did not match any services.`);
      console.error("Available keys:", services.map((s) => s.key).join(", "));
      process.exit(1);
    }
  }

  console.log("====================================");
  console.log("FixAlways — Google Places Generator");
  console.log("====================================");
  console.log(`Cities: ${cities.length}${CITY_LIMIT ? " (limited)" : ""}`);
  console.log(`Services: ${svcList.length}${SERVICE_LIMIT ? " (limited)" : ""}`);
  console.log(`Service filter: ${SERVICE_FILTER || "(none)"}`);
  console.log(`Limit per city: ${LIMIT_PER_CITY}`);
  console.log(`Skip existing: ${SKIP_EXISTING}`);
  console.log(`Min results: ${MIN_RESULTS || "(off)"}`);
  console.log(`Max pages: ${MAX_PAGES}`);
  console.log(`Retries: ${RETRIES}`);
  console.log(`Output dir: ${OUT_DIR}`);
  console.log("------------------------------------");

  let ok = 0;
  let skipped = 0;
  let errored = 0;

  const start = Date.now();

  for (const service of svcList) {
    console.log(`\n==== SERVICE: ${service.key} (${service.folder}) ====`);
    for (const cityName of cities) {
      const citySlug = slugifyCity(cityName);

      const res = await fetchCityService(service, cityName);

      if (res.status === "ok") {
        ok++;
        console.log(`✅ ${service.key} / ${citySlug} → ${res.count} saved`);
      } else if (res.status === "skipped") {
        skipped++;
        console.log(`⏭️  ${service.key} / ${citySlug} → ${res.reason || "exists"}`);
      } else {
        errored++;
        console.log(`❌ ${service.key} / ${citySlug} → ${res.error}`);
      }
    }
  }

  const elapsed = Math.round((Date.now() - start) / 1000);

  console.log("\n====================================");
  console.log("DONE");
  console.log("====================================");
  console.log(`OK: ${ok}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errored}`);
  console.log(`Elapsed: ${elapsed}s`);
}

run().catch((e) => {
  console.error("❌ Unhandled error:", e);
  process.exit(1);
});
