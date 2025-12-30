/**
 * City/Service listing page filters + sorting
 * Supports URL state:
 *   ?sort=rating
 *   ?minRating=4.5
 *   ?minReviews=100
 *   ?hasWebsite=1
 *
 * This keeps filters sticky when switching trades.
 */

function qs() {
  return new URLSearchParams(window.location.search);
}

function setQS(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "" || v === false) {
      url.searchParams.delete(k);
    } else {
      url.searchParams.set(k, String(v));
    }
  });
  window.history.replaceState({}, "", url.toString());
}

function getListings() {
  return Array.from(document.querySelectorAll("#listingList .listingItem"));
}

function getNum(el, attr) {
  return Number(el.getAttribute(attr) || "0");
}

function apply() {
  const params = qs();

  const sort = params.get("sort") || "recommended";
  const minRating = Number(params.get("minRating") || 0);
  const minReviews = Number(params.get("minReviews") || 0);
  const hasWebsite = params.get("hasWebsite") === "1";

  const listEl = document.querySelector("#listingList");
  if (!listEl) return;

  const items = getListings();

  // Filter
  items.forEach((el) => {
    const rating = getNum(el, "data-rating");
    const reviews = getNum(el, "data-reviews");
    const website = el.getAttribute("data-website") === "1";

    let show = true;
    if (minRating && rating < minRating) show = false;
    if (minReviews && reviews < minReviews) show = false;
    if (hasWebsite && !website) show = false;

    el.style.display = show ? "" : "none";
  });

  // Sort visible items
  const visible = items.filter((el) => el.style.display !== "none");

  const by = {
    recommended: (a, b) =>
      (getNum(b, "data-rating") - getNum(a, "data-rating")) ||
      (getNum(b, "data-reviews") - getNum(a, "data-reviews")),
    rating: (a, b) => getNum(b, "data-rating") - getNum(a, "data-rating"),
    reviews: (a, b) => getNum(b, "data-reviews") - getNum(a, "data-reviews"),
    name: (a, b) =>
      (a.getAttribute("data-name") || "").localeCompare(b.getAttribute("data-name") || ""),
  }[sort] || ((a, b) => 0);

  visible.sort(by).forEach((el) => listEl.appendChild(el));

  // Update count
  const meta = document.querySelector("#resultsMeta");
  if (meta) meta.textContent = `${visible.length} found`;

  // Sync UI controls
  const sortSelect = document.querySelector("#sortSelect");
  if (sortSelect) sortSelect.value = sort;

  const btn45 = document.querySelector("#filterRating45");
  const btn100 = document.querySelector("#filterReviews100");
  const btnWeb = document.querySelector("#filterWebsite");

  if (btn45) btn45.setAttribute("aria-pressed", minRating >= 4.5 ? "true" : "false");
  if (btn100) btn100.setAttribute("aria-pressed", minReviews >= 100 ? "true" : "false");
  if (btnWeb) btnWeb.setAttribute("aria-pressed", hasWebsite ? "true" : "false");
}

function toggleChip(key, valueOn, valueOff = "") {
  const params = qs();
  const current = params.get(key);

  if (current === String(valueOn)) {
    setQS({ [key]: valueOff });
  } else {
    setQS({ [key]: valueOn });
  }

  apply();
}

function init() {
  const sortSelect = document.querySelector("#sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      setQS({ sort: e.target.value });
      apply();
    });
  }

  const btn45 = document.querySelector("#filterRating45");
  const btn100 = document.querySelector("#filterReviews100");
  const btnWeb = document.querySelector("#filterWebsite");

  if (btn45) btn45.addEventListener("click", () => toggleChip("minRating", "4.5", ""));
  if (btn100) btn100.addEventListener("click", () => toggleChip("minReviews", "100", ""));
  if (btnWeb) btnWeb.addEventListener("click", () => toggleChip("hasWebsite", "1", ""));

  apply();
}

document.addEventListener("DOMContentLoaded", init);
