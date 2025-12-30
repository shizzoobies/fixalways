(() => {
  function slugifyCity(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function setMetaCount(count) {
    const meta = document.getElementById("resultsMeta");
    if (meta) meta.textContent = count ? `${count} found` : "No matching results";
  }

  function filterCities(q) {
    const cityList = document.getElementById("cityList");
    if (!cityList) return null;

    const items = Array.from(cityList.querySelectorAll(".item"));
    let firstHref = null;

    items.forEach((item) => {
      const name = (item.querySelector(".name")?.textContent || "").toLowerCase();
      const show = !q || name.includes(q);
      item.style.display = show ? "" : "none";
      if (show && !firstHref) firstHref = item.getAttribute("data-href") || null;
    });

    return firstHref;
  }

  function filterVendors(q) {
    const vendorList = document.getElementById("listingList");
    if (!vendorList) return;

    const vendorItems = Array.from(vendorList.querySelectorAll(".listingItem"));
    if (!vendorItems.length) return;

    let visible = 0;
    vendorItems.forEach((el) => {
      const name = (el.dataset.name || "").toLowerCase();
      const show = !q || name.includes(q);
      el.style.display = show ? "" : "none";
      if (show) visible++;
    });

    setMetaCount(visible);
  }

  function init() {
    const input = document.getElementById("topSearch");
    if (!input) return;

    input.addEventListener("input", (e) => {
      const q = (e.target.value || "").toLowerCase().trim();
      // Works on homepage (city list) and city pages (vendor list)
      filterCities(q);
      filterVendors(q);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;

      const qRaw = (input.value || "").trim();
      const q = qRaw.toLowerCase().trim();
      if (!q) return;

      // If we’re on the homepage and have a city list, go to first visible match
      const firstHref = filterCities(q);
      if (firstHref) {
        window.location.href = firstHref;
        return;
      }

      // Otherwise, treat Enter as "go to that city page" (Florida HVAC default)
      // This makes Enter always do something even if you’re scrolled up, or on another page.
      const slug = slugifyCity(qRaw);
      if (slug) window.location.href = `/fl/${slug}/hvac`;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
