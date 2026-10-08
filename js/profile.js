document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const toast = $("#toast");
  const modalBackdrop = $("#modalBackdrop");
  const modalTitle = $("#modalTitle");
  const modalKicker = $("#modalKicker");
  const modalIcon = $("#modalIcon");
  const modalBody = $("#modalBody");
  const modalActions = $("#modalActions");
  const avatar = $("#avatar");
  const avatarInput = $("#avatarInput");

  const safeJSON = (key, fallback = []) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  // The logged-in account (this page requires login, see auth.js).
  const account = CampusAuth.user || {};
  const key = CampusAuth.storageKey;

  const favoritesKey = key("campusMarketplaceFavorites");
  const profileImageKey = key("campusMarketplaceProfileImage");

  const favorites = safeJSON(favoritesKey, []);
  let name = account.name || "Campus Student";
  let email = account.email || "";
  let campusLocation = account.campus || "Main Campus";
  const studentId = account.studentId || "";
  const joinDate = account.joined || "";
  // Purchase requests sent from the Marketplace cart.
  const orders = safeJSON(key("campusMarketplaceOrders"), []);
  const bought = orders.length;
  const storedProfileImage = localStorage.getItem(profileImageKey) || "";

  // My listings live in the database, like everyone else's (../products.js).
  let myListings = [];
  const isSold = (item) => String(item.status || "").toLowerCase() === "sold";
  // Pending = waiting for an administrator; removed = taken down by one. Neither can be toggled here.
  const STATUS_LABELS = { available: "Available", sold: "Sold", pending: "Pending review", removed: "Removed by admin" };
  const listingStatus = (item) => (STATUS_LABELS[item.status] ? item.status : "available");
  const soldCount = () => myListings.filter(isSold).length;
  const listingsReady = CampusCatalog.mine().then(
    (items) => { myListings = items; $("#soldCount").textContent = soldCount(); },
    (error) => showToast(error.message)
  );

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CS";

  renderProfile();
  avatar.textContent = storedProfileImage ? "" : initials;
  $("#boughtCount").textContent = bought;
  $("#soldCount").textContent = "0";
  $("#favoriteCount").textContent = favorites.length;
  $("#messageCount").textContent = "0";

  // Conversations come from the server (real messages between accounts).
  let conversations = 0;
  CampusAuth.api("messages.php").then((data) => {
    conversations = data.conversations.length;
    $("#messageCount").textContent = conversations;
  }, () => { /* keep 0 if messages can't load */ });

  if (storedProfileImage) applyAvatar(storedProfileImage);

  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function applyAvatar(imageData) {
    avatar.style.backgroundImage = `url("${imageData.replace(/"/g, "\\\"")}")`;
    avatar.style.fontSize = "0";
    avatar.setAttribute("aria-label", "Profile photo");
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function openModal({ title, kicker = "NORSU CAMPUS MARKETPLACE", icon = "✓", body = "", actions = [] }) {
    modalTitle.textContent = title;
    modalKicker.textContent = kicker;
    modalIcon.textContent = icon;
    modalBody.innerHTML = body;
    modalActions.innerHTML = "";

    actions.forEach(({ label, primary = false, onClick }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `modal-action${primary ? " primary" : ""}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        if (onClick) onClick();
        else closeModal();
      });
      modalActions.appendChild(button);
    });

    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function getInitials(value) {
    return String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CS";
  }

  function renderProfile() {
    $("#profileName").textContent = name;
    $("#profileEmail").textContent = email;
    $("#profileLocation").textContent = campusLocation;
    $("#joinDate").textContent = joinDate;
    if (!storedProfileImage) avatar.textContent = getInitials(name);
  }

  async function openListingsModal() {
    await listingsReady;

    if (!myListings.length) {
      openModal({
        title: "My Listings",
        kicker: "SELLER CENTER",
        icon: "+",
        body: `<div class="empty-listings"><strong>You have no listings yet.</strong><p>Items you post appear here and in the Marketplace for every student.</p></div>`,
        actions: [{ label: "Post an Item", primary: true, onClick: () => navigate("post") }, { label: "Close" }]
      });
      return;
    }

    const listingMarkup = myListings.map((item) => {
      const sold = isSold(item);
      const status = listingStatus(item);
      const canToggle = status === "available" || status === "sold";
      return `
        <article class="listing-manager-item" data-listing-id="${escapeHTML(item.id)}">
          <img src="${escapeHTML(item.image || "")}" alt="${escapeHTML(item.name || "Listing")}" class="listing-manager-image">
          <div class="listing-manager-info">
            <strong>${escapeHTML(item.name || "Untitled item")}</strong>
            <span>${escapeHTML(money(Number(item.price) || 0))} · ${escapeHTML(item.category || "Others")} · ${Number(item.views || 0)} views</span>
            <small class="listing-status ${status}">${STATUS_LABELS[status]}</small>
          </div>
          <div class="listing-manager-actions">
            ${canToggle ? `<button class="listing-status-button" data-toggle-listing="${escapeHTML(item.id)}" type="button">${sold ? "Mark available" : "Mark sold"}</button>` : ""}
            <button class="listing-delete-button" data-delete-listing="${escapeHTML(item.id)}" type="button">Remove</button>
          </div>
        </article>`;
    }).join("");

    openModal({
      title: "My Listings",
      kicker: "SELLER CENTER",
      icon: "+",
      body: `<p class="listings-intro">Every student can see these in the Marketplace. Mark an item sold once it's gone, or remove it.</p><div class="listing-manager-list">${listingMarkup}</div>`,
      actions: [{ label: "Close", primary: true }]
    });

    const findListing = (id) => myListings.find((item) => String(item.id) === String(id));

    modalBody.querySelectorAll("[data-toggle-listing]").forEach((button) => {
      button.addEventListener("click", async () => {
        const listing = findListing(button.dataset.toggleListing);
        if (!listing) return;
        button.disabled = true;
        try {
          const data = await CampusCatalog.setStatus(listing.id, isSold(listing) ? "available" : "sold");
          listing.status = data.item.status;
          $("#soldCount").textContent = soldCount();
          showToast(data.message);
          openListingsModal();
        } catch (error) {
          button.disabled = false;
          showToast(error.message);
        }
      });
    });

    modalBody.querySelectorAll("[data-delete-listing]").forEach((button) => {
      button.addEventListener("click", async () => {
        const listing = findListing(button.dataset.deleteListing);
        if (!listing) return;
        if (!window.confirm(`Remove "${listing.name || "this listing"}" from the Marketplace?`)) return;

        button.disabled = true;
        try {
          const data = await CampusCatalog.remove(listing.id);
          myListings = myListings.filter((item) => item !== listing);

          const updatedFavorites = safeJSON(favoritesKey, []).filter((id) => String(id) !== String(listing.id));
          localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
          $("#favoriteCount").textContent = updatedFavorites.length;
          $("#soldCount").textContent = soldCount();

          showToast(data.message || "Listing removed from the Marketplace.");
          openListingsModal();
        } catch (error) {
          button.disabled = false;
          showToast(error.message);
        }
      });
    });
  }

  function openOrdersModal() {
    if (!orders.length) {
      openModal({
        title: "Items Bought",
        kicker: "PURCHASES",
        icon: "🛒",
        body: `<div class="empty-listings"><strong>No purchase requests yet.</strong><p>Add items to your cart in the Marketplace and press Continue to send the seller a purchase request.</p></div>`,
        actions: [{ label: "Browse Marketplace", primary: true, onClick: () => navigate("marketplace") }, { label: "Close" }]
      });
      return;
    }

    const rows = orders.map((order) => {
      const date = new Date(order.requestedAt);
      const when = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `<li><span>${escapeHTML(order.name)}</span><b>${escapeHTML(money(order.price))} · ${escapeHTML(order.seller)}${when ? ` · ${escapeHTML(when)}` : ""}</b></li>`;
    }).join("");

    openModal({
      title: "Items Bought",
      kicker: "PURCHASES",
      icon: "🛒",
      body: `<p>Purchase requests you sent. Arrange payment and the meetup with each seller in Messages.</p><ul class="info-list">${rows}</ul>`,
      actions: [{ label: "Open Messages", primary: true, onClick: () => navigate("messages") }, { label: "Close" }]
    });
  }

  function money(value) {
    return `₱${Number(value || 0).toLocaleString("en-PH")}`;
  }

  function openIdModal() {
    openModal({
      title: "Verified Student ID",
      kicker: "STUDENT VERIFICATION",
      icon: "✓",
      body: `
        <p>Your student account is verified for NORSU Campus Marketplace.</p>
        <ul class="info-list">
          <li><span>Student</span><b>${escapeHTML(name)}</b></li>
          <li><span>Student ID</span><b>${escapeHTML(studentId)}</b></li>
          <li><span>Email</span><b>${escapeHTML(email)}</b></li>
          <li><span>Campus</span><b>${escapeHTML(campusLocation)}</b></li>
          <li><span>Status</span><b>Verified</b></li>
        </ul>
      `,
      actions: [{ label: "Close", primary: true }]
    });
  }

  function openEditModal() {
    openModal({
      title: "Edit Profile",
      kicker: "PERSONAL INFORMATION",
      icon: "✎",
      body: `
        <form class="profile-edit-form" id="profileEditForm">
          <label>
            <span>Full Name</span>
            <input id="editProfileName" type="text" minlength="2" maxlength="80" value="${escapeHTML(name)}" autocomplete="name" required>
          </label>
          <label>
            <span>Student Email</span>
            <input id="editProfileEmail" type="email" maxlength="120" value="${escapeHTML(email)}" autocomplete="email" required>
          </label>
          <label>
            <span>Campus / Location</span>
            <input id="editProfileLocation" type="text" maxlength="80" value="${escapeHTML(campusLocation)}" placeholder="e.g. Main Campus">
          </label>
          <div class="profile-edit-note">
            <strong>Joined</strong>
            <span>${escapeHTML(joinDate)} · Your join date cannot be changed.</span>
          </div>
        </form>
      `,
      actions: [
        { label: "Cancel" },
        {
          label: "Save Changes",
          primary: true,
          onClick: async () => {
            const form = $("#profileEditForm");
            if (!form || !form.reportValidity()) return;

            const saveButton = modalActions.querySelector(".modal-action.primary");
            saveButton.disabled = true;
            saveButton.textContent = "Saving…";

            try {
              // Saved to the account on the server, not just this browser.
              const data = await CampusAuth.updateProfile({
                name: $("#editProfileName").value.trim(),
                email: $("#editProfileEmail").value.trim(),
                campus: $("#editProfileLocation").value.trim()
              });

              name = data.user.name;
              email = data.user.email;
              campusLocation = data.user.campus;

              renderProfile();
              closeModal();
              showToast(data.message || "Profile updated.");
            } catch (error) {
              saveButton.disabled = false;
              saveButton.textContent = "Save Changes";
              showToast(error.message);
            }
          }
        }
      ]
    });
  }

  function openAction(action) {
    if (action === "favorites") {
      navigate("favorites");
      return;
    }

    if (action === "bought") {
      openOrdersModal();
      return;
    }

    if (action === "messages") {
      navigate("messages");
      return;
    }

    if (action === "listings") {
      openListingsModal();
      return;
    }

    const data = {
      sold: ["Sold Items", "SELLER CENTER", "□", `You currently have <strong>${soldCount()}</strong> sold item(s). Mark items sold from My Listings.`],
      analytics: ["Sales Analytics", "SELLER CENTER", "↗", "Sales analytics can use your listing history to display revenue, completed sales, and performance trends."],
      personal: ["Personal Information", "ACCOUNT", "◎", "Your name, student email, campus location, and join date are saved to your NORSU Campus Marketplace account. Use Edit Profile to change them."],
      verification: ["Verification", "ACCOUNT", "✓", "Your student verification is active. Use View ID above to preview the verification card."],
      security: ["Security", "ACCOUNT", "◇", "Password and security controls are ready to connect to the authentication flow."],
      notifications: ["Notifications", "ACCOUNT", "♧", "Notification preferences are ready to connect to the marketplace notification system."]
    };

    const [title, kicker, icon, copy] = data[action] || [
      "Coming Next",
      "NORSU CAMPUS MARKETPLACE",
      "•",
      "This section is ready to be connected to the next prototype page."
    ];

    openModal({
      title,
      kicker,
      icon,
      body: `<p>${copy}</p>`,
      actions: [{ label: "Close", primary: true }]
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character]));
  }

  function navigate(target) {
    const routes = {
      home: "../index.html",
      marketplace: "../marketplace/marketplace.html",
      favorites: "../favorites/favorites.html",
      messages: "../messages/messages.html",
      post: "../post-item/post-item.html",
      profile: "profile.html"
    };
    if (routes[target]) window.location.href = routes[target];
  }

  // Header / profile controls
  $("#editProfileButton").addEventListener("click", openEditModal);
  $("#viewId").addEventListener("click", openIdModal);
  $("#avatarButton").addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }

    // Shrink to a small square-ish JPEG so phone photos fit in browser storage.
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => {
      URL.revokeObjectURL(url);
      avatarInput.value = "";
      showToast("That image could not be opened. Try a JPG or PNG.");
    };
    image.onload = () => {
      const scale = Math.min(1, 320 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      avatarInput.value = "";

      const imageData = canvas.toDataURL("image/jpeg", 0.85);
      try {
        localStorage.setItem(profileImageKey, imageData);
        applyAvatar(imageData);
        showToast("Profile photo updated.");
      } catch {
        showToast("Not enough space in this browser to save the photo.");
      }
    };
    image.src = url;
  });

  // Activity and account rows
  $$('[data-action]').forEach((button) => {
    button.addEventListener("click", () => openAction(button.dataset.action));
  });

  // Shared bottom navigation — all five controls work from Profile.
  $$('[data-nav]').forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  // Modal behavior
  $("#modalClose").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
  });

  // Sign out
  $("#signOut").addEventListener("click", async () => {
    const confirmed = window.confirm("Sign out of NORSU Campus Marketplace?");
    if (!confirmed) return;

    try {
      await CampusAuth.logout();
    } catch (error) {
      showToast(error.message);
      return;
    }

    showToast("Signed out. Returning to login…");

    setTimeout(() => {
      window.location.replace("../login/login.html?reason=signedout");
    }, 650);
  });

  // Home → profile menu → My Listings opens the list straight away.
  if (new URLSearchParams(window.location.search).get("open") === "listings") {
    openListingsModal();
    history.replaceState(null, "", window.location.pathname);
  }
});
