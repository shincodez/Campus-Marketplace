/* =========================================================
   NORSU CAMPUS MARKETPLACE
   HEADER BUTTONS — notifications, cart, profile
   Shared by Home, Marketplace, Favorites and Messages.

   Markup (styles in header.css):
     <div class="hdr-actions" data-header-actions>
       <button class="hdr-button" data-header="notifications">…<span class="hdr-dot" hidden></span></button>
       <button class="hdr-button" data-header="cart">…<span class="hdr-badge" hidden></span></button>
       <button class="hdr-button" data-header="profile">…</button>
     </div>
   On Marketplace the cart button has data-cart="page": that page
   opens its own cart and keeps its own count.
   ========================================================= */

(function () {

    const svg = paths => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

    /* Lucide line icons, same set as the rest of the site. */
    const ICONS = {
        message: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
        heart: svg('<path d="M20.2 8.7c0 5.1-8.2 10.5-8.2 10.5S3.8 13.8 3.8 8.7A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.2 2.5Z"/>'),
        plus: svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
        check: svg('<path d="M20 6 9 17l-5-5"/>'),
        user: svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
        listings: svg('<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>'),
        logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'),
        shield: svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
        login: svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>'),
        signup: svg('<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>')
    };

    const CART_KEY = "campusMarketplaceCart";

    let openPanel = null;

    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[c]));

    const go = path => { window.location.href = path; };


    /* =========================================================
       PANELS
    ========================================================= */

    function closePanel() {
        if (!openPanel) return;
        openPanel.element.remove();
        openPanel.button.setAttribute("aria-expanded", "false");
        openPanel = null;
    }


    /* Opens a panel under its button; pressing the same button again closes it. */
    function togglePanel(button, label, html) {
        const sameButton = openPanel && openPanel.button === button;
        closePanel();
        if (sameButton) return null;

        const panel = document.createElement("section");
        panel.className = "hdr-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", label);
        panel.innerHTML = `
            <div class="hdr-panel-header">
                <h3>${escapeHTML(label)}</h3>
                <button class="hdr-panel-close" type="button" aria-label="Close">×</button>
            </div>
            ${html}`;
        document.body.appendChild(panel);

        const rect = button.getBoundingClientRect();
        const width = panel.offsetWidth;
        panel.style.top = `${rect.bottom + 10}px`;
        panel.style.left = `${Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16))}px`;

        button.setAttribute("aria-expanded", "true");
        openPanel = { element: panel, button };
        panel.querySelector(".hdr-panel-close").addEventListener("click", closePanel);
        return panel;
    }


    function note({ icon, title, text, href }) {
        const tag = href ? "button" : "div";
        return `
            <${tag} class="hdr-note" ${href ? `type="button" data-go="${escapeHTML(href)}"` : ""}>
                <span class="hdr-note-icon">${ICONS[icon]}</span>
                <span><strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span></span>
            </${tag}>`;
    }


    function showNotifications(button) {
        const user = CampusAuth.user;
        const unread = CampusAuth.unread || 0;
        const notes = [];

        if (!user) {
            notes.push({ icon: "login", title: "Log in for message alerts", text: "See here when sellers reply to you.", href: CampusAuth.loginUrl() });
        } else if (unread) {
            notes.push({ icon: "message", title: `${unread} unread message${unread === 1 ? "" : "s"}`, text: "Tap to read and reply in Messages.", href: CampusAuth.url("messages/messages.html") });
        } else {
            notes.push({ icon: "check", title: "You're all caught up", text: "No unread messages.", href: CampusAuth.url("messages/messages.html") });
        }

        notes.push({ icon: "heart", title: "Save your favorites", text: "Tap the heart on any item to keep it in Favorites.", href: CampusAuth.url("favorites/favorites.html") });
        notes.push({ icon: "plus", title: "Post an item", text: "Have something useful to sell? Post it in a few steps.", href: CampusAuth.url("post-item/post-item.html") });

        const panel = togglePanel(button, "Notifications", `<div class="hdr-panel-body">${notes.map(note).join("")}</div>`);

        panel?.querySelectorAll("[data-go]").forEach(item => {
            item.addEventListener("click", () => go(item.dataset.go));
        });
    }


    /* Dark mode switch (js/theme.js), just above Log Out. */
    const themeSwitch = () => window.CampusTheme ? CampusTheme.switchHTML("hdr-menu-item") : "";


    function showProfile(button) {
        const user = CampusAuth.user;

        const menu = user
            ? [
                ...(user.role === "admin" ? [["admin", "shield", "Admin Dashboard"]] : []),
                ["profile", "user", "View Profile"],
                ["listings", "listings", "My Listings"],
                ["logout", "logout", "Log Out", "danger"]
            ]
            : [
                ["login", "login", "Log In"],
                ["signup", "signup", "Create an Account"]
            ];

        const panel = togglePanel(button, user ? "My Profile" : "Welcome", `
            <div class="hdr-profile">
                <div class="hdr-profile-top">
                    <div class="hdr-avatar">${user ? escapeHTML(user.initials) : "?"}</div>
                    <div>
                        <div class="hdr-profile-name">${user ? escapeHTML(user.name) : "You're not logged in"}</div>
                        <div class="hdr-profile-status${user ? "" : " guest"}">${user ? "● Verified student" : "Log in or sign up to buy and sell"}</div>
                    </div>
                </div>
                <div class="hdr-menu">
                    ${menu.map(([action, icon, label, tone]) => `
                    ${action === "logout" ? themeSwitch() : ""}
                    <button class="hdr-menu-item${tone ? ` ${tone}` : ""}" type="button" data-action="${action}">
                        ${ICONS[icon]}
                        <span>${label}</span>
                    </button>`).join("")}
                    ${user ? "" : themeSwitch()}
                </div>
            </div>
            <div class="hdr-panel-footer">
                <div class="hdr-footer-links">
                    <a href="${CampusAuth.url("about/about.html")}">About</a><a href="${CampusAuth.url("map/map.html")}">Campus Tour</a><a href="${CampusAuth.url("terms/terms.html")}">Terms and Conditions</a>
                </div>
                <p>Not affiliated with NORSU.</p>
            </div>`);

        panel?.querySelectorAll("[data-action]").forEach(item => {
            item.addEventListener("click", () => {
                const action = item.dataset.action;

                if (action === "admin") go(CampusAuth.url("admin/admin.html"));
                if (action === "profile") go(CampusAuth.url("profile/profile.html"));
                if (action === "listings") go(CampusAuth.url("profile/profile.html?open=listings"));
                if (action === "login") go(CampusAuth.loginUrl());
                if (action === "signup") go(CampusAuth.loginUrl() + "&tab=signup");

                if (action === "logout") {
                    item.disabled = true;
                    CampusAuth.logout().then(
                        () => go(CampusAuth.url("login/login.html?reason=signedout")),
                        error => {
                            item.disabled = false;
                            item.querySelector("span").textContent = error.message;
                        }
                    );
                }
            });
        });
    }


    /* =========================================================
       CART
    ========================================================= */

    function updateCart(button) {
        const badge = button.querySelector(".hdr-badge");
        let count = 0;

        try {
            const cart = JSON.parse(localStorage.getItem(CampusAuth.storageKey(CART_KEY)) || "[]");
            count = Array.isArray(cart) ? cart.length : 0;
        } catch { count = 0; }

        if (badge) {
            badge.textContent = count > 9 ? "9+" : String(count);
            badge.hidden = count === 0;
        }
        button.setAttribute("aria-label", count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart");
    }


    /* =========================================================
       START
    ========================================================= */

    function setup(container) {
        const bell = container.querySelector('[data-header="notifications"]');
        const cart = container.querySelector('[data-header="cart"]');
        const profile = container.querySelector('[data-header="profile"]');

        bell?.addEventListener("click", event => {
            event.stopPropagation();
            showNotifications(bell);
        });

        profile?.addEventListener("click", event => {
            event.stopPropagation();
            showProfile(profile);
        });

        // Marketplace (data-cart="page") opens its own cart; elsewhere go there.
        if (cart && cart.dataset.cart !== "page") {
            updateCart(cart);
            cart.addEventListener("click", () => go(CampusAuth.url("marketplace/marketplace.html?cart=1")));
            window.addEventListener("pageshow", event => {
                if (event.persisted) updateCart(cart);
            });
        }
    }


    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-header-actions]").forEach(setup);
    });

    document.addEventListener("click", event => {
        if (openPanel && !event.target.closest(".hdr-panel")) closePanel();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closePanel();
    });

    window.addEventListener("resize", closePanel);

})();
