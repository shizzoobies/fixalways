import "dotenv/config";
import fs from "fs";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env");
  process.exit(1);
}

// Simple helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function textSearchHVACInTampa() {
  // Places API (New) Text Search endpoint
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: "HVAC contractor in Tampa FL",
    maxResultCount: 10
  };

  // Field mask controls what data we request (keeps response small)
  const fieldMask = [
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri"
  ].join(",");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  const places = (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? p.googleMapsUri ?? null,
    address: p.formattedAddress ?? null
  }));

  return places;
}

async function main() {
  console.log("Fetching Tampa HVAC listings from Google Places...");
  const places = await textSearchHVACInTampa();

  if (!places.length) {
    console.log("No results returned. Try adjusting the query.");
    process.exit(0);
  }

  // Write to your existing data file used by the page
  const outPath = "src/data/tampa-hvac.json";
  fs.writeFileSync(outPath, JSON.stringify(places, null, 2), "utf-8");

  console.log(`Saved ${places.length} listings to ${outPath}`);
  console.log("Now refresh: http://localhost:4321/fl/tampa/hvac");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
