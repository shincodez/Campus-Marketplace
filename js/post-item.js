document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll(".form-step")];
  const steps = [...document.querySelectorAll(".step")];
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
  const images = [];
  let currentStep = 1;
  let fulfillment = "meetup";
  let objectUrls = [];

  const fallbackImage = (category) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f4f8"/><text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="42" font-weight="700" fill="#1457d9">${escapeHtml(category || "Campus Item")}</text></svg>`)}`;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH")}`;

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

  function setStep(step) {
    currentStep = Math.max(1, Math.min(4, step));
    panels.forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.panel) === currentStep));
    steps.forEach((stepEl) => {
      const n = Number(stepEl.dataset.step);
      stepEl.classList.toggle("active", n === currentStep);
      stepEl.classList.toggle("complete", n < currentStep);
    });
    back.classList.toggle("hidden", currentStep === 1);
    next.textContent = currentStep === 1 ? "Next: Add Photos" : currentStep === 2 ? "Next: Additional Info" : currentStep === 3 ? "Next: Review" : "Publish Item";
    if (currentStep === 2) renderPhotoManager();
    if (currentStep === 3) renderFulfillment();
    if (currentStep === 4) renderReview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep1() {
    const name = $("itemName").value.trim();
    const priceText = $("price").value.trim();
    const price = Number(priceText);
    if (!name) { $("itemName").focus(); showFieldMessage("Please enter an item name."); return false; }
    if (priceText === "" || !Number.isFinite(price) || price < 0) { $("price").focus(); showFieldMessage("Please enter a valid price."); return false; }
    return true;
  }

  function showFieldMessage(message) {
    let toast = $("formToast");
    if (!toast) { toast = document.createElement("div"); toast.id = "formToast"; toast.style.cssText = "position:fixed;left:50%;bottom:105px;transform:translateX(-50%);z-index:3000;background:#182033;color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.18)"; document.body.appendChild(toast); }
    toast.textContent = message; clearTimeout(showFieldMessage.timer); showFieldMessage.timer = setTimeout(() => toast.remove(), Math.max(2200, message.length * 60));
  }

  next.addEventListener("click", () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 4) { setStep(currentStep + 1); return; }
    publish();
  });
  back.addEventListener("click", () => setStep(currentStep - 1));

  $("previewTop").addEventListener("click", () => { if (validateStep1()) setStep(4); });
  steps.forEach((step) => step.addEventListener("click", () => {
    const target = Number(step.dataset.step);
    if (target <= currentStep) setStep(target);
    else if (target === 4 && validateStep1()) setStep(4);
  }));

  document.querySelectorAll("[data-fulfillment]").forEach((button) => {
    button.addEventListener("click", () => {
      fulfillment = button.dataset.fulfillment;
      document.querySelectorAll("[data-fulfillment]").forEach((b) => b.classList.toggle("selected", b === button));
      renderFulfillment();
    });
  });

  $("description").addEventListener("input", (event) => { $("descriptionCount").textContent = `${event.target.value.length}/500`; });

  document.querySelectorAll(".photo-slot").forEach((slot) => slot.addEventListener("click", () => photoInput.click()));
  $("addMorePhotos").addEventListener("click", () => photoInput.click());
  $("uploadBox").addEventListener("click", (event) => { if (event.target.closest("button")) return; photoInput.click(); });

  photoInput.addEventListener("change", async (event) => {
    const files = [...event.target.files].slice(0, 5 - images.length);
    let skipped = 0;
    for (const file of files) {
      const dataUrl = await compressImage(file);
      if (dataUrl) images.push(dataUrl); else skipped++;
    }
    if (skipped) showFieldMessage(skipped === 1 ? "That file is not a supported image." : `${skipped} files are not supported images.`);
    photoInput.value = "";
    renderPhotoStrip();
    renderPhotoManager();
  });

  async function compressImage(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file); objectUrls.push(url);
      const image = new Image();
      image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      image.onload = () => {
        const max = 1400; const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); resolve(canvas.toDataURL("image/jpeg", .82));
      };
      image.src = url;
    });
  }

  function removeImage(index) { images.splice(index, 1); renderPhotoStrip(); renderPhotoManager(); }

  function renderPhotoStrip() {
    [...photoStrip.querySelectorAll(".photo-slot")].forEach((slot, index) => {
      const existing = slot.querySelector("img"); const image = images[index];
      if (existing) existing.remove();
      slot.querySelectorAll(".remove-photo").forEach((el) => el.remove());
      if (image) {
        slot.classList.remove("add-photo-slot", "empty-photo"); slot.innerHTML = `<img src="${image}" alt="Photo ${index + 1}"><button class="remove-photo" type="button" aria-label="Remove photo">×</button>`;
        slot.querySelector(".remove-photo").addEventListener("click", (event) => { event.stopPropagation(); removeImage(index); });
      } else if (index === 0) {
        slot.className = "photo-slot add-photo-slot"; slot.innerHTML = `<span class="camera-icon"><svg viewBox="0 0 24 24"><path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4v-10Z"></path><circle cx="12" cy="13.5" r="3.2"></circle></svg></span><span class="add-photo-text">Add Photo</span><span class="photo-plus">+</span>`;
      } else {
        slot.className = `photo-slot empty-photo${index === 4 ? " desktop-extra" : ""}`; slot.innerHTML = `<span>+</span>`;
      }
      slot.onclick = () => photoInput.click();
    });
  }

  function renderPhotoManager() {
    photoManager.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const slot = document.createElement("div"); slot.className = `manager-slot${images[i] ? "" : " empty"}`;
      if (images[i]) slot.innerHTML = `<img src="${images[i]}" alt="Photo ${i + 1}"><button class="remove-photo" type="button" aria-label="Remove photo">×</button>`;
      else slot.innerHTML = "+";
      if (images[i]) slot.querySelector("button").addEventListener("click", () => removeImage(i)); else slot.addEventListener("click", () => photoInput.click());
      photoManager.appendChild(slot);
    }
  }

  function renderFulfillment() {
    const delivery = fulfillment === "delivery";
    deliveryFields.classList.toggle("hidden", !delivery); meetupFields.classList.toggle("hidden", delivery);
    fulfillmentSummary.innerHTML = delivery
      ? `<div class="info-icon">↗</div><div><strong>Delivery selected</strong><p>Buyers will see your delivery area, fee and payment responsibility.</p></div>`
      : `<div class="info-icon">⌖</div><div><strong>Meet in Person selected</strong><p>Buyers will arrange a safe campus handoff with you.</p></div>`;
  }

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
    const feeText = fulfillment === "delivery" ? `${money(value("deliveryFee", "0"))} · ${value("deliveryPayer", "buyer").replace(/^./, c => c.toUpperCase())}` : value("meetupAvailability", "Flexible");
    details.innerHTML = `<div class="review-item"><span>Photos</span><strong>${images.length}/5</strong></div><div class="review-item"><span>Handoff</span><strong>${escapeHtml(fulfillmentText)}</strong></div><div class="review-item"><span>Fee / availability</span><strong>${escapeHtml(feeText)}</strong></div>`;
  }

  // Saved in the database, so every student sees it in the Marketplace.
  let publishing = false;
  async function publish() {
    if (publishing) return;
    publishing = true;
    next.disabled = true;
    next.textContent = "Publishing…";

    try {
      await CampusCatalog.create(listingForm());
    } catch (error) {
      publishing = false;
      next.disabled = false;
      next.textContent = "Publish Item";
      if (error.status === 401) {
        window.location.href = CampusAuth.loginUrl("post");
        return;
      }
      showFieldMessage(error.message);
      return;
    }

    successOverlay.classList.remove("hidden");
    $("viewMarketplace").onclick = () => nav("../marketplace/marketplace.html");
    $("postAnother").onclick = () => window.location.reload();
    document.querySelectorAll(".bottom-nav .nav-item, .bottom-nav .sell-button").forEach((b) => b.disabled = true);
  }

  window.addEventListener("beforeunload", () => objectUrls.forEach(URL.revokeObjectURL));
  renderPhotoStrip(); renderFulfillment(); setStep(1);
});
