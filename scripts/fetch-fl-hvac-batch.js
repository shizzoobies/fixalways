import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { floridaCities } from "../src/data/fl-cities.js";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env (site/.env)");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugifyCity(city) {
  return city.toLowerCase().trim().replace(/\s+/g, "-");
}

async function fetchPlacesForCity(city) {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: `HVAC contractor in ${city} FL`,
    maxResultCount: 10,
  };

  const fieldMask = [
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
  ].join(",");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  return (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    rating: typeof p.rating === "number" ? p.rating : null,
    reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    phone: p.nationalPhoneNumber || null,
    website: p.websiteUri || null,
    maps: p.googleMapsUri || null,
    address: p.formattedAddress || null,
  }));
}

async function main() {
  const outDir = path.join(process.cwd(), "src", "data", "fl-hvac");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Adjust this number to scale (10 -> 50 -> 100 -> 200)
  const batch = floridaCities.slice(0, 200);

  console.log(`Fetching HVAC listings for ${batch.length} Florida cities...`);
  console.log("This should cost only a few cents.");

  for (let i = 0; i < batch.length; i++) {
    const city = batch[i];
    const slug = slugifyCity(city);
    const outFile = path.join(outDir, `${slug}.json`);

    console.log(`\n[${i + 1}/${batch.length}] ${city} → ${slug}.json`);

    try {
      const places = await fetchPlacesForCity(city);
      fs.writeFileSync(outFile, JSON.stringify(places, null, 2), "utf-8");
      console.log(`Saved ${places.length} listings.`);
    } catch (err) {
      console.error(`Failed for ${city}:`, err.message);
    }

    await sleep(1200);
  }

  console.log("\nDone! Refresh your site:");
  console.log("Example: http://localhost:4321/fl/miami/hvac");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
