(function () {
  const input = document.getElementById("cityFilter");
  const clearBtn = document.getElementById("clearCityFilter");
  const list = document.getElementById("cityList");
  const empty = document.getElementById("cityEmpty");
  const countEl = document.getElementById("cityCount");

  if (!input || !list) return;

  const rows = Array.from(list.querySelectorAll("[data-city]"));
  if (countEl) countEl.textContent = String(rows.length);

  function applyFilter() {
    const q = input.value.trim().toLowerCase();
    let shown = 0;

    rows.forEach((el) => {
      const city = (el.getAttribute("data-city") || "").toLowerCase();
      const match = !q || city.includes(q);
      el.style.display = match ? "" : "none";
      if (match) shown++;
    });

    if (empty) empty.hidden = shown !== 0;
  }

  input.addEventListener("input", applyFilter);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      applyFilter();
      input.focus();
    });
  }

  applyFilter();
})();
