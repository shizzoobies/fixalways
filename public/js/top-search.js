/**
 * Top pill search
 * - Sends user to: /fl/{citySlug}/{serviceKey}
 * - If already on a city/service page, preserves query params (sort/filters)
 * - If service changes and city input is populated, auto-navigates
 */

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function currentQS() {
  const sp = new URLSearchParams(window.location.search);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function navigate(serviceKey, cityText) {
  const citySlug = slugify(cityText);
  if (!citySlug) return;

  const qs = currentQS();
  window.location.href = `/fl/${citySlug}/${serviceKey}${qs}`;
}

function init() {
  const serviceSelect = document.querySelector("#serviceSelect");
  const cityInput = document.querySelector("#cityInput");
  const goBtn = document.querySelector("#searchGo");

  if (!serviceSelect || !cityInput) return;

  if (goBtn) {
    goBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(serviceSelect.value, cityInput.value);
    });
  }

  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(serviceSelect.value, cityInput.value);
    }
  });

  // auto-navigate if user changes service and already typed a city
  serviceSelect.addEventListener("change", () => {
    const cityText = (cityInput.value || "").trim();
    if (cityText.length >= 2) {
      navigate(serviceSelect.value, cityText);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
