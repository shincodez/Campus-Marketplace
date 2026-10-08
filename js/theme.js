/* =========================================================
   NORSU CAMPUS MARKETPLACE — LIGHT / DARK THEME
   Loaded first in <head> on every page, so the right theme is set
   before anything is drawn (no white flash on dark mode).

   Follows the device's light/dark setting until the user picks one
   with a [data-theme-toggle] switch; that choice is remembered and
   shared with other open tabs. Pressing a switch reveals the new
   theme as a circle growing out of that switch.

   Dark colors: generated blocks at the end of each css/*.css file
   (tools/dark-theme.py) plus hand-tuned fixes in css/theme.css.
   ========================================================= */

(function () {

    const KEY = "campusMarketplaceTheme";
    const root = document.documentElement;
    const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

    const REVEAL_MS = 650;

    const ICONS = {
        moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
        sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
    };

    function saved() {
        try {
            const value = localStorage.getItem(KEY);
            return value === "dark" || value === "light" ? value : null;
        } catch {
            return null;
        }
    }

    const preferred = () => saved() || (media && media.matches ? "dark" : "light");
    const isDark = () => root.dataset.theme === "dark";


    /* Switches show "on" in dark mode; icon-only buttons show the theme they switch to. */
    function sync(button) {
        button.setAttribute("aria-checked", String(isDark()));
        const icon = button.querySelector("[data-theme-icon]");
        if (icon) icon.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
    }

    function apply(theme, initial = false) {
        // Switch every color at once instead of letting each element's transition lag behind.
        if (!initial) root.classList.add("theme-switching");
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        document.querySelectorAll("[data-theme-toggle]").forEach(sync);
        if (!initial) {
            getComputedStyle(root).color; // apply the new colors now, while transitions are off
            root.classList.remove("theme-switching");
        }
    }

    function set(theme) {
        try { localStorage.setItem(KEY, theme); } catch { /* private mode: still switch for this page */ }
        apply(theme);
    }

    /* Switch themes; with a button, the new theme grows out of it as a circle
       (View Transitions API, see ::view-transition rules in css/theme.css).
       Without that API, or with reduced motion turned on, it switches at once. */
    function toggle(button) {
        const next = isDark() ? "light" : "dark";
        if (!button || !document.startViewTransition || reduceMotion?.matches) {
            set(next);
            return;
        }

        const box = button.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        // Far enough to reach the corner of the screen farthest from the button.
        const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

        const transition = document.startViewTransition(() => set(next));
        transition.ready.then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                { duration: REVEAL_MS, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
            );
        }).catch(() => { /* skipped, e.g. by a quick second press: the theme still changed */ });
    }


    /* A labelled switch, e.g. for a menu or the sidebar. */
    function switchHTML(className = "") {
        return `
            <button class="theme-switch ${className}" type="button" role="switch" aria-checked="${isDark()}" data-theme-toggle>
                ${ICONS.moon}
                <span class="theme-switch-label">Dark mode</span>
                <span class="theme-switch-track" aria-hidden="true"><span class="theme-switch-thumb"></span></span>
            </button>`;
    }


    apply(preferred(), true);

    // Device setting changed and the user hasn't picked: follow it.
    media?.addEventListener?.("change", () => { if (!saved()) apply(preferred()); });

    // Picked in another tab.
    window.addEventListener("storage", event => { if (event.key === KEY) apply(preferred()); });

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-theme-toggle]");
        if (button) toggle(button);
    });

    document.addEventListener("DOMContentLoaded", () => {
        // Desktop sidebar: the switch sits above About / Campus Tour / Terms.
        document.querySelectorAll(".bottom-nav .nav-footer").forEach(footer => {
            if (!footer.querySelector("[data-theme-toggle]")) footer.insertAdjacentHTML("afterbegin", switchHTML("nav-theme-switch"));
        });
        document.querySelectorAll("[data-theme-toggle]").forEach(sync);
    });

    window.CampusTheme = { isDark, set, toggle, switchHTML };

})();
