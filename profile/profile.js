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

  const listings = safeJSON("campusMarketplaceUserListings", []);
  const favorites = safeJSON("campusMarketplaceFavorites", []);
  const name = localStorage.getItem("campusMarketplaceName") || "Campus Student";
  const email = localStorage.getItem("campusMarketplaceUser") || "student@campus.edu";
  const campusLocation = localStorage.getItem("campusMarketplaceLocation") || "Campus";
  const joinDate = localStorage.getItem("campusMarketplaceJoinDate") || "May 2024";
  const bought = Number(localStorage.getItem("campusMarketplaceBoughtCount") || 0);
  const messages = Number(localStorage.getItem("campusMarketplaceMessageCount") || 0);
  const storedProfileImage = localStorage.getItem("campusMarketplaceProfileImage") || "";

  const soldCount = listings.filter(
    (item) => String(item.status || "").toLowerCase() === "sold"
  ).length;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CS";

  $("#profileName").textContent = name;
  $("#profileEmail").textContent = email;
  $("#profileLocation").textContent = campusLocation;
  $("#joinDate").textContent = joinDate;
  avatar.textContent = initials;
  $("#boughtCount").textContent = bought;
  $("#soldCount").textContent = soldCount;
  $("#favoriteCount").textContent = favorites.length;
  $("#messageCount").textContent = messages;

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

  function openModal({ title, kicker = "CAMPUS MARKETPLACE", icon = "✓", body = "", actions = [] }) {
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

  function openIdModal() {
    openModal({
      title: "Verified Student ID",
      kicker: "STUDENT VERIFICATION",
      icon: "✓",
      body: `
        <p>Your student account is verified for this Campus Marketplace prototype.</p>
        <ul class="info-list">
          <li><span>Student</span><b>${escapeHTML(name)}</b></li>
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
        <p>These details are currently loaded from this browser's local storage.</p>
        <ul class="info-list">
          <li><span>Name</span><b>${escapeHTML(name)}</b></li>
          <li><span>Email</span><b>${escapeHTML(email)}</b></li>
          <li><span>Location</span><b>${escapeHTML(campusLocation)}</b></li>
          <li><span>Joined</span><b>${escapeHTML(joinDate)}</b></li>
        </ul>
      `,
      actions: [{ label: "Close", primary: true }]
    });
  }

  function openSettingsModal() {
    openModal({
      title: "Profile Settings",
      kicker: "ACCOUNT PREFERENCES",
      icon: "⚙",
      body: `
        <p>Profile preferences for the current prototype.</p>
        <ul class="info-list">
          <li><span>Student verification</span><b>Active</b></li>
          <li><span>Profile visibility</span><b>Campus</b></li>
          <li><span>Notifications</span><b>Enabled</b></li>
        </ul>
      `,
      actions: [{ label: "Close", primary: true }]
    });
  }

  function openAction(action) {
    if (action === "favorites") {
      navigate("favorites");
      return;
    }

    if (action === "bought") {
      showToast(bought ? `${bought} item(s) recorded as bought.` : "No purchases recorded yet.");
      return;
    }

    if (action === "messages") {
      showToast(messages ? `${messages} message(s) in your inbox.` : "No messages recorded yet.");
      return;
    }

    const data = {
      listings: ["My Listings", "SELLER CENTER", "+", "Your posted items are stored in this prototype. This action is ready to connect to a dedicated listings page."] ,
      sold: ["Sold Items", "SELLER CENTER", "□", `You currently have <strong>${soldCount}</strong> recorded sold item(s).`],
      analytics: ["Sales Analytics", "SELLER CENTER", "↗", "Sales analytics can use your listing history to display revenue, completed sales, and performance trends."],
      personal: ["Personal Information", "ACCOUNT", "◎", "Your name, student email, campus location, and join date are currently read from local storage."],
      verification: ["Verification", "ACCOUNT", "✓", "Your student verification is active. Use View ID above to preview the verification card."],
      security: ["Security", "ACCOUNT", "◇", "Password and security controls are ready to connect to the authentication flow."],
      notifications: ["Notifications", "ACCOUNT", "♧", "Notification preferences are ready to connect to the marketplace notification system."]
    };

    const [title, kicker, icon, copy] = data[action] || [
      "Coming Next",
      "CAMPUS MARKETPLACE",
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
      post: "../post-item/post-item.html",
      profile: "profile.html"
    };
    if (routes[target]) window.location.href = routes[target];
  }

  // Header / profile controls
  $("#settingsButton").addEventListener("click", openSettingsModal);
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

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || "");
      try {
        localStorage.setItem("campusMarketplaceProfileImage", imageData);
        applyAvatar(imageData);
        showToast("Profile photo updated.");
      } catch {
        showToast("The image is too large to save in this browser.");
      }
    };
    reader.readAsDataURL(file);
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
  $("#signOut").addEventListener("click", () => {
    const confirmed = window.confirm("Sign out of Campus Marketplace?");
    if (!confirmed) return;

    localStorage.removeItem("campusMarketplaceLoggedIn");
    localStorage.removeItem("campusMarketplaceName");
    localStorage.removeItem("campusMarketplaceUser");
    showToast("Signed out. Returning to login…");

    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 650);
  });
});
