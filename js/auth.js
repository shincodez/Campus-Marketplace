/* =========================================================
   CAMPUS MARKETPLACE
   ACCOUNTS (shared by every page)

   Accounts are stored in the MySQL database and checked by
   the PHP files in /api, so a student has to sign up before
   they can log in. Open the site through XAMPP:
   http://localhost/campus-marketplace/

   Load it in each page's <head>, before the page script:
     <script src="../js/auth.js"></script>                       anyone can view
     <script src="../js/auth.js" data-auth="required"></script>  logged-in students only
     <script src="../js/auth.js" data-auth="guest"></script>     login page
========================================================= */

(function () {

    const script = document.currentScript;

    /* auth.js lives in js/, so the folder above it is the site root. */
    const root = new URL("..", script.src);

    const mode = script.dataset.auth || "public";

    const reason = script.dataset.authReason || "";

    const CACHE_KEY = "campusMarketplaceAccount";

    const pending = new Promise(() => {});

    let csrf = "";


    /* The old prototype "logged in" anyone with any email. */
    ["campusMarketplaceLoggedIn", "campusMarketplaceUser", "campusMarketplaceName"]
        .forEach(key => {
            try { localStorage.removeItem(key); } catch { /* storage blocked */ }
        });


    /* =========================================================
       CACHED ACCOUNT

       The last confirmed account is kept in localStorage so page
       scripts can read it right away. The server check below
       always has the final say.
    ========================================================= */

    function readCache() {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        } catch {
            return null;
        }
    }


    function writeCache(user) {
        try {
            if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
            else localStorage.removeItem(CACHE_KEY);
        } catch { /* storage blocked */ }
    }


    /* Returns true when a different account (or none) is now active. */
    function setUser(user) {
        const before = auth.user ? auth.user.id : null;
        const after = user ? user.id : null;

        auth.user = user || null;
        writeCache(auth.user);

        return before !== after;
    }


    /* =========================================================
       SERVER REQUESTS
    ========================================================= */

    function serverError() {
        const error = new Error(
            location.protocol === "file:"
                ? "This page was opened as a file. Accounts need the PHP server: start Apache and MySQL in XAMPP and open http://localhost/campus-marketplace/"
                : "Can't reach the account server. Start Apache and MySQL in XAMPP and open http://localhost/campus-marketplace/"
        );
        error.code = "offline";
        return error;
    }


    /* One session request at a time: two at once on a first visit would
       start two different sessions and one request would be refused. */
    let pendingSession = null;

    function loadSession() {
        pendingSession = pendingSession || request("session.php").finally(() => { pendingSession = null; });
        return pendingSession;
    }


    async function request(file, body, retry = true) {
        const options = {
            method: body === undefined ? "GET" : "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "fetch"
            }
        };

        // First contact: let the session start before any other request,
        // so every request uses the same session cookie.
        if (!csrf && file !== "session.php") await loadSession();

        if (body !== undefined) {
            options.headers["X-CSRF-Token"] = csrf;

            // FormData (photo uploads) sets its own multipart Content-Type.
            if (body instanceof FormData) {
                options.body = body;
            } else {
                options.headers["Content-Type"] = "application/json";
                options.body = JSON.stringify(body);
            }
        }

        let response;
        let data;

        try {
            response = await fetch(new URL("api/" + file, root), options);
            data = await response.json();
        } catch {
            throw serverError();
        }

        if (data.csrf) csrf = data.csrf;

        /* Token went stale (e.g. logged in on another tab): refresh it once. */
        if (data.code === "csrf" && retry) {
            await loadSession();
            return request(file, body, false);
        }

        if (!response.ok || data.ok === false) {
            const error = new Error(data.message || "Something went wrong. Please try again.");
            error.field = data.field || null;
            error.code = data.code || null;
            error.status = response.status;
            throw error;
        }

        return data;
    }


    /* =========================================================
       PAGE ACCESS
    ========================================================= */

    function loginUrl(why) {
        const url = new URL("login/login.html", root);
        url.searchParams.set("next", location.pathname + location.search + location.hash);
        if (why) url.searchParams.set("reason", why);
        return url.href;
    }


    /* Where to go after logging in: the ?next= page (same site only) or Home. */
    function nextUrl() {
        const next = new URLSearchParams(location.search).get("next");

        if (next) {
            try {
                const target = new URL(next, location.origin);
                if (target.origin === location.origin && !target.pathname.endsWith("/login/login.html")) {
                    return target.href;
                }
            } catch { /* ignore a malformed ?next= */ }
        }

        return new URL("index.html", root).href;
    }


    /* For actions like favoriting: guests are sent to log in first. */
    function requireLogin(why) {
        if (auth.user) return true;
        location.href = loginUrl(why);
        return false;
    }


    function hidePage() {
        document.documentElement.style.visibility = "hidden";
    }


    function showPage() {
        document.documentElement.style.visibility = "";
    }


    function showServerNotice(error) {
        const render = () => {
            if (document.getElementById("authServerNotice")) return;

            const notice = document.createElement("div");
            notice.id = "authServerNotice";
            notice.setAttribute("role", "alert");
            notice.style.cssText = [
                "position:fixed", "top:16px", "left:50%", "transform:translateX(-50%)",
                "z-index:10000", "visibility:visible", "width:min(560px,calc(100% - 32px))",
                "padding:16px 18px", "border-radius:16px", "border:1.5px solid #f5c2c0",
                "background:#fff", "color:#101828", "box-shadow:0 12px 32px rgba(16,24,40,.16)",
                "font:500 15px/1.5 Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif"
            ].join(";");

            const title = document.createElement("strong");
            title.style.cssText = "display:block;margin-bottom:4px;color:#b42318";
            title.textContent = "Accounts are unavailable";

            const text = document.createElement("span");
            text.textContent = error.message;

            notice.append(title, text);
            document.body.appendChild(notice);
        };

        if (document.body) render();
        else document.addEventListener("DOMContentLoaded", render);
    }


    /* Unread messages: red count on the Messages navigation item and
       the red dot on the header bell (header.js). */
    function refreshUnreadBadge() {
        const update = () => {
            const items = document.querySelectorAll('.nav-item[data-nav="messages"]');
            const dots = document.querySelectorAll('[data-header="notifications"] .hdr-dot');
            if (!auth.user || (!items.length && !dots.length)) return;

            request("messages.php?summary=1").then(data => {
                auth.unread = data.unread;
                dots.forEach(dot => { dot.hidden = !data.unread; });

                items.forEach(item => {
                    let badge = item.querySelector(".nav-badge");
                    if (!data.unread) {
                        badge?.remove();
                        return;
                    }
                    if (!badge) {
                        badge = document.createElement("b");
                        badge.className = "nav-badge";
                        item.appendChild(badge);
                    }
                    badge.textContent = data.unread > 9 ? "9+" : String(data.unread);
                    badge.setAttribute("aria-label", `${data.unread} unread`);
                });
            }, () => { /* badge is optional */ });
        };

        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", update);
        else update();
    }


    /* Ask the server who is logged in and apply the page's rule. */
    function verify() {
        return loadSession().then(
            data => {
                const changed = setUser(data.user);

                if (mode === "required" && !auth.user) {
                    location.replace(loginUrl(reason));
                    return pending;
                }

                if (mode === "guest" && auth.user) {
                    location.replace(nextUrl());
                    return pending;
                }

                /* Page scripts already used the old account: reload once with the right one. */
                if (changed && mode !== "guest" && (readCache()?.id ?? null) === (auth.user?.id ?? null)) {
                    location.reload();
                    return pending;
                }

                showPage();
                refreshUnreadBadge();
                return auth.user;
            },
            error => {
                showServerNotice(error);
                if (mode !== "required") showPage();
                return null;
            }
        );
    }


    /* =========================================================
       ACCOUNT ACTIONS
    ========================================================= */

    async function login(identifier, password) {
        const data = await request("login.php", { identifier, password });
        setUser(data.user);
        return data;
    }


    async function register(fields) {
        const data = await request("register.php", fields);
        setUser(data.user);
        return data;
    }


    async function logout() {
        const data = await request("logout.php", {});
        setUser(null);
        return data;
    }


    async function updateProfile(fields) {
        try {
            const data = await request("profile.php", fields);
            setUser(data.user);
            return data;
        } catch (error) {
            if (error.status === 401) {
                setUser(null);
                location.href = loginUrl("profile");
            }
            throw error;
        }
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    const auth = {
        /* Logged-in account ({ id, name, firstName, initials, email, studentId, campus, joined }) or null. */
        user: readCache(),

        /* Resolves once the server has confirmed the account. */
        ready: null,

        /* Unread messages (set by refreshUnreadBadge). */
        unread: 0,

        url: path => new URL(path, root).href,

        isLoggedIn: () => Boolean(auth.user),

        /* Keeps each account's favorites, cart, … separate in this browser. */
        storageKey: base => `${base}:${auth.user ? "user-" + auth.user.id : "guest"}`,

        loginUrl,
        nextUrl,
        requireLogin,
        login,
        register,
        logout,
        updateProfile,

        /* Call another endpoint in /api: api("messages.php") or api("messages.php", { to, body }). */
        api: request,

        refreshUnreadBadge
    };

    window.CampusAuth = auth;


    if (mode === "required" || (mode === "guest" && auth.user)) hidePage();

    auth.ready = verify();


    /* Back/forward cache: re-check so a signed-out page can't be revisited. */
    window.addEventListener("pageshow", event => {
        if (!event.persisted) return;
        if (mode === "required") hidePage();
        auth.ready = verify();
    });

})();
