document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll(".form-step")];
  const steps = [...document.querySelectorAll(".step")];
  const stepLines = [...document.querySelectorAll(".step-line")];
  const form = $("postForm");
  const next = $("nextStep");
  const back = $("backStep");
  const photoInput = $("photoInput");
  const photoStrip = $("photoStrip");
  const photoManager = $("photoManager");
  const fulfillmentSummary = $("fulfillmentSummary");
  const deliveryFields = $("deliveryFields");
  const meetupFields = $("meetupFields");
  const successOverlay = $("successOverlay");
  const MAX_PHOTOS = 5;
  const MAX_PRICE = 999999.99;
  const MONEY_PATTERN = /^\d{1,9}(\.\d{1,2})?$/; // same rule as ../api/listings.php
  const images = [];
  const finished = new Set(); // steps the user has completed and moved past
  let currentStep = 1;
  let fulfillment = "meetup";
  let addingPhotos = 0;
  let publishing = false;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const money = (value) => { const n = Number(value || 0); return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`; };
  const icons = {
    close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
    camera: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4v-10Z"></path><circle cx="12" cy="13.5" r="3.2"></circle></svg>`,
    meetup: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="2.7"></circle><circle cx="16.5" cy="9.5" r="2.2"></circle><path d="M3.5 19c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5M13 19c.4-2.5 2-4 4.5-4 2 0 3.3 1.2 3.7 4"></path></svg>`,
    delivery: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>`
  };

  function nav(path) { window.location.href = path; }

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.nav;
      if (target === "home") nav("../index.html");
      if (target === "marketplace") nav("../marketplace/marketplace.html");
      if (target === "favorites") nav("../favorites/favorites.html");
      if (target === "profile") nav("../profile/profile.html");
      if (target === "messages") nav("../messages/messages.html");
    });
  });

  /* ---------- Steps ---------- */

  function setStep(step, { scroll = true } = {}) {
    currentStep = Math.max(1, Math.min(4, step));
    panels.forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.panel) === currentStep));
    renderStepper();
    back.classList.toggle("hidden", currentStep === 1);
    next.textContent = currentStep === 1 ? "Next: Add Photos" : currentStep === 2 ? "Next: Additional Info" : currentStep === 3 ? "Next: Review" : "Publish Item";
    if (currentStep === 2) renderPhotoManager();
    if (currentStep === 3) renderFulfillment();
    if (currentStep === 4) renderReview();
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Finished steps turn green with a check; a line fills in once the step after it is reached.
  // Review only counts as finished once the item is published, and then no step is current.
  function renderStepper() {
    const published = finished.has(4);
    steps.forEach((stepEl) => {
      const n = Number(stepEl.dataset.step);
      const active = !published && n === currentStep;
      const complete = !active && finished.has(n);
      stepEl.classList.toggle("active", active);
      stepEl.classList.toggle("complete", complete);
      if (active) stepEl.setAttribute("aria-current", "step"); else stepEl.removeAttribute("aria-current");
      stepEl.querySelector(".step-state").textContent = active ? ", current step" : complete ? ", completed" : "";
    });
    stepLines.forEach((line, index) => {
      const n = index + 1;
      line.classList.toggle("complete", finished.has(n) && (finished.has(n + 1) || currentStep === n + 1));
    });
  }

  // Moving forward needs the current step to be valid, and that step then counts as finished.
  function goTo(target) {
    if (publishing) return;
    target = Math.max(1, Math.min(4, target));
    if (target === currentStep) return;
    if (target > currentStep) {
      if (!validateStep(currentStep)) return;
      finished.add(currentStep);
    } else if (!validateStep(currentStep, true)) {
      finished.delete(currentStep);
    }
    setStep(target);
  }

  function validateStep(step, silent = false) {
    if (step === 1) return validateDetails(silent);
    if (step === 3) return validateHandoff(silent);
    return true;
  }

  function moneyProblem(text, label) {
    if (!MONEY_PATTERN.test(text)) return `Please enter a valid ${label}, e.g. 450 or 1299.50.`;
    if (Number(text) > MAX_PRICE) return `The ${label} can't be more than ${money(MAX_PRICE)}.`;
    return "";
  }

  // Mirrors the server's checks so mistakes show up here, not after Publish.
  function validateDetails(silent) {
    const name = $("itemName").value.trim().replace(/\s+/g, " ");
    if (name.length < 3) return fail("itemName", name ? "Item name must be at least 3 characters." : "Please enter an item name.", silent);
    if (!categoryInput.value) return fail("category", "Please choose a category.", silent);
    const priceProblem = moneyProblem($("price").value.trim(), "price");
    if (priceProblem) return fail("price", priceProblem, silent);
    return true;
  }

  function validateHandoff(silent) {
    if (fulfillment !== "delivery") return true;
    const fee = $("deliveryFee").value.trim();
    const feeProblem = fee === "" ? "" : moneyProblem(fee, "delivery fee");
    if (feeProblem) return fail("deliveryFee", feeProblem, silent);
    return true;
  }

  function fail(field, message, silent) {
    if (!silent) flagField(field, message);
    return false;
  }

  // Which step each field (and each server error field) lives on.
  const fieldSteps = { itemName: 1, category: 1, condition: 1, price: 1, location: 1, description: 1, photos: 2, deliveryArea: 3, deliveryFee: 3, deliveryPayer: 3, deliveryNotes: 3, meetupLocation: 3, meetupAvailability: 3, meetupSafety: 3 };

  // Shows the step holding the field, marks the field and moves focus to it.
  function flagField(field, message) {
    const step = fieldSteps[field];
    if (step && step !== currentStep) { finished.delete(step); setStep(step, { scroll: false }); }
    const el = field === "category" ? categoryTrigger : field === "photos" ? $("addMorePhotos") : $(field);
    if (el && field !== "photos") el.setAttribute("aria-invalid", "true");
    if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    showFieldMessage(message);
  }

  function showFieldMessage(message) {
    let toast = $("formToast");
    if (!toast) { toast = document.createElement("div"); toast.id = "formToast"; toast.setAttribute("role", "status"); toast.style.cssText = "position:fixed;left:50%;bottom:105px;transform:translateX(-50%);z-index:3000;max-width:calc(100vw - 32px);background:var(--theme-toast, #182033);color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.18)"; document.body.appendChild(toast); }
    toast.textContent = message; clearTimeout(showFieldMessage.timer); showFieldMessage.timer = setTimeout(() => toast.remove(), Math.max(2200, message.length * 60));
  }

  next.addEventListener("click", () => { if (currentStep < 4) goTo(currentStep + 1); else publish(); });
  back.addEventListener("click", () => goTo(currentStep - 1));
  $("previewTop").addEventListener("click", () => goTo(4));
  steps.forEach((step) => step.addEventListener("click", () => goTo(Number(step.dataset.step))));
  form.addEventListener("submit", (event) => event.preventDefault());

  const clearInvalid = (event) => event.target.removeAttribute?.("aria-invalid");
  form.addEventListener("input", clearInvalid);
  form.addEventListener("change", clearInvalid);

  /* ---------- Category picker ---------- */

  const categoryMenu = $("categoryMenu");
  const categoryTrigger = $("categoryTrigger");
  const categoryList = $("categoryOptions");
  const categoryInput = $("category");
  let categoryOptions = [...categoryList.querySelectorAll("[role=option]")];
  const placeholderIcon = $("categoryIcon").innerHTML;
  let activeOption = -1;

  function setCategory(category) {
    const option = categoryOptions.find((o) => o.dataset.value === category);
    categoryInput.value = option ? category : "";
    categoryOptions.forEach((o) => o.setAttribute("aria-selected", String(o === option)));
    $("categoryValue").textContent = option ? category : "Select category";
    $("categoryIcon").innerHTML = option ? option.querySelector(".select-icon").innerHTML : placeholderIcon;
    categoryTrigger.classList.toggle("is-placeholder", !option);
    if (option) categoryTrigger.removeAttribute("aria-invalid");
  }

  function highlightOption(index, reveal = true) {
    activeOption = (index + categoryOptions.length) % categoryOptions.length;
    categoryOptions.forEach((o, i) => o.classList.toggle("active", i === activeOption));
    categoryList.setAttribute("aria-activedescendant", categoryOptions[activeOption].id);
    if (reveal) categoryOptions[activeOption].scrollIntoView({ block: "nearest" });
  }

  function openCategories() {
    categoryList.classList.remove("hidden");
    categoryMenu.classList.add("open");
    categoryTrigger.setAttribute("aria-expanded", "true");
    // Open upward when there isn't room below (e.g. just above the phone's bottom nav).
    const box = categoryTrigger.getBoundingClientRect();
    const navBox = document.querySelector(".bottom-nav")?.getBoundingClientRect();
    const floor = navBox && navBox.top > box.bottom ? navBox.top : window.innerHeight;
    const below = floor - box.bottom - 12;
    const above = box.top - 12;
    const up = below < Math.min(categoryList.scrollHeight, 320) && above > below;
    categoryMenu.classList.toggle("drop-up", up);
    categoryList.style.maxHeight = `${Math.max(160, Math.min(320, up ? above : below))}px`;
    highlightOption(Math.max(0, categoryOptions.findIndex((o) => o.dataset.value === categoryInput.value)));
    categoryList.focus({ preventScroll: true });
  }

  function closeCategories(refocus = true) {
    if (categoryList.classList.contains("hidden")) return;
    categoryList.classList.add("hidden");
    categoryMenu.classList.remove("open");
    categoryTrigger.setAttribute("aria-expanded", "false");
    categoryList.removeAttribute("aria-activedescendant");
    if (refocus) categoryTrigger.focus({ preventScroll: true });
  }

  function chooseCategory(index) { setCategory(categoryOptions[index].dataset.value); closeCategories(); }

  categoryTrigger.addEventListener("click", () => { if (categoryList.classList.contains("hidden")) openCategories(); else closeCategories(); });
  categoryTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); openCategories(); }
  });
  $("categoryLabel").addEventListener("click", () => categoryTrigger.focus());

  categoryList.addEventListener("keydown", (event) => {
    const moves = { ArrowDown: activeOption + 1, ArrowUp: activeOption - 1, Home: 0, End: categoryOptions.length - 1 };
    if (event.key in moves) { event.preventDefault(); highlightOption(moves[event.key]); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseCategory(activeOption); }
    else if (event.key === "Escape") { event.preventDefault(); closeCategories(); }
    else if (event.key === "Tab") closeCategories(); // Tab then continues from the trigger
    else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Type-ahead, like a native select.
      const letter = event.key.toLowerCase();
      for (let offset = 1; offset <= categoryOptions.length; offset++) {
        const index = (activeOption + offset) % categoryOptions.length;
        if (categoryOptions[index].dataset.value.toLowerCase().startsWith(letter)) { highlightOption(index); break; }
      }
    }
  });

  function bindCategoryOptions() {
    categoryOptions.forEach((option, index) => {
      option.addEventListener("click", () => chooseCategory(index));
      option.addEventListener("mousemove", () => { if (activeOption !== index) highlightOption(index, false); });
    });
  }
  bindCategoryOptions();

  // Administrators add and hide categories, so the list comes from the server;
  // the options written in the HTML stay if it can't be reached.
  CampusAuth.api("categories.php").then((data) => {
    if (!data.categories?.length || !window.CategoryIcons) return;
    categoryList.innerHTML = data.categories.map((category) => `
      <li class="select-option" id="category-${escapeHtml(category.slug)}" role="option" data-value="${escapeHtml(category.name)}" aria-selected="false"><span class="select-icon" aria-hidden="true">${CategoryIcons.svg(category.icon)}</span><span>${escapeHtml(category.name)}</span></li>`).join("");
    categoryOptions = [...categoryList.querySelectorAll("[role=option]")];
    bindCategoryOptions();
    setCategory(categoryInput.value);
  }, () => { /* keep the built-in list */ });

  document.addEventListener("pointerdown", (event) => { if (!categoryMenu.contains(event.target)) closeCategories(false); });

  /* ---------- Handoff ---------- */

  function setFulfillment(type) {
    const previous = fulfillment;
    fulfillment = type === "delivery" ? "delivery" : "meetup";
    // Different handoff details now apply, so Additional Info needs another look.
    if (fulfillment !== previous) finished.delete(3);
    document.querySelectorAll("[data-fulfillment]").forEach((button) => {
      const selected = button.dataset.fulfillment === fulfillment;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderFulfillment();
    renderStepper();
  }

  document.querySelectorAll("[data-fulfillment]").forEach((button) => {
    button.addEventListener("click", () => setFulfillment(button.dataset.fulfillment));
  });

  function renderFulfillment() {
    const delivery = fulfillment === "delivery";
    deliveryFields.classList.toggle("hidden", !delivery); meetupFields.classList.toggle("hidden", delivery);
    fulfillmentSummary.innerHTML = delivery
      ? `<div class="info-icon">${icons.delivery}</div><div><strong>Delivery selected</strong><p>Buyers will see your delivery area, fee and payment responsibility.</p></div>`
      : `<div class="info-icon">${icons.meetup}</div><div><strong>Meet in Person selected</strong><p>Buyers will arrange a safe campus handoff with you.</p></div>`;
  }

  $("description").addEventListener("input", (event) => { $("descriptionCount").textContent = `${event.target.value.length}/500`; });

  /* ---------- Photos ---------- */

  function openPhotoPicker() {
    if (images.length >= MAX_PHOTOS) { showFieldMessage(`You can add up to ${MAX_PHOTOS} photos. Remove one to add another.`); return; }
    photoInput.click();
  }

  // One delegated handler per area, so a click never opens the file picker twice.
  function onPhotoAreaClick(event) {
    const remove = event.target.closest(".remove-photo");
    if (remove) { removeImage(Number(remove.dataset.index)); return; }
    if (event.target.closest("button.photo-slot, button.manager-slot")) openPhotoPicker();
  }
  photoStrip.addEventListener("click", onPhotoAreaClick);
  photoManager.addEventListener("click", onPhotoAreaClick);
  $("addMorePhotos").addEventListener("click", openPhotoPicker);
  $("uploadBox").addEventListener("click", (event) => { if (!event.target.closest("button")) openPhotoPicker(); });

  photoInput.addEventListener("change", async (event) => {
    const picked = [...event.target.files];
    photoInput.value = "";
    if (!picked.length) return;
    const room = MAX_PHOTOS - images.length;
    let skipped = 0;
    addingPhotos++;
    try {
      for (const file of picked.slice(0, room)) {
        const dataUrl = await compressImage(file);
        if (!dataUrl) skipped++;
        else if (images.length < MAX_PHOTOS) images.push(dataUrl);
      }
    } finally {
      addingPhotos--;
    }
    const notes = [];
    if (skipped) notes.push(skipped === 1 ? "That file is not a supported image." : `${skipped} files are not supported images.`);
    if (picked.length > room) { const extra = picked.length - room; notes.push(`Only ${MAX_PHOTOS} photos are allowed, so ${extra} ${extra === 1 ? "photo was" : "photos were"} not added.`); }
    if (notes.length) showFieldMessage(notes.join(" "));
    renderPhotoStrip();
    renderPhotoManager();
  });

  async function compressImage(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      image.onload = () => {
        const max = 1400; const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
        const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); resolve(canvas.toDataURL("image/jpeg", .82));
      };
      image.src = url;
    });
  }

  function removeImage(index) { images.splice(index, 1); renderPhotoStrip(); renderPhotoManager(); }

  function photoTile(image, index) {
    return `<img src="${image}" alt="Photo ${index + 1}">${index === 0 ? `<span class="cover-badge">Cover</span>` : ""}<button class="remove-photo" type="button" data-index="${index}" aria-label="Remove photo ${index + 1}">${icons.close}</button>`;
  }

  // Filled slots are plain boxes (no button inside a button); the first empty slot is the "Add Photo" one.
  function renderPhotoStrip() {
    photoStrip.innerHTML = Array.from({ length: MAX_PHOTOS }, (_, index) => {
      if (images[index]) return `<div class="photo-slot filled">${photoTile(images[index], index)}</div>`;
      if (index === images.length) return `<button class="photo-slot add-photo-slot" type="button" aria-label="Add photo"><span class="camera-icon">${icons.camera}</span><span class="add-photo-text">Add Photo</span><span class="photo-plus" aria-hidden="true">+</span></button>`;
      return `<button class="photo-slot empty-photo" type="button" aria-label="Add photo"><span aria-hidden="true">+</span></button>`;
    }).join("");
  }

  function renderPhotoManager() {
    photoManager.innerHTML = Array.from({ length: MAX_PHOTOS }, (_, index) => images[index]
      ? `<div class="manager-slot">${photoTile(images[index], index)}</div>`
      : `<button class="manager-slot empty" type="button" aria-label="Add photo"><span aria-hidden="true">+</span></button>`).join("");
  }

  /* ---------- Review & publish ---------- */

  function value(id, fallback = "") { return $(id)?.value?.trim() || fallback; }

  // Photo (data URL from compressImage) → file for the upload.
  function dataUrlToBlob(dataUrl) {
    const [meta, data] = dataUrl.split(",");
    const type = (meta.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
    const bytes = atob(data);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
    return new Blob([buffer], { type });
  }

  // Everything the server needs to create the listing (../api/listings.php).
  function listingForm() {
    const form = new FormData();
    form.append("action", "create");
    form.append("name", value("itemName"));
    form.append("price", value("price", "0"));
    form.append("category", value("category", "Others"));
    form.append("condition", value("condition", "Used - Good"));
    form.append("location", value("location", "Other campus location"));
    form.append("description", $("description").value);
    form.append("fulfillment", fulfillment);
    if (fulfillment === "delivery") {
      form.append("deliveryArea", value("deliveryArea", "Within campus"));
      form.append("deliveryFee", value("deliveryFee", "0"));
      form.append("deliveryPayer", value("deliveryPayer", "buyer"));
      form.append("deliveryNotes", $("deliveryNotes")?.value || "");
    } else {
      form.append("meetupLocation", value("meetupLocation", value("location", "")));
      form.append("meetupAvailability", value("meetupAvailability", "Flexible"));
      form.append("meetupSafety", value("meetupSafety", "Public campus location"));
    }
    images.forEach((image, index) => form.append("photos[]", dataUrlToBlob(image), `photo-${index + 1}.jpg`));
    return form;
  }

  function renderReview() {
    $("reviewName").textContent = value("itemName", "Untitled item"); $("reviewPrice").textContent = money(value("price", "0"));
    $("reviewMeta").textContent = `${value("category", "Others")} · ${value("condition", "Used - Good")} · ${value("location", "Campus")}`;
    $("reviewDescription").textContent = value("description", "No description provided.");
    const cover = $("reviewCover"); cover.innerHTML = images[0] ? `<img src="${images[0]}" alt="${escapeHtml(value("itemName"))}">` : `<span>No photo</span>`;
    const details = $("reviewDetails"); const fulfillmentText = fulfillment === "delivery" ? `Delivery · ${value("deliveryArea", "Within campus")}` : `Meet in Person · ${value("meetupLocation", "Campus")}`;
    const payer = $("deliveryPayer").selectedOptions[0]?.textContent || "Buyer pays";
    const feeText = fulfillment === "delivery" ? `${money(value("deliveryFee", "0"))} · ${payer}` : value("meetupAvailability", "Flexible");
    details.innerHTML = `<div class="review-item"><span>Photos</span><strong>${images.length}/${MAX_PHOTOS}</strong></div><div class="review-item"><span>Handoff</span><strong>${escapeHtml(fulfillmentText)}</strong></div><div class="review-item"><span>Fee / availability</span><strong>${escapeHtml(feeText)}</strong></div>`;
  }

  // Saved in the database, so every student sees it in the Marketplace.
  async function publish() {
    if (publishing) return;
    if (addingPhotos) { showFieldMessage("Your photos are still being added. Please wait a moment."); return; }
    if (!validateStep(1) || !validateStep(3)) return;
    publishing = true;
    next.disabled = true;
    next.textContent = "Publishing…";

    let result;
    try {
      result = await CampusCatalog.create(listingForm());
    } catch (error) {
      publishing = false;
      next.disabled = false;
      next.textContent = "Publish Item";
      if (error.status === 401) {
        window.location.href = CampusAuth.loginUrl("post");
        return;
      }
      if (fieldSteps[error.field]) flagField(error.field, error.message);
      else showFieldMessage(error.message);
      return;
    }

    finished.add(4);
    renderStepper();
    // When administrators review new listings first, say so instead of "now live".
    const inReview = result?.item?.status === "pending";
    $("successTitle").textContent = inReview ? "Submitted for Review" : "Item Posted!";
    $("successText").textContent = inReview
      ? "An administrator will check your listing. It appears in the Marketplace once it's approved."
      : "Your listing has been saved. Buyers can now find it in the Marketplace.";
    successOverlay.classList.remove("hidden");
    $("viewMarketplace").focus();
    document.querySelectorAll(".bottom-nav .nav-item, .bottom-nav .sell-button").forEach((b) => b.disabled = true);
  }

  // "Post Another Item": start over with an empty form.
  function resetForm() {
    form.reset();
    images.length = 0;
    finished.clear();
    setCategory("");
    setFulfillment("meetup");
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    $("descriptionCount").textContent = "0/500";
    renderPhotoStrip();
    renderPhotoManager();
    publishing = false;
    next.disabled = false;
    successOverlay.classList.add("hidden");
    document.querySelectorAll(".bottom-nav .nav-item, .bottom-nav .sell-button").forEach((b) => b.disabled = false);
    setStep(1);
    $("itemName").focus({ preventScroll: true });
  }

  $("viewMarketplace").addEventListener("click", () => nav("../marketplace/marketplace.html"));
  $("postAnother").addEventListener("click", resetForm);

  setCategory(categoryInput.value);
  $("descriptionCount").textContent = `${$("description").value.length}/500`;
  renderPhotoStrip(); setFulfillment("meetup"); setStep(1, { scroll: false });
});
