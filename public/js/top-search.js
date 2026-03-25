/**
 * Header search bar + custom service picker
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
  const hiddenSelect = document.querySelector("#topService");
  const cityInput = document.querySelector("#topCity");
  const goBtn = document.querySelector("#topSearchBtn");

  // --- Custom service picker ---
  const picker = document.querySelector("#servicePicker");
  const pickerBtn = document.querySelector("#servicePickerBtn");
  const pickerLabel = document.querySelector("#servicePickerLabel");
  const pickerMenu = document.querySelector("#servicePickerMenu");
  const options = document.querySelectorAll(".headerServiceOption");

  if (picker && pickerBtn && pickerMenu) {
    // Toggle menu
    pickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      picker.classList.toggle("open");
    });

    // Option selection
    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        const val = opt.dataset.value;
        const label = opt.textContent.trim();

        // Update label + hidden select
        pickerLabel.textContent = label;
        if (hiddenSelect) hiddenSelect.value = val;

        // Mark active
        options.forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");

        picker.classList.remove("open");

        // Auto-navigate if city is filled
        const cityText = (cityInput?.value || "").trim();
        if (cityText.length >= 2) {
          navigate(val, cityText);
        }
      });
    });

    // Mark initial active
    options.forEach((opt) => {
      if (opt.dataset.value === (hiddenSelect?.value || "hvac")) {
        opt.classList.add("active");
      }
    });

    // Close on outside click
    document.addEventListener("click", () => {
      picker.classList.remove("open");
    });

    pickerMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  // --- Search button ---
  if (goBtn && hiddenSelect && cityInput) {
    goBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(hiddenSelect.value, cityInput.value);
    });
  }

  // --- Enter key in city input ---
  if (cityInput && hiddenSelect) {
    cityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        navigate(hiddenSelect.value, cityInput.value);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
