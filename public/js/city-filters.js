(() => {
  function parseNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function score(item) {
    const rating = parseNum(item.dataset.rating);
    const reviews = parseNum(item.dataset.reviews);
    const website = item.dataset.website === "1" ? 1 : 0;
    return rating * 100 + Math.min(90, Math.sqrt(reviews) * 7) + (website ? 18 : 0);
  }

  function initCityFilters() {
    const list = document.getElementById("listingList");
    if (!list) return;

    const items = Array.from(list.querySelectorAll(".listingItem"));
    if (!items.length) return;

    const sortSelect = document.getElementById("sortSelect");
    const filterRating45 = document.getElementById("filterRating45");
    const filterReviews100 = document.getElementById("filterReviews100");
    const filterWebsite = document.getElementById("filterWebsite");

    const meta = document.getElementById("resultsMeta");

    const state = {
      sort: "recommended",
      rating45: false,
      reviews100: false,
      website: false,
    };

    function setPressed(btn, pressed) {
      if (!btn) return;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    }

    function passesFilters(item) {
      const rating = parseNum(item.dataset.rating);
      const reviews = parseNum(item.dataset.reviews);
      const website = item.dataset.website === "1";

      if (state.rating45 && rating < 4.5) return false;
      if (state.reviews100 && reviews < 100) return false;
      if (state.website && !website) return false;

      return true;
    }

    function apply() {
      let visibleCount = 0;

      items.forEach((item) => {
        const show = passesFilters(item);
        item.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });

      const visibleItems = items.filter((it) => it.style.display !== "none");

      visibleItems.sort((a, b) => {
        if (state.sort === "recommended") return score(b) - score(a);
        if (state.sort === "rating") return parseNum(b.dataset.rating) - parseNum(a.dataset.rating);
        if (state.sort === "reviews") return parseNum(b.dataset.reviews) - parseNum(a.dataset.reviews);
        if (state.sort === "name") return (a.dataset.name || "").localeCompare(b.dataset.name || "");
        return 0;
      });

      // Re-append visible items first, in sorted order
      visibleItems.forEach((node) => list.appendChild(node));

      if (meta) meta.textContent = visibleCount ? `${visibleCount} found` : "No matching results";
    }

    // Wire events
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        state.sort = e.target.value || "recommended";
        apply();
      });
    }

    if (filterRating45) {
      filterRating45.addEventListener("click", () => {
        state.rating45 = !state.rating45;
        setPressed(filterRating45, state.rating45);
        apply();
      });
    }

    if (filterReviews100) {
      filterReviews100.addEventListener("click", () => {
        state.reviews100 = !state.reviews100;
        setPressed(filterReviews100, state.reviews100);
        apply();
      });
    }

    if (filterWebsite) {
      filterWebsite.addEventListener("click", () => {
        state.website = !state.website;
        setPressed(filterWebsite, state.website);
        apply();
      });
    }

    // Initial run
    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCityFilters);
  } else {
    initCityFilters();
  }
})();
