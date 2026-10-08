/* =========================================================
   NORSU CAMPUS MARKETPLACE — ADMIN DASHBOARD
   One page with six sections, picked by the address hash:
   #dashboard #users #listings #categories #reports #settings.
   Data comes from api/admin.php; auth.js (data-auth="admin")
   sends guests to log in and students back to Home.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const app = document.querySelector(".admin-app");
  const header = $("adminHeader");

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[c]));
  const number = (n) => Number(n || 0).toLocaleString("en-PH");
  const money = (value) => { const n = Number(value || 0); return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`; };
  const debounce = (fn, ms = 300) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  const PATHS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    fileCheck: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    shapes: '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;

  // Stable colors for things without a photo (category tiles, initials).
  const TONES = ["blue", "purple", "orange", "green", "amber", "red"];
  const toneFor = (key) => TONES[[...String(key)].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];

  const LISTING_STATUS = { available: ["Active", "green"], pending: ["Pending", "amber"], sold: ["Sold", "blue"], removed: ["Removed", "red"] };
  const USER_STATUS = { active: ["Active", "green"], suspended: ["Suspended", "red"] };
  const LOG_STATUS = { completed: ["Completed", "green"], review: ["For Review", "amber"], removed: ["Removed", "red"], suspended: ["Suspended", "red"] };
  const pill = (map, key) => { const [label, tone] = map[key] || [key, "gray"]; return `<span class="admin-pill tone-${tone}">${escapeHTML(label)}</span>`; };
  const CONDITIONS = ["New", "Like New", "Used - Good", "Used - Fair"];

  const state = {
    overviewDays: 30,
    users: { q: "", status: "", role: "", page: 1 },
    listings: { q: "", category: "", status: "", days: "", page: 1 },
    reportMonths: 12,
    activity: { type: "all", page: 1 },
    categories: null, // cached for the listing filters and edit form
    rows: { users: new Map(), listings: new Map(), categories: new Map() }
  };
  const me = () => CampusAuth.user || {};


  /* =====================================================
     SERVER
  ===================================================== */

  async function api(path, body) {
    try {
      return await CampusAuth.api(path, body);
    } catch (error) {
      if (error.status === 401) location.href = CampusAuth.loginUrl("admin");
      else if (error.status === 403 && error.code === "not_admin") location.href = CampusAuth.url("index.html");
      throw error;
    }
  }
  const get = (view, params = {}) => api(`admin.php?${new URLSearchParams({ view, ...params })}`);
  const post = (action, data = {}) => api("admin.php", { action, ...data });

  // Each section ignores answers to requests it has since replaced.
  const latest = {};
  const ticket = (key) => (latest[key] = (latest[key] || 0) + 1);
  const isLatest = (key, n) => latest[key] === n;

  const loading = (el) => { if (!el.firstElementChild || el.querySelector(".admin-error")) el.innerHTML = `<div class="admin-loading">Loading…</div>`; el.setAttribute("aria-busy", "true"); };
  const done = (el) => el.removeAttribute("aria-busy");
  const failed = (el, error) => { el.innerHTML = `<div class="admin-error">${escapeHTML(error.message)}</div>`; done(el); };
  const empty = (title, text) => `<div class="admin-empty"><strong>${escapeHTML(title)}</strong>${escapeHTML(text)}</div>`;


  /* =====================================================
     TOAST + DIALOG
  ===================================================== */

  let toastTimer;
  function toast(message, isError = false) {
    const el = $("toast");
    el.textContent = message;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), Math.max(2600, message.length * 55));
  }

  const backdrop = $("modalBackdrop");
  const modal = $("modal");
  let returnFocus = null;

  function openModal({ title, body, actions = [{ label: "Close" }], wide = false }) {
    if (backdrop.hidden) returnFocus = document.activeElement;
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = body;
    modal.classList.toggle("wide", wide);

    const bar = $("modalActions");
    bar.innerHTML = "";
    actions.forEach(({ label, kind = "", onClick, submit }) => {
      const button = document.createElement("button");
      button.type = submit ? "submit" : "button";
      if (submit) button.setAttribute("form", "modalForm");
      button.className = `admin-button ${kind}`;
      button.textContent = label;
      if (!submit) button.addEventListener("click", () => (onClick ? onClick(button) : closeModal()));
      bar.appendChild(button);
    });

    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    const first = modal.querySelector(".admin-modal-body input:not([disabled]), .admin-modal-body select, .admin-modal-body textarea") || bar.querySelector(".admin-button") || $("modalClose");
    first.focus({ preventScroll: true });
  }

  function closeModal() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    returnFocus?.focus?.({ preventScroll: true });
  }

  $("modalClose").addEventListener("click", closeModal);
  backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) closeModal(); });

  // Keep Tab inside the open dialog.
  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")].filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* Ask before something hard to undo; run() does the work and returns the server's answer. */
  function confirmAction({ title, message, confirm, danger = true, run, after }) {
    openModal({
      title,
      body: `<p>${message}</p>`,
      actions: [
        { label: "Cancel" },
        {
          label: confirm,
          kind: danger ? "danger-solid" : "primary",
          onClick: async (button) => {
            button.disabled = true;
            try {
              const data = await run();
              closeModal();
              toast(data.message || "Done.");
              after?.(data);
            } catch (error) {
              button.disabled = false;
              toast(error.message, true);
            }
          }
        }
      ]
    });
  }

  /* Dialog forms: send the fields, show the server's message on the field it names. */
  function bindForm(send, after) {
    const form = $("modalForm");
    form.addEventListener("input", (event) => event.target.removeAttribute("aria-invalid"));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = $("modalActions").querySelector("[type=submit]");
      submit.disabled = true;
      $("formError").textContent = "";
      try {
        const data = await send(new FormData(form));
        closeModal();
        toast(data.message || "Saved.");
        after?.(data);
      } catch (error) {
        submit.disabled = false;
        const field = error.field && form.querySelector(`[name="${error.field}"]`);
        if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
        $("formError").textContent = error.message;
      }
    });
  }


  /* =====================================================
     SHARED PIECES
  ===================================================== */

  function statCard({ tone, icon: name, label, value, sub }) {
    return `
      <div class="admin-stat">
        <span class="admin-tile tone-${tone}">${icon(name)}</span>
        <div class="admin-stat-text">
          <div class="admin-stat-label">${escapeHTML(label)}</div>
          <div class="admin-stat-value">${value}</div>
          <div class="admin-stat-sub">${sub}</div>
        </div>
      </div>`;
  }

  /* columns: [{ label, cls }]; rows: arrays of cell HTML. On phones each row becomes a card. */
  function table(columns, rows) {
    return `
      <table class="admin-table">
        <thead><tr>${columns.map((c) => `<th scope="col">${escapeHTML(c.label)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((cells) => `<tr>${cells.map((cell, i) => `<td data-label="${escapeHTML(columns[i].label)}"${columns[i].cls ? ` class="${columns[i].cls}"` : ""}>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
  }

  function pagination(paging, noun) {
    if (!paging || !paging.total) return "";
    const { page, pages, total, perPage } = paging;
    const from = (page - 1) * perPage + 1;
    const to = Math.min(total, page * perPage);
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const numbers = [];
    for (let n = start; n <= Math.min(pages, start + 4); n++) numbers.push(n);
    return `
      <span>Showing ${number(from)}–${number(to)} of ${number(total)} ${noun}</span>
      <div class="admin-pages">
        <button class="admin-page" type="button" data-page="${page - 1}" aria-label="Previous page" ${page <= 1 ? "disabled" : ""}>${icon("chevronLeft")}</button>
        ${numbers.map((n) => `<button class="admin-page" type="button" data-page="${n}" aria-label="Page ${n}"${n === page ? ' aria-current="page"' : ""}>${n}</button>`).join("")}
        <button class="admin-page" type="button" data-page="${page + 1}" aria-label="Next page" ${page >= pages ? "disabled" : ""}>${icon("chevronRight")}</button>
      </div>`;
  }

  function onPage(container, change) {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) change(Number(button.dataset.page));
    });
  }

  /* Photo, or the category's icon when there is none (or it fails to load). */
  function thumb(listing, alt = "") {
    const fallback = `<span class="admin-item-thumb tone-${toneFor(listing.category)}">${CategoryIcons.svg(listing.categoryIcon)}</span>`;
    return listing.image
      ? `<span class="admin-item-thumb" data-fallback="${escapeHTML(fallback)}"><img src="${escapeHTML(listing.image)}" alt="${escapeHTML(alt)}" loading="lazy"></span>`
      : fallback;
  }

  // Broken photo links (e.g. a deleted upload) swap to the icon tile. Load errors don't bubble, hence capture.
  document.addEventListener("error", (event) => {
    const box = event.target.closest?.(".admin-item-thumb[data-fallback]");
    if (event.target.tagName === "IMG" && box) box.outerHTML = box.dataset.fallback;
  }, true);

  function itemCell(listing) {
    return `<div class="admin-item">${thumb(listing)}<div class="admin-item-text"><strong>${escapeHTML(listing.name)}</strong><small>${escapeHTML(listing.details)}</small></div></div>`;
  }

  function personCell(user, isMe) {
    return `
      <div class="admin-person">
        <span class="admin-initials tone-${toneFor(user.id)}">${escapeHTML(user.initials)}</span>
        <div><strong>${escapeHTML(user.name)}</strong>${user.role === "admin" ? '<span class="admin-role">ADMIN</span>' : ""}${isMe ? "<small>You</small>" : ""}</div>
      </div>`;
  }

  /* Dashboard timeline wording for each kind of activity. */
  function describe(entry) {
    const who = escapeHTML(entry.actor), what = `<b>${escapeHTML(entry.target)}</b>`;
    const map = {
      "registered": ["blue", "users", "New student registered", `${who} created an account`],
      "posted": entry.status === "review"
        ? ["amber", "clock", "Listing waiting for review", `${what} by ${who}`]
        : ["orange", "file", "New listing posted", `${what} by ${who}`],
      "listing.approve": ["green", "fileCheck", "Listing approved", `${what} is now live`],
      "listing.remove": ["red", "flag", "Listing removed", `${what} was taken down by ${who}`],
      "listing.restore": ["green", "rotate", "Listing restored", `${what} is back in the Marketplace`],
      "listing.sold": ["blue", "package", "Listing marked sold", what],
      "listing.edit": ["purple", "pencil", "Listing edited", `${what} was updated by ${who}`],
      "user.create": ["blue", "userPlus", "Account created", `${who} added ${what}`],
      "user.edit": ["purple", "pencil", "Account edited", `${what} was updated by ${who}`],
      "user.suspend": ["red", "ban", "Account suspended", `${what} was suspended by ${who}`],
      "user.activate": ["green", "userCheck", "Account reactivated", `${what} can use the marketplace again`],
      "category.create": ["purple", "shapes", "Category created", what],
      "category.edit": ["purple", "shapes", "Category updated", what],
      "category.delete": ["red", "trash", "Category deleted", what],
      "settings.review_on": ["amber", "settings", "Listing review turned on", `New listings now wait for approval`],
      "settings.review_off": ["gray", "settings", "Listing review turned off", `New listings go live right away`]
    };
    return map[entry.kind] || ["gray", "chart", entry.activity, what];
  }


  /* =====================================================
     DASHBOARD
  ===================================================== */

  const RANGE_TEXT = { 7: "the last 7 days", 30: "the last 30 days", 90: "the last 90 days", 365: "the last 12 months" };

  async function loadOverview() {
    const n = ticket("overview");
    const statsEl = $("overviewStats"), listEl = $("recentListings"), feedEl = $("recentActivity");
    if (!statsEl.firstElementChild) statsEl.innerHTML = `<div class="admin-loading admin-span">Loading…</div>`;
    loading(listEl);
    try {
      const data = await get("overview", { days: state.overviewDays });
      if (!isLatest("overview", n)) return;
      const s = data.stats, range = RANGE_TEXT[data.days];
      const recent = (count, fallback) => count ? `<span class="up">+${number(count)}</span> in ${range}` : fallback;

      statsEl.innerHTML = [
        statCard({ tone: "blue", icon: "users", label: "Total Users", value: number(s.users.total), sub: recent(s.users.recent, "Registered students") }),
        statCard({ tone: "orange", icon: "file", label: "Active Listings", value: number(s.active.total), sub: recent(s.active.recent, "Currently available") }),
        statCard({ tone: "purple", icon: "chart", label: "Pending Listings", value: number(s.pending.total), sub: s.pending.total ? "Need review" : "Nothing waiting" }),
        statCard({ tone: "green", icon: "package", label: "Sold Items", value: number(s.sold.total), sub: recent(s.sold.recent, "Successfully sold") })
      ].join("");

      data.listings.forEach((l) => state.rows.listings.set(String(l.id), l));
      listEl.innerHTML = data.listings.length
        ? table(
            [{ label: "Item", cls: "cell-main" }, { label: "Seller" }, { label: "Category" }, { label: "Price" }, { label: "Status" }, { label: "Action", cls: "cell-actions" }],
            data.listings.map((l) => [
              itemCell(l), `<span class="nowrap">${escapeHTML(l.seller)}</span>`, `<span class="admin-chip">${escapeHTML(l.category)}</span>`,
              `<span class="num">${money(l.price)}</span>`, pill(LISTING_STATUS, l.status),
              `<div class="admin-actions"><button class="admin-mini${l.status === "pending" ? " primary" : ""}" type="button" data-listing-action="view" data-id="${l.id}">${l.status === "pending" ? "Review" : "View"}</button></div>`
            ])
          )
        : empty("No listings yet", "Items students post will show up here.");
      done(listEl);

      feedEl.innerHTML = data.activity.length
        ? data.activity.map((entry) => {
            const [tone, name, title, text] = describe(entry);
            return `<li><span class="admin-tile small tone-${tone}">${icon(name)}</span><div><strong>${escapeHTML(title)}</strong><p>${text}</p><time>${escapeHTML(entry.ago)}</time></div></li>`;
          }).join("")
        : `<li>${empty("No activity yet", "Sign-ups and new listings appear here.")}</li>`;
    } catch (error) {
      if (isLatest("overview", n)) { failed(listEl, error); statsEl.innerHTML = ""; }
    }
  }

  $("overviewRange").addEventListener("change", (event) => { state.overviewDays = Number(event.target.value); loadOverview(); });


  /* =====================================================
     USERS
  ===================================================== */

  async function loadUsers() {
    const n = ticket("users");
    const tableEl = $("usersTable");
    loading(tableEl);
    try {
      const { q, status, role, page } = state.users;
      const data = await get("users", { q, status, role, page });
      if (!isLatest("users", n)) return;
      state.users.page = data.paging.page;
      state.rows.users.clear();
      data.users.forEach((u) => state.rows.users.set(String(u.id), u));

      tableEl.innerHTML = data.users.length
        ? table(
            [{ label: "User", cls: "cell-main" }, { label: "Student ID" }, { label: "Email" }, { label: "Date Registered" }, { label: "Listings" }, { label: "Status" }, { label: "Actions", cls: "cell-actions" }],
            data.users.map((u) => {
              const self = u.id === data.me;
              return [
                personCell(u, self), `<span class="nowrap">${escapeHTML(u.studentId || "—")}</span>`, escapeHTML(u.email),
                `<span class="nowrap">${escapeHTML(u.joined)}</span>`, `<span class="admin-count">${number(u.listings)}</span>`, pill(USER_STATUS, u.status),
                `<div class="admin-actions">
                  <button class="admin-mini" type="button" data-user-action="view" data-id="${u.id}">View</button>
                  <button class="admin-mini" type="button" data-user-action="edit" data-id="${u.id}">Edit</button>
                  ${self ? "" : u.status === "suspended"
                    ? `<button class="admin-mini ok" type="button" data-user-action="activate" data-id="${u.id}">Activate</button>`
                    : `<button class="admin-mini warn" type="button" data-user-action="suspend" data-id="${u.id}">Suspend</button>`}
                </div>`
              ];
            })
          )
        : empty("No users found", "Try a different search or filter.");
      $("usersPaging").innerHTML = pagination(data.paging, data.paging.total === 1 ? "user" : "users");
      done(tableEl);
    } catch (error) {
      if (isLatest("users", n)) { failed(tableEl, error); $("usersPaging").innerHTML = ""; }
    }
  }

  const reloadUsers = (reset = true) => { if (reset) state.users.page = 1; loadUsers(); };
  $("userSearch").addEventListener("input", debounce((event) => { state.users.q = event.target.value.trim(); reloadUsers(); }));
  $("userStatus").addEventListener("change", (event) => { state.users.status = event.target.value; reloadUsers(); });
  $("userRole").addEventListener("change", (event) => { state.users.role = event.target.value; reloadUsers(); });
  onPage($("usersPaging"), (page) => { state.users.page = page; loadUsers(); });
  $("addUserButton").addEventListener("click", () => userForm());

  $("usersTable").addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;
    const user = state.rows.users.get(button.dataset.id);
    const action = button.dataset.userAction;
    if (action === "view") viewUser(button.dataset.id);
    if (action === "edit" && user) userForm(user);
    if (action === "suspend" && user) suspendUser(user);
    if (action === "activate" && user) activateUser(user, button);
  });

  function suspendUser(user, after = loadUsers) {
    confirmAction({
      title: "Suspend this account?",
      message: `<strong>${escapeHTML(user.name)}</strong> won't be able to log in, and their listings are hidden from the Marketplace until you reactivate the account.`,
      confirm: "Suspend account",
      run: () => post("user-status", { id: user.id, status: "suspended" }),
      after
    });
  }

  async function activateUser(user, button, after = loadUsers) {
    if (button) button.disabled = true;
    try {
      const data = await post("user-status", { id: user.id, status: "active" });
      toast(data.message);
      after();
    } catch (error) {
      if (button) button.disabled = false;
      toast(error.message, true);
    }
  }

  async function viewUser(id) {
    openModal({ title: "Account", body: `<div class="admin-loading">Loading…</div>` });
    try {
      const data = await get("user", { id });
      const u = data.user, c = u.counts || {};
      const self = u.id === data.me;
      openModal({
        title: "Account",
        wide: true,
        body: `
          <div class="admin-profile-top">
            <span class="admin-initials tone-${toneFor(u.id)}">${escapeHTML(u.initials)}</span>
            <div><strong>${escapeHTML(u.name)}</strong><span>${escapeHTML(u.email)}</span></div>
          </div>
          <dl class="admin-details">
            <div><dt>Student ID</dt><dd>${escapeHTML(u.studentId || "—")}</dd></div>
            <div><dt>Campus</dt><dd>${escapeHTML(u.campus)}</dd></div>
            <div><dt>Role</dt><dd>${u.role === "admin" ? "Administrator" : "Student"}</dd></div>
            <div><dt>Status</dt><dd>${pill(USER_STATUS, u.status)}</dd></div>
            <div><dt>Registered</dt><dd>${escapeHTML(u.joined)}</dd></div>
            <div><dt>Listings</dt><dd>${number(c.available || 0)} active · ${number(c.pending || 0)} pending · ${number(c.sold || 0)} sold${c.removed ? ` · ${number(c.removed)} removed` : ""}</dd></div>
          </dl>
          ${u.bio ? `<p class="admin-subhead">About</p><p>${escapeHTML(u.bio)}</p>` : ""}
          <p class="admin-subhead">Recent listings</p>
          ${data.listings.length
            ? `<ul class="admin-mini-list">${data.listings.map((l) => `<li><span>${escapeHTML(l.name)} · <span class="num">${money(l.price)}</span></span>${pill(LISTING_STATUS, l.status)}</li>`).join("")}</ul>`
            : `<p>No listings yet.</p>`}`,
        actions: [
          ...(self ? [] : [u.status === "suspended"
            ? { label: "Activate", onClick: () => { closeModal(); activateUser(u, null, refreshUsersView); } }
            : { label: "Suspend", kind: "danger", onClick: () => suspendUser(u, refreshUsersView) }]),
          { label: "Edit", onClick: () => userForm(u) },
          { label: "Close", kind: "primary" }
        ]
      });
    } catch (error) {
      openModal({ title: "Account", body: `<p class="admin-error">${escapeHTML(error.message)}</p>` });
    }
  }

  const refreshUsersView = () => { if (currentSection() === "users") loadUsers(); else route(); };

  function userForm(user) {
    const editing = Boolean(user);
    const self = editing && user.id === me().id;
    openModal({
      title: editing ? "Edit account" : "Add user",
      body: `
        <form class="admin-form" id="modalForm" novalidate>
          <label class="admin-field full"><span>Full name</span><input name="name" maxlength="80" autocomplete="off" value="${escapeHTML(user?.name || "")}" required></label>
          <label class="admin-field"><span>Email</span><input name="email" type="email" maxlength="120" autocomplete="off" value="${escapeHTML(user?.email || "")}" required></label>
          <label class="admin-field"><span>Student ID</span><input name="studentId" maxlength="30" autocomplete="off" placeholder="e.g. 2024-00123" value="${escapeHTML(user?.studentId || "")}"><small>Optional for administrators.</small></label>
          <label class="admin-field"><span>Campus</span><input name="campus" maxlength="80" value="${escapeHTML(user?.campus || "Main Campus")}"></label>
          <label class="admin-field"><span>Role</span>
            <select name="role"${self ? " disabled" : ""}>
              <option value="student"${user?.role === "admin" ? "" : " selected"}>Student</option>
              <option value="admin"${user?.role === "admin" ? " selected" : ""}>Administrator</option>
            </select>
            ${self ? '<small>You can\'t change your own role.</small><input type="hidden" name="role" value="admin">' : ""}
          </label>
          <label class="admin-field full"><span>${editing ? "New password" : "Temporary password"}</span><input name="password" type="password" maxlength="72" autocomplete="new-password"${editing ? "" : " required"}>
            <small>${editing ? "Leave blank to keep the current password." : "At least 8 characters with a letter and a number. Give it to the student so they can log in."}</small></label>
          <p class="admin-form-error" id="formError" role="alert"></p>
        </form>`,
      actions: [{ label: "Cancel" }, { label: editing ? "Save changes" : "Create account", kind: "primary", submit: true }]
    });
    bindForm((form) => post("user-save", { id: user?.id || 0, ...Object.fromEntries(form) }), refreshUsersView);
  }


  /* =====================================================
     LISTINGS
  ===================================================== */

  async function ensureCategories() {
    if (state.categories) return state.categories;
    const data = await get("categories");
    state.categories = data.categories;
    state.icons = data.icons;
    const select = $("listingCategory");
    select.innerHTML = `<option value="">All categories</option>` + data.categories.map((c) => `<option value="${c.id}">${escapeHTML(c.name)}${c.active ? "" : " (hidden)"}</option>`).join("");
    select.value = state.listings.category;
    return state.categories;
  }

  async function loadListings() {
    const n = ticket("listings");
    const tableEl = $("listingsTable");
    loading(tableEl);
    ensureCategories().catch(() => { /* filters still work without names */ });
    try {
      const { q, category, status, days, page } = state.listings;
      const data = await get("listings", { q, category, status, days, page });
      if (!isLatest("listings", n)) return;
      state.listings.page = data.paging.page;
      data.listings.forEach((l) => state.rows.listings.set(String(l.id), l));

      tableEl.innerHTML = data.listings.length
        ? table(
            [{ label: "Item", cls: "cell-main" }, { label: "Seller" }, { label: "Category" }, { label: "Price" }, { label: "Date Posted" }, { label: "Status" }, { label: "Actions", cls: "cell-actions" }],
            data.listings.map((l) => [
              itemCell(l), `<span class="nowrap">${escapeHTML(l.seller)}</span>`, `<span class="admin-chip">${escapeHTML(l.category)}</span>`, `<span class="num">${money(l.price)}</span>`,
              `<span class="nowrap">${escapeHTML(l.posted)}</span>`, pill(LISTING_STATUS, l.status),
              `<div class="admin-actions">
                <button class="admin-mini" type="button" data-listing-action="view" data-id="${l.id}">View</button>
                ${l.status === "pending" ? `<button class="admin-mini primary" type="button" data-listing-action="approve" data-id="${l.id}">Approve</button>` : ""}
                <button class="admin-mini" type="button" data-listing-action="edit" data-id="${l.id}">Edit</button>
                ${l.status === "removed"
                  ? `<button class="admin-mini ok" type="button" data-listing-action="restore" data-id="${l.id}">Restore</button>`
                  : `<button class="admin-mini warn" type="button" data-listing-action="remove" data-id="${l.id}">Remove</button>`}
              </div>`
            ])
          )
        : empty(state.listings.status === "pending" ? "Nothing waiting for review" : "No listings found", state.listings.status === "pending" ? "New listings that need approval will appear here." : "Try a different search or filter.");
      $("listingsPaging").innerHTML = pagination(data.paging, data.paging.total === 1 ? "listing" : "listings");
      done(tableEl);
    } catch (error) {
      if (isLatest("listings", n)) { failed(tableEl, error); $("listingsPaging").innerHTML = ""; }
    }
  }

  const reloadListings = () => { state.listings.page = 1; loadListings(); };
  $("listingSearch").addEventListener("input", debounce((event) => { state.listings.q = event.target.value.trim(); reloadListings(); }));
  $("listingCategory").addEventListener("change", (event) => { state.listings.category = event.target.value; reloadListings(); });
  $("listingStatus").addEventListener("change", (event) => { state.listings.status = event.target.value; reloadListings(); });
  $("listingDays").addEventListener("change", (event) => { state.listings.days = event.target.value; reloadListings(); });
  onPage($("listingsPaging"), (page) => { state.listings.page = page; loadListings(); });

  // Row buttons on Listings and on the Dashboard's Recent Listings.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-listing-action]");
    if (!button) return;
    const listing = state.rows.listings.get(button.dataset.id);
    if (!listing) return;
    const action = button.dataset.listingAction;
    if (action === "view") viewListing(listing);
    if (action === "edit") listingForm(listing);
    if (action === "approve") setListingStatus(listing, "available", button);
    if (action === "restore") setListingStatus(listing, "available", button);
    if (action === "remove") removeListing(listing);
  });

  /* After a listing changes: refresh whatever is on screen plus the review counts. */
  function afterListingChange() {
    refreshCounts();
    const section = currentSection();
    if (section === "listings") loadListings();
    else if (section === "dashboard") loadOverview();
  }

  async function setListingStatus(listing, status, button) {
    if (button) button.disabled = true;
    try {
      const data = await post("listing-status", { id: listing.id, status });
      closeModal();
      toast(data.message);
      afterListingChange();
    } catch (error) {
      if (button) button.disabled = false;
      toast(error.message, true);
    }
  }

  function removeListing(listing) {
    confirmAction({
      title: "Remove this listing?",
      message: `<strong>${escapeHTML(listing.name)}</strong> disappears from the Marketplace and its seller sees it as removed. You can restore it later from <strong>Listings → Removed</strong>.`,
      confirm: "Remove listing",
      run: () => post("listing-status", { id: listing.id, status: "removed" }),
      after: afterListingChange
    });
  }

  function viewListing(l) {
    const isPublic = l.status === "available" || l.status === "sold";
    openModal({
      title: l.status === "pending" ? "Review listing" : "Listing",
      wide: true,
      body: `
        <div class="admin-listing-hero">
          ${thumb(l, l.name)}
          <div>
            <h3>${escapeHTML(l.name)}</h3>
            <div class="price">${money(l.price)}</div>
            ${pill(LISTING_STATUS, l.status)}
            <p>${escapeHTML(l.description || "No description provided.")}</p>
          </div>
        </div>
        <dl class="admin-details">
          <div><dt>Seller</dt><dd>${escapeHTML(l.seller)}</dd></div>
          <div><dt>Category</dt><dd>${escapeHTML(l.category)}</dd></div>
          <div><dt>Condition · Location</dt><dd>${escapeHTML(l.details)}</dd></div>
          <div><dt>Posted</dt><dd>${escapeHTML(l.posted)} (${escapeHTML(l.postedAgo)})</dd></div>
          <div><dt>Views</dt><dd>${number(l.views)}</dd></div>
          <div><dt>Listing ID</dt><dd>#${l.id}</dd></div>
        </dl>
        ${isPublic ? `<p class="admin-subhead"><a class="admin-link" href="../marketplace/marketplace.html?item=${l.id}" target="_blank" rel="noopener">Open in Marketplace ${icon("external")}</a></p>` : ""}`,
      actions: [
        l.status === "removed"
          ? { label: "Restore", onClick: (b) => setListingStatus(l, "available", b) }
          : { label: "Remove", kind: "danger", onClick: () => removeListing(l) },
        { label: "Edit", onClick: () => listingForm(l) },
        l.status === "pending"
          ? { label: "Approve", kind: "primary", onClick: (b) => setListingStatus(l, "available", b) }
          : { label: "Close", kind: "primary" }
      ]
    });
  }

  async function listingForm(l) {
    let categories = [];
    try { categories = await ensureCategories(); } catch (error) { toast(error.message, true); return; }
    openModal({
      title: "Edit listing",
      body: `
        <form class="admin-form" id="modalForm" novalidate>
          <label class="admin-field full"><span>Item name</span><input name="name" maxlength="80" value="${escapeHTML(l.name)}" required></label>
          <label class="admin-field"><span>Price (₱)</span><input name="price" inputmode="decimal" value="${escapeHTML(String(l.price))}" required></label>
          <label class="admin-field"><span>Condition</span><select name="condition">${CONDITIONS.map((c) => `<option${c === l.condition ? " selected" : ""}>${c}</option>`).join("")}</select></label>
          <label class="admin-field full"><span>Category</span><select name="categoryId">${categories.map((c) => `<option value="${c.id}"${c.id === l.categoryId ? " selected" : ""}>${escapeHTML(c.name)}${c.active ? "" : " (hidden)"}</option>`).join("")}</select></label>
          <p class="admin-form-error" id="formError" role="alert"></p>
        </form>`,
      actions: [{ label: "Cancel" }, { label: "Save changes", kind: "primary", submit: true }]
    });
    bindForm((form) => post("listing-save", { id: l.id, ...Object.fromEntries(form) }), afterListingChange);
  }


  /* =====================================================
     CATEGORIES
  ===================================================== */

  async function loadCategories() {
    const n = ticket("categories");
    const grid = $("categoryGrid");
    loading(grid);
    try {
      state.categories = null;
      const categories = await ensureCategories();
      if (!isLatest("categories", n)) return;
      state.rows.categories.clear();
      categories.forEach((c) => state.rows.categories.set(String(c.id), c));
      const total = categories.reduce((sum, c) => sum + c.listings, 0);
      const hidden = categories.filter((c) => !c.active).length;
      $("categorySummary").innerHTML = `<strong>${number(categories.length)} ${categories.length === 1 ? "category" : "categories"}</strong> · ${number(total)} listings organized across the marketplace${hidden ? ` · ${hidden} hidden from the Post Item form` : ""}`;

      grid.innerHTML = categories.map((c) => `
        <article class="admin-card admin-category${c.active ? "" : " is-hidden"}">
          <div class="admin-category-top">
            <span class="admin-tile tone-${toneFor(c.name)}">${CategoryIcons.svg(c.icon)}</span>
            ${c.active ? '<span class="admin-pill tone-green">Active</span>' : '<span class="admin-pill tone-gray">Hidden</span>'}
          </div>
          <h3>${escapeHTML(c.name)}</h3>
          <p>${escapeHTML(c.description || "No description yet.")}</p>
          <div class="admin-category-foot">
            <span><b>${number(c.listings)}</b>${c.listings === 1 ? "listing" : "listings"}</span>
            <div class="admin-category-tools">
              <button class="admin-icon-button" type="button" data-category-action="edit" data-id="${c.id}" aria-label="Edit ${escapeHTML(c.name)}">${icon("pencil")}</button>
              ${c.builtIn ? "" : `<button class="admin-icon-button warn" type="button" data-category-action="delete" data-id="${c.id}" aria-label="Delete ${escapeHTML(c.name)}">${icon("trash")}</button>`}
            </div>
          </div>
        </article>`).join("");
      done(grid);
    } catch (error) {
      if (isLatest("categories", n)) failed(grid, error);
    }
  }

  $("addCategoryButton").addEventListener("click", () => categoryForm());
  $("categoryGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-action]");
    if (!button) return;
    const category = state.rows.categories.get(button.dataset.id);
    if (!category) return;
    if (button.dataset.categoryAction === "edit") categoryForm(category);
    if (button.dataset.categoryAction === "delete") {
      confirmAction({
        title: "Delete this category?",
        message: `<strong>${escapeHTML(category.name)}</strong> will be removed. Students won't be able to choose it anymore.`,
        confirm: "Delete category",
        run: () => post("category-delete", { id: category.id }),
        after: loadCategories
      });
    }
  });

  function categoryForm(c) {
    const icons = state.icons || CategoryIcons.names;
    const chosen = c?.icon || "tag";
    openModal({
      title: c ? "Edit category" : "Add category",
      body: `
        <form class="admin-form" id="modalForm" novalidate>
          <label class="admin-field full"><span>Name</span><input name="name" maxlength="40" value="${escapeHTML(c?.name || "")}"${c?.builtIn ? " readonly" : ""} required>
            ${c?.builtIn ? "<small>Built-in categories keep their name because the Home and Marketplace pages link to them.</small>" : ""}</label>
          <label class="admin-field full"><span>Description</span><textarea name="description" maxlength="120" rows="2" placeholder="What students can post here">${escapeHTML(c?.description || "")}</textarea></label>
          <fieldset class="admin-field full" style="border:0">
            <span>Icon</span>
            <div class="admin-icon-picker">${icons.map((name) => `
              <label title="${escapeHTML(name)}"><input type="radio" name="icon" value="${escapeHTML(name)}" aria-label="${escapeHTML(name.replace(/-/g, " "))}"${name === chosen ? " checked" : ""}><span>${CategoryIcons.svg(name)}</span></label>`).join("")}
            </div>
          </fieldset>
          <label class="admin-check full"><input type="checkbox" name="active" value="1"${!c || c.active ? " checked" : ""}> Show in the Post Item form</label>
          <p class="admin-form-error" id="formError" role="alert"></p>
        </form>`,
      actions: [{ label: "Cancel" }, { label: c ? "Save changes" : "Add category", kind: "primary", submit: true }]
    });
    bindForm((form) => post("category-save", {
      id: c?.id || 0,
      name: form.get("name"),
      description: form.get("description"),
      icon: form.get("icon") || "",
      active: form.get("active") === "1"
    }), () => { state.categories = null; loadCategories(); });
  }


  /* =====================================================
     REPORTS & ACTIVITY
  ===================================================== */

  /* "+18.2% vs. the previous 30 days"; plain counts when the earlier number is too small for a fair percentage. */
  function change(current, previous) {
    if (previous < 5) return current ? `<span class="up">+${number(current)}</span> new in the last 30 days` : "None in the last 30 days";
    const pct = ((current - previous) / previous) * 100;
    const text = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    return `<span class="${pct >= 0 ? "up" : "down"}">${text}</span> vs. the previous 30 days`;
  }

  /* Round the top of the chart to 1, 2 or 5 × 10ⁿ per gridline. */
  function niceStep(max) {
    const raw = Math.max(1, max) / 4;
    const power = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((m) => m * power).find((step) => step >= raw);
  }

  async function loadReports() {
    const n = ticket("reports");
    const statsEl = $("reportStats"), chartEl = $("activityChart");
    if (!statsEl.firstElementChild) statsEl.innerHTML = `<div class="admin-loading admin-span">Loading…</div>`;
    loading(chartEl);
    loadActivity();
    try {
      const data = await get("reports", { months: state.reportMonths });
      if (!isLatest("reports", n)) return;
      const s = data.stats;
      const share = s.users.students ? Math.round((s.users.total / s.users.students) * 1000) / 10 : 0;
      statsEl.innerHTML = [
        statCard({ tone: "blue", icon: "file", label: "Total Listings", value: number(s.listings.total), sub: change(s.listings.current, s.listings.previous) }),
        statCard({ tone: "green", icon: "package", label: "Total Sold Items", value: number(s.sold.total), sub: change(s.sold.current, s.sold.previous) }),
        statCard({ tone: "purple", icon: "users", label: "Active Users", value: number(s.users.total), sub: `${share}% of all students` }),
        statCard({ tone: "orange", icon: "flag", label: "Pending Review", value: number(s.pending.total), sub: s.pending.total ? "Need administrator review" : "Nothing waiting" })
      ].join("");

      const counts = data.series.map((m) => m.count);
      const total = counts.reduce((a, b) => a + b, 0);
      const step = niceStep(Math.max(...counts));
      const top = step * 4;
      $("chartSubtitle").textContent = `Listings created over the last ${data.months} months`;
      $("chartTotal").textContent = `${number(total)} total`;
      chartEl.innerHTML = `
        <div class="admin-chart-plot" role="img" aria-label="${escapeHTML(data.series.map((m) => `${m.title}: ${m.count}`).join(", "))}">
          <div class="admin-chart-axis">${[0, 1, 2, 3, 4].map((i) => `<span style="bottom:${i * 25}%">${number(step * i)}</span>`).join("")}</div>
          <div class="admin-chart-area">
            ${[0, 1, 2, 3, 4].map((i) => `<div class="admin-chart-grid" style="bottom:${i * 25}%"></div>`).join("")}
            <div class="admin-chart-bars">${data.series.map((m) => {
              const h = `${Math.max(0.6, (m.count / top) * 100).toFixed(1)}%`;
              return `<button class="admin-bar" type="button" style="--h:${h}" aria-label="${escapeHTML(m.title)}: ${m.count} ${m.count === 1 ? "listing" : "listings"}"><i style="height:${h}"></i><b>${number(m.count)}</b></button>`;
            }).join("")}</div>
          </div>
        </div>
        <div class="admin-chart-labels" aria-hidden="true">${data.series.map((m) => `<span>${escapeHTML(m.label)}</span>`).join("")}</div>`;
      done(chartEl);
    } catch (error) {
      if (isLatest("reports", n)) { failed(chartEl, error); statsEl.innerHTML = ""; }
    }
  }

  async function loadActivity() {
    const n = ticket("activity");
    const tableEl = $("activityTable");
    loading(tableEl);
    try {
      const data = await get("activity", { type: state.activity.type, page: state.activity.page });
      if (!isLatest("activity", n)) return;
      state.activity.page = data.paging.page;
      tableEl.innerHTML = data.activity.length
        ? table(
            [{ label: "Date & Time" }, { label: "Administrator / User", cls: "cell-main" }, { label: "Activity" }, { label: "Target" }, { label: "Status" }],
            data.activity.map((a) => [
              `<span class="admin-datetime"><strong>${escapeHTML(a.date)}</strong><small>${escapeHTML(a.time)}</small></span>`,
              `<div class="admin-person"><span class="admin-initials tone-${a.actorRole === "admin" ? "purple" : toneFor(a.actor)}">${escapeHTML(a.actor.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase())}</span><div><strong>${escapeHTML(a.actor)}</strong><small>${a.actorRole === "admin" ? "Administrator" : "Student"}</small></div></div>`,
              escapeHTML(a.activity), escapeHTML(a.target), pill(LOG_STATUS, a.status)
            ])
          )
        : empty("No activity yet", "Nothing matches this filter.");
      $("activityPaging").innerHTML = pagination(data.paging, data.paging.total === 1 ? "event" : "events");
      done(tableEl);
    } catch (error) {
      if (isLatest("activity", n)) { failed(tableEl, error); $("activityPaging").innerHTML = ""; }
    }
  }

  $("reportRange").addEventListener("change", (event) => { state.reportMonths = Number(event.target.value); loadReports(); });
  $("activityType").addEventListener("change", (event) => { state.activity = { type: event.target.value, page: 1 }; loadActivity(); });
  onPage($("activityPaging"), (page) => { state.activity.page = page; loadActivity(); });


  /* =====================================================
     SETTINGS
  ===================================================== */

  async function loadSettings() {
    const user = me();
    $("settingsName").textContent = user.name || "Administrator";
    $("settingsEmail").textContent = [user.email, "Administrator"].filter(Boolean).join(" · ");
    $("settingsAvatar").textContent = user.initials || "AD";
    try {
      const data = await get("settings");
      setReviewSwitch(data.settings.reviewListings, data.pending);
    } catch (error) {
      toast(error.message, true);
    }
  }

  function setReviewSwitch(on, pending) {
    $("reviewSwitch").setAttribute("aria-checked", String(on));
    $("pendingNote").textContent = pending ? `${number(pending)} ${pending === 1 ? "listing is" : "listings are"} waiting for review in Listings.` : "";
  }

  $("reviewSwitch").addEventListener("click", async () => {
    const button = $("reviewSwitch");
    const on = button.getAttribute("aria-checked") !== "true";
    button.disabled = true;
    try {
      const data = await post("settings-save", { reviewListings: on });
      button.setAttribute("aria-checked", String(data.settings.reviewListings));
      toast(data.message);
      refreshCounts();
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
    }
  });


  /* =====================================================
     NAVIGATION
  ===================================================== */

  const SECTIONS = {
    dashboard: { title: "Administrator Dashboard", short: "Dashboard", subtitle: () => `Welcome back, ${me().firstName || "Admin"}`, load: loadOverview },
    users: { title: "Manage Users", short: "Users", load: loadUsers },
    listings: { title: "Manage Listings", short: "Listings", load: loadListings },
    categories: { title: "Manage Categories", short: "Categories", load: loadCategories },
    reports: { title: "Reports & Activity", short: "Reports", load: loadReports },
    settings: { title: "Settings", short: "Settings", load: loadSettings }
  };

  // Phones get the short title so it isn't cut off next to the header buttons.
  const narrow = matchMedia("(max-width: 768px)");
  const showTitle = () => { const s = SECTIONS[currentSection()]; $("pageTitle").textContent = narrow.matches ? s.short : s.title; };
  narrow.addEventListener("change", showTitle);

  function currentSection() {
    const name = location.hash.slice(1);
    return SECTIONS[name] ? name : "dashboard";
  }

  function route() {
    const name = currentSection();
    const section = SECTIONS[name];
    document.querySelectorAll("[data-section]").forEach((el) => { el.hidden = el.dataset.section !== name; });
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === name) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    showTitle();
    $("pageSubtitle").textContent = section.subtitle ? section.subtitle() : "Campus Marketplace Administration";
    document.title = `${section.title} | NORSU Campus Marketplace Admin`;
    closeMenu();
    closeModal();
    window.scrollTo(0, 0);
    section.load();
  }

  /* Open a section with some filters already set (search, bell). */
  function goTo(name, preset = {}) {
    if (name === "listings") {
      Object.assign(state.listings, { page: 1 }, preset);
      $("listingSearch").value = state.listings.q;
      $("listingStatus").value = state.listings.status;
    }
    if (name === "users") {
      Object.assign(state.users, { page: 1 }, preset);
      $("userSearch").value = state.users.q;
    }
    if (location.hash === `#${name}`) route();
    else location.hash = name;
  }

  window.addEventListener("hashchange", route);

  // Drawer menu (tablets and phones).
  const scrim = $("sidebarScrim");
  function openMenu() {
    app.classList.add("menu-open");
    scrim.hidden = false;
    $("menuToggle").setAttribute("aria-expanded", "true");
    // The drawer is still invisible at this instant; focus it once it starts sliding in.
    setTimeout(() => document.querySelector(".admin-nav a[aria-current]")?.focus({ preventScroll: true }), 60);
  }
  function closeMenu() {
    if (!app.classList.contains("menu-open")) return;
    app.classList.remove("menu-open");
    scrim.hidden = true;
    $("menuToggle").setAttribute("aria-expanded", "false");
  }
  $("menuToggle").addEventListener("click", () => (app.classList.contains("menu-open") ? closeMenu() : openMenu()));
  scrim.addEventListener("click", closeMenu);
  matchMedia("(min-width: 1025px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });

  // Account menu (bottom of the sidebar).
  const accountButton = $("accountButton"), accountMenu = $("accountMenu");
  const closeAccount = () => { accountMenu.hidden = true; accountButton.setAttribute("aria-expanded", "false"); };
  accountButton.addEventListener("click", (event) => {
    event.stopPropagation();
    accountMenu.hidden = !accountMenu.hidden;
    accountButton.setAttribute("aria-expanded", String(!accountMenu.hidden));
  });
  document.addEventListener("click", (event) => { if (!accountMenu.hidden && !event.target.closest("#accountMenu")) closeAccount(); });

  document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await CampusAuth.logout();
      location.href = CampusAuth.url("login/login.html?reason=signedout");
    } catch (error) {
      button.disabled = false;
      toast(error.message, true);
    }
  }));

  // Header search: users when you're on Users, listings everywhere else.
  const searchInput = $("globalSearchInput");
  $("globalSearch").addEventListener("submit", (event) => {
    event.preventDefault();
    const q = searchInput.value.trim();
    if (currentSection() === "users") goTo("users", { q });
    else goTo("listings", { q });
  });
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $("searchShortcut").textContent = isMac ? "⌘ K" : "Ctrl K";
  $("searchToggle").addEventListener("click", () => {
    const open = header.classList.toggle("search-open");
    $("searchToggle").setAttribute("aria-expanded", String(open));
    if (open) searchInput.focus();
  });

  $("bellButton").addEventListener("click", () => {
    if (pendingCount) goTo("listings", { status: "pending", q: "", category: "", days: "" });
    else toast("No listings are waiting for review.");
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (getComputedStyle($("globalSearch")).display === "none") $("searchToggle").click();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (event.key !== "Escape") return;
    if (!backdrop.hidden) closeModal();
    else if (!accountMenu.hidden) { closeAccount(); accountButton.focus(); }
    else if (app.classList.contains("menu-open")) { closeMenu(); $("menuToggle").focus(); }
    else if (header.classList.contains("search-open")) { header.classList.remove("search-open"); $("searchToggle").setAttribute("aria-expanded", "false"); }
  });


  /* =====================================================
     START
  ===================================================== */

  let pendingCount = 0;
  async function refreshCounts() {
    try {
      const data = await get("counts");
      pendingCount = data.pending;
      const badge = $("pendingBadge");
      badge.textContent = pendingCount > 99 ? "99+" : String(pendingCount);
      badge.hidden = !pendingCount;
      $("bellDot").hidden = !pendingCount;
      $("bellButton").setAttribute("aria-label", pendingCount ? `${pendingCount} ${pendingCount === 1 ? "listing" : "listings"} waiting for review` : "No listings waiting for review");
    } catch { /* the badge just stays as it was */ }
  }

  function showAccount() {
    const user = me();
    $("adminName").textContent = user.name || "Administrator";
    $("adminAvatar").textContent = user.initials || "AD";
  }

  if (window.CampusTheme) {
    $("accountThemeSlot").innerHTML = CampusTheme.switchHTML();
    $("settingsThemeSlot").innerHTML = CampusTheme.switchHTML();
  }

  // Wait for the server to confirm this is an administrator before loading anything.
  CampusAuth.ready.then((user) => {
    if (!user || user.role !== "admin") return;
    showAccount();
    route();
    refreshCounts();
  });
});
