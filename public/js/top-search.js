/**
 * Header search bar
 * Sends user to: /fl/{citySlug}/{serviceKey}
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
  const serviceSelect = document.querySelector("#topService");
  const cityInput = document.querySelector("#topCity");
  const goBtn = document.querySelector("#topSearchBtn");

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

  serviceSelect.addEventListener("change", () => {
    const cityText = (cityInput.value || "").trim();
    if (cityText.length >= 2) {
      navigate(serviceSelect.value, cityText);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
