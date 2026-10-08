/* =========================================================
   NORSU CAMPUS MARKETPLACE — MESSAGES
   Real conversations between student accounts
   (../api/messages.php). Opens straight into a chat when
   the page is linked with ?to=<seller>&item=<item name>.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const layout = $("messagesLayout");
  const list = $("conversationList");
  const listEmpty = $("conversationEmpty");
  const search = $("conversationSearch");
  const placeholder = $("threadPlaceholder");
  const thread = $("thread");
  const messageList = $("messageList");
  const composer = $("composer");
  const input = $("messageInput");
  const sendButton = $("sendButton");
  const itemChip = $("itemChip");
  const toast = $("toast");

  const params = new URLSearchParams(window.location.search);
  // Wide screens show the list and the chat side by side. Narrower ones
  // (phones, tablets, small laptop windows) show one at a time.
  const isSplitView = () => window.matchMedia("(min-width: 1151px)").matches;

  let conversations = [];
  let activeId = null;
  let activeName = "";
  let lastSignature = "";
  let pollTimer = null;
  let sending = false;
  let pendingListing = null;   // item attached to the next message (from "Message" on an item)

  const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH")}`;

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function handleError(error) {
    if (error.status === 401) {
      window.location.href = CampusAuth.loginUrl("messages");
      return;
    }
    showToast(error.message || "Something went wrong. Please try again.");
  }


  /* ---------- Conversation list ---------- */

  function renderConversations() {
    const query = search.value.trim().toLowerCase();
    const shown = conversations.filter((c) => !query || c.contact.name.toLowerCase().includes(query));

    list.innerHTML = shown.map((c) => `
      <button class="conversation${c.contact.id === activeId ? " active" : ""}${c.unread ? " unread" : ""}" type="button" data-id="${c.contact.id}">
        <span class="avatar">${escapeHTML(c.contact.initials)}</span>
        <span class="conversation-text">
          <strong>${escapeHTML(c.contact.name)}</strong>
          <small>${escapeHTML(c.last)}</small>
        </span>
        <span class="conversation-side">
          <time>${escapeHTML(c.ago)}</time>
          ${c.unread ? `<b class="unread-count" aria-label="${c.unread} unread">${c.unread}</b>` : ""}
        </span>
      </button>`).join("");

    listEmpty.classList.toggle("hidden", conversations.length > 0);
  }

  async function loadConversations() {
    const data = await CampusAuth.api("messages.php");
    conversations = data.conversations;
    renderConversations();
    CampusAuth.refreshUnreadBadge();
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".conversation");
    if (button) openConversation(button.dataset.id).catch(handleError);
  });

  search.addEventListener("input", renderConversations);


  /* ---------- One conversation ---------- */

  // Changes when a message arrives or an item's sold status changes.
  const signature = (messages) => messages.map((m) => m.id + (m.listing ? `:${m.listing.status}` : "")).join(",");

  // The item a message is about. The seller can mark it sold right here.
  function itemCard(item) {
    const sold = item.status === "sold";
    // Not in the Marketplace right now: waiting for review or taken down by an administrator.
    const hidden = item.status === "pending" || item.status === "removed";
    const statusLabel = { sold: "Sold", pending: "Pending review", removed: "Unavailable" }[item.status] || "Available";
    const isSeller = CampusAuth.user && item.sellerId === CampusAuth.user.id;

    const action = hidden ? "" : isSeller
      ? `<button class="msg-item-button${sold ? " secondary" : ""}" type="button" data-mark="${sold ? "available" : "sold"}" data-listing="${item.id}">${sold ? "Mark as available" : "Mark as sold"}</button>`
      : `<a class="msg-item-button secondary" href="../marketplace/marketplace.html?item=${encodeURIComponent(item.id)}">View item</a>`;

    return `
          <div class="msg-item${sold || hidden ? " sold" : ""}">
            <img class="msg-item-photo" src="${escapeHTML(item.image || CampusCatalog.placeholder(item.category))}" alt="" data-category="${escapeHTML(item.category)}">
            <div class="msg-item-info">
              <strong>${escapeHTML(item.name)}</strong>
              <span>${escapeHTML(money(item.price))}</span>
              <small class="msg-item-status ${sold || hidden ? "sold" : "available"}">${statusLabel}</small>
            </div>
            ${action}
          </div>`;
  }

  function renderMessages(contact, messages) {
    lastSignature = signature(messages);

    if (!messages.length) {
      messageList.innerHTML = `<p class="thread-empty">Say hi to ${escapeHTML(contact.name.split(" ")[0])}! Ask about the item, the price, or a safe campus meetup spot.</p>`;
      return;
    }

    messageList.innerHTML = messages.map((m) => `
      <div class="bubble-row${m.mine ? " mine" : ""}">
        <div class="bubble${m.listing ? " has-item" : ""}">
          ${m.listing ? itemCard(m.listing) : ""}
          <div class="bubble-text">${escapeHTML(m.body)}</div>
          <time datetime="${escapeHTML(m.sent)}" title="${escapeHTML(new Date(m.sent).toLocaleString())}">${escapeHTML(m.ago)}</time>
        </div>
      </div>`).join("");

    messageList.querySelectorAll(".msg-item-photo").forEach((photo) => {
      photo.addEventListener("error", () => { photo.src = CampusCatalog.placeholder(photo.dataset.category); }, { once: true });
    });

    messageList.scrollTop = messageList.scrollHeight;
  }

  // Seller: Mark as sold / Mark as available on an item card.
  messageList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-mark]");
    if (!button) return;

    button.disabled = true;
    try {
      const data = await CampusCatalog.setStatus(Number(button.dataset.listing), button.dataset.mark);
      showToast(data.message);
      await refreshThread(true);
    } catch (error) {
      button.disabled = false;
      handleError(error);
    }
  });

  async function openConversation(key, { itemName = "", listingId = null } = {}) {
    const data = await CampusAuth.api(`messages.php?with=${encodeURIComponent(key)}`);
    const contact = data.contact;

    activeId = contact.id;
    activeName = contact.name;
    closeMenu();
    $("threadAvatar").textContent = contact.initials;
    $("threadName").textContent = contact.name;
    $("threadCampus").textContent = contact.campus || "Campus seller";

    renderMessages(contact, data.messages);

    // Coming from an item: show which item and suggest a first message.
    if (itemName) {
      pendingListing = listingId;
      itemChip.textContent = `About: ${itemName}`;
      itemChip.classList.remove("hidden");
      if (!input.value) input.value = `Hi! Is "${itemName}" still available?`;
      autoGrow();
    } else {
      pendingListing = null;
      itemChip.classList.add("hidden");
    }

    placeholder.classList.add("hidden");
    thread.classList.remove("hidden");
    layout.classList.add("show-thread");

    // Keep the open conversation in the address bar (survives a reload).
    const url = new URL(window.location.href);
    url.search = `?with=${contact.id}`;
    history.replaceState(null, "", url);

    input.focus();

    // The new conversation (or cleared unread count) shows in the list.
    await loadConversations();
  }

  function closeConversation() {
    activeId = null;
    activeName = "";
    closeMenu();
    layout.classList.remove("show-thread");
    thread.classList.add("hidden");
    placeholder.classList.remove("hidden");
    renderConversations();
    history.replaceState(null, "", window.location.pathname);
  }

  $("threadBack").addEventListener("click", closeConversation);


  /* ---------- Chat options (⋯): Delete chat ---------- */

  const moreButton = $("threadMore");
  const menu = $("threadMenu");
  const dialog = $("deleteDialog");
  const confirmButton = $("deleteConfirm");

  function closeMenu() {
    menu.classList.add("hidden");
    moreButton.setAttribute("aria-expanded", "false");
  }

  moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = menu.classList.toggle("hidden") === false;
    moreButton.setAttribute("aria-expanded", String(open));
    if (open) $("deleteChat").focus();
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("hidden") && !event.target.closest(".thread-options")) closeMenu();
  });

  function openDeleteDialog() {
    closeMenu();
    const first = activeName.split(" ")[0] || "They";
    $("deleteText").textContent = `Your conversation with ${activeName} will be removed from your messages. ${first} will still have their copy.`;
    dialog.classList.remove("hidden");
    $("deleteCancel").focus();
  }

  function closeDeleteDialog() {
    dialog.classList.add("hidden");
    confirmButton.disabled = false;
    if (activeId) moreButton.focus();
  }

  $("deleteChat").addEventListener("click", openDeleteDialog);
  $("deleteCancel").addEventListener("click", closeDeleteDialog);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDeleteDialog(); });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!dialog.classList.contains("hidden")) closeDeleteDialog();
    else if (!menu.classList.contains("hidden")) { closeMenu(); moreButton.focus(); }
  });

  confirmButton.addEventListener("click", async () => {
    if (!activeId) return closeDeleteDialog();
    confirmButton.disabled = true;
    try {
      const data = await CampusAuth.api("messages.php", { action: "delete", with: String(activeId) });
      closeDeleteDialog();
      closeConversation();
      await loadConversations();
      showToast(data.message);
    } catch (error) {
      confirmButton.disabled = false;
      handleError(error);
    }
  });


  /* ---------- Sending ---------- */

  function autoGrow() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }

  input.addEventListener("input", autoGrow);

  // Enter sends, Shift + Enter adds a new line.
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || !activeId || sending) return;

    sending = true;
    sendButton.disabled = true;

    try {
      // The first message from an item carries the item (shown as a card).
      await CampusAuth.api("messages.php", { to: String(activeId), body, listing: pendingListing });
      pendingListing = null;
      input.value = "";
      autoGrow();
      itemChip.classList.add("hidden");
      await refreshThread(true);
      await loadConversations();
    } catch (error) {
      handleError(error);
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.focus();
    }
  });


  /* ---------- Live updates (new replies) ---------- */

  async function refreshThread(force = false) {
    if (!activeId) return;
    const data = await CampusAuth.api(`messages.php?with=${activeId}`);
    if (force || signature(data.messages) !== lastSignature) renderMessages(data.contact, data.messages);
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      Promise.all([refreshThread(), loadConversations()]).catch(() => { /* try again next time */ });
    }, 8000);
  }


  /* ---------- Navigation ---------- */

  const routes = {
    home: "../index.html",
    marketplace: "../marketplace/marketplace.html",
    favorites: "../favorites/favorites.html",
    post: "../post-item/post-item.html",
    profile: "../profile/profile.html",
  };

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      if (routes[button.dataset.nav]) window.location.href = routes[button.dataset.nav];
    });
  });

  $("browseButton").addEventListener("click", () => {
    window.location.href = routes.marketplace;
  });


  /* ---------- Start ---------- */

  (async () => {
    try {
      await loadConversations();

      const start = params.get("to") || params.get("with");
      if (start) {
        await openConversation(start, { itemName: params.get("item") || "", listingId: Number(params.get("listing")) || null });
      } else if (isSplitView() && conversations.length) {
        await openConversation(conversations[0].contact.id);
      }
    } catch (error) {
      handleError(error);
    }
    startPolling();
  })();
});
