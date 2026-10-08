/* =========================================================
   CAMPUS MARKETPLACE
   PHASE 1 — MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   STORAGE SAFETY
   ========================================================= */

// The previous prototype used this legacy key. Remove it once so
// stale test listings from an older build cannot leak into this build.
localStorage.removeItem("campusMarketplaceListings");

/* =========================================================
   PRODUCT DATA
   ========================================================= */

// Listings from the database, loaded on start (products.js).
const products = [];


/* =========================================================
   STATE
   ========================================================= */

let activeCategory = "All";

let searchTerm = "";

// Each account has its own favorites (see auth.js).
const favoritesKey =
    CampusAuth.storageKey("campusMarketplaceFavorites");

let favorites = new Set(
    JSON.parse(localStorage.getItem(favoritesKey) || "[]")
        .map(Number)
);

let carouselPage = 0;

let toastTimer = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const productGrid =
    document.getElementById("productGrid");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const categoryGrid =
    document.getElementById("categoryGrid");

const carouselDots =
    document.getElementById("carouselDots");

const addButton =
    document.getElementById("addButton");

const modalBackdrop =
    document.getElementById("modalBackdrop");

const closeModal =
    document.getElementById("closeModal");

const publishButton =
    document.getElementById("publishButton");

const itemName =
    document.getElementById("itemName");

const itemPrice =
    document.getElementById("itemPrice");

const itemCategory =
    document.getElementById("itemCategory");

const toast =
    document.getElementById("toast");

const navItems =
    document.querySelectorAll(".nav-item");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadProducts();

    setupSearch();

    setupCategories();

    setupModal();

    setupNavigation();

    setupCarousel();

});


/* =========================================================
   LOAD LISTINGS (everyone's posted items)
   ========================================================= */

function loadProducts() {

    if (productGrid) {
        productGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>Loading items…</p>
            </div>
        `;
    }

    CampusCatalog.load().then(
        items => {

            // Home features items that are still for sale.
            products.push(
                ...items.filter(item => item.status !== "sold")
            );

            renderProducts();

        },
        error => {

            if (productGrid) {
                productGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Items couldn't load</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                `;
            }

        }
    );
}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function getFilteredProducts() {

    return products.filter(product => {

        const matchesCategory =
            activeCategory === "All" ||
            product.category === activeCategory;

        const searchableText = [
            product.name,
            product.category,
            product.location,
            product.condition
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !searchTerm ||
            searchableText.includes(
                searchTerm.toLowerCase()
            );

        return matchesCategory && matchesSearch;
    });
}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

// Shown when an item photo cannot be loaded.
function fallbackImage(category) {

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">` +
        `<rect width="500" height="500" fill="#f1f4f8"/>` +
        `<circle cx="250" cy="210" r="95" fill="#e2e8f0"/>` +
        `<text x="250" y="345" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#1457d9">${escapeHTML(category || "Item")}</text>` +
        `</svg>`;

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}


function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";

    card.dataset.id = product.id;

    const isFavorite =
        favorites.has(product.id);


    card.innerHTML = `
        <div class="product-thumb">

            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
            >

            <button
                class="fav-toggle ${isFavorite ? "active" : ""}"
                type="button"
                aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
                aria-pressed="${isFavorite}"
                data-favorite="${product.id}"
            >
                ${isFavorite ? "♥" : "♡"}
            </button>

        </div>

        <div class="product-body">

            <div class="name">
                ${escapeHTML(product.name)}
            </div>

            <div class="price">
                ₱${Number(product.price).toLocaleString()}
            </div>

            <div class="meta">
                <span>📍 ${escapeHTML(product.location)}</span>
            </div>

            <div class="rating">
                🕒 ${escapeHTML(product.listedAgo || "Just now")}
            </div>

            <span class="badge">
                ${escapeHTML(product.condition)}
            </span>

        </div>
    `;


    card
        .querySelector("img")
        .addEventListener(
            "error",
            event => {
                event.currentTarget.src =
                    fallbackImage(product.category);
            },
            { once: true }
        );


    const favoriteButton =
        card.querySelector(
            "[data-favorite]"
        );


    favoriteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleFavorite(product.id);

        }
    );


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".fav-toggle"
                )
            ) {
                return;
            }

            showProduct(product);

        }
    );


    return card;
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

    if (!productGrid) {
        return;
    }

    const filtered =
        getFilteredProducts();


    productGrid.innerHTML = "";


    if (filtered.length === 0) {

        renderEmptyState();

        updateCarousel([]);

        return;
    }


    filtered.forEach(product => {

        const card =
            createProductCard(product);

        productGrid.appendChild(card);

    });


    hideEmptyState();

    carouselPage = 0;

    updateCarousel(filtered);
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function renderEmptyState() {

    if (!productGrid) {
        return;
    }


    productGrid.innerHTML = `
        <div
            class="empty-state"
            style="grid-column: 1 / -1;"
        >
            <h3>No items found</h3>

            <p>
                Try another search or category.
            </p>
        </div>
    `;

}


function hideEmptyState() {

    if (emptyState) {
        emptyState.hidden = true;
    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value.trim();

            carouselPage = 0;

            renderProducts();

        }
    );


    searchInput.addEventListener(
        "search",
        event => {

            searchTerm =
                event.target.value.trim();

            carouselPage = 0;

            renderProducts();

        }
    );

}


/* =========================================================
   CATEGORIES
   ========================================================= */

function setupCategories() {

    if (!categoryGrid) {
        return;
    }


    const categories =
        categoryGrid.querySelectorAll(
            ".category"
        );


    categories.forEach(category => {

        category.addEventListener(
            "click",
            () => {

                const selected =
                    category.dataset.category;


                activeCategory =
                    activeCategory === selected
                        ? "All"
                        : selected;


                categories.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item.dataset.category ===
                                activeCategory
                        );

                    }
                );


                carouselPage = 0;

                renderProducts();

            }
        );

    });

}


/* =========================================================
   FAVORITES
   ========================================================= */

function toggleFavorite(productId) {

    if (!CampusAuth.requireLogin("favorites")) {
        return;
    }


    if (favorites.has(productId)) {

        favorites.delete(productId);

        showToast(
            "Removed from favorites"
        );

    } else {

        favorites.add(productId);

        showToast(
            "Added to favorites ❤️"
        );

    }


    localStorage.setItem(
        favoritesKey,
        JSON.stringify([...favorites])
    );

    renderProducts();
}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

const MESSAGE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>';


function showProduct(product) {

    const overlay =
        document.createElement("div");

    overlay.className =
        "modal-backdrop product-preview";


    const mine =
        CampusCatalog.isMine(product, CampusAuth.user);

    const canMessage =
        !mine && CampusCatalog.sellerKey(product) != null;

    const seller =
        product.seller || "Campus Student";

    const sellerInitials =
        seller
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

    const favoriteLabel =
        () => favorites.has(product.id) ? "♥ Favorited" : "♡ Favorite";


    overlay.innerHTML = `
        <div
            class="modal product-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="${escapeHTML(product.name)}"
        >

            <button
                class="modal-close"
                type="button"
                aria-label="Close"
            >
                ×
            </button>

            <div class="preview-photo">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                >
            </div>

            <span class="preview-category">
                ${escapeHTML(product.category)}
            </span>

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <div class="preview-price">
                ₱${Number(product.price).toLocaleString()}
            </div>

            <p class="preview-meta">
                📍 ${escapeHTML(product.location)}
                · 🕒 Listed ${escapeHTML(product.listedAgo || "just now")}
                · ${escapeHTML(product.condition)}
            </p>

            <div class="preview-seller">

                <div class="preview-seller-avatar">
                    ${escapeHTML(sellerInitials)}
                </div>

                <div class="preview-seller-text">
                    <strong>${escapeHTML(seller)}</strong>
                    <span>${mine ? "Your listing" : "Campus seller"}</span>
                </div>

                ${canMessage ? `
                <button
                    class="message-seller-button"
                    type="button"
                    data-message
                >
                    ${MESSAGE_ICON}
                    <span>Message</span>
                </button>` : ""}

            </div>

            ${product.description ? `
            <p class="preview-description">
                ${escapeHTML(product.description)}
            </p>` : ""}

            <div class="preview-actions">

                <button
                    class="preview-secondary"
                    type="button"
                    data-favorite-toggle
                >
                    ${favoriteLabel()}
                </button>

                <button
                    class="publish-button"
                    type="button"
                    data-view
                >
                    View in Marketplace
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(overlay);

    CampusCatalog.countView(product.id);


    requestAnimationFrame(() => {

        overlay.classList.add("show");

    });


    overlay
        .querySelector("img")
        .addEventListener(
            "error",
            event => {
                event.currentTarget.src =
                    fallbackImage(product.category);
            },
            { once: true }
        );


    const closeOnEscape =
        event => {

            if (event.key === "Escape") {
                close();
            }

        };


    const close =
        () => {

            overlay.remove();

            document.removeEventListener(
                "keydown",
                closeOnEscape
            );

        };


    document.addEventListener(
        "keydown",
        closeOnEscape
    );


    overlay
        .querySelector(".modal-close")
        .addEventListener(
            "click",
            close
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                close();
            }

        }
    );


    // Opens the conversation with this item's seller.
    overlay
        .querySelector("[data-message]")
        ?.addEventListener(
            "click",
            () => {

                if (!CampusAuth.requireLogin("messages")) {
                    return;
                }

                window.location.href =
                    CampusCatalog.messageUrl(product);

            }
        );


    const favoriteToggle =
        overlay.querySelector("[data-favorite-toggle]");

    favoriteToggle.addEventListener(
        "click",
        () => {

            toggleFavorite(product.id);

            favoriteToggle.textContent =
                favoriteLabel();

        }
    );


    // Marketplace has the cart and checkout for this item.
    overlay
        .querySelector("[data-view]")
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    `marketplace/marketplace.html?item=${encodeURIComponent(product.id)}`;

            }
        );

}


/* =========================================================
   CAROUSEL
   ========================================================= */

function getCardsPerPage() {

    const width =
        window.innerWidth;


    if (width <= 430) {
        return 2;
    }


    if (width <= 768) {
        return 3;
    }


    // Matches the 4-column grid in desktop.css.
    if (width >= 1100) {
        return 4;
    }


    return 3;
}


function setupCarousel() {

    if (!productGrid) {
        return;
    }


    let touchStartX = 0;

    let touchEndX = 0;


    productGrid.addEventListener(
        "touchstart",
        event => {

            touchStartX =
                event.changedTouches[0].screenX;

        },
        {
            passive: true
        }
    );


    productGrid.addEventListener(
        "touchend",
        event => {

            touchEndX =
                event.changedTouches[0].screenX;

            const distance =
                touchEndX - touchStartX;


            if (
                Math.abs(distance) < 40
            ) {
                return;
            }


            if (distance < 0) {

                nextCarousel();

            } else {

                previousCarousel();

            }

        },
        {
            passive: true
        }
    );


    window.addEventListener(
        "resize",
        debounce(() => {

            carouselPage = 0;

            updateCarousel(
                getFilteredProducts()
            );

        }, 150)
    );

}


function updateCarousel(items) {

    if (!productGrid) {
        return;
    }


    const cards =
        Array.from(
            productGrid.querySelectorAll(
                ".product-card"
            )
        );


    if (cards.length === 0) {

        if (carouselDots) {
            carouselDots.innerHTML = "";
        }

        return;
    }


    const perPage =
        getCardsPerPage();


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                items.length / perPage
            )
        );


    if (
        carouselPage >= totalPages
    ) {
        carouselPage =
            totalPages - 1;
    }


    cards.forEach(
        (card, index) => {

            const start =
                carouselPage * perPage;

            const end =
                start + perPage;


            const visible =
                index >= start &&
                index < end;


            card.style.display =
                visible
                    ? ""
                    : "none";


            if (visible) {

                card.classList.remove(
                    "carousel-enter"
                );


                requestAnimationFrame(() => {

                    card.classList.add(
                        "carousel-enter"
                    );

                });

            }

        }
    );


    renderCarouselDots(
        totalPages
    );
}


function renderCarouselDots(
    totalPages
) {

    if (!carouselDots) {
        return;
    }


    carouselDots.innerHTML = "";


    if (totalPages <= 1) {
        return;
    }


    for (
        let index = 0;
        index < totalPages;
        index++
    ) {

        const dot =
            document.createElement(
                "button"
            );


        dot.type = "button";

        dot.className =
            index === carouselPage
                ? "active"
                : "";


        dot.setAttribute(
            "aria-label",
            `Go to slide ${index + 1}`
        );


        dot.addEventListener(
            "click",
            () => {

                carouselPage = index;

                updateCarousel(
                    getFilteredProducts()
                );

            }
        );


        carouselDots.appendChild(
            dot
        );

    }

}


function nextCarousel() {

    const items =
        getFilteredProducts();


    const perPage =
        getCardsPerPage();


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                items.length / perPage
            )
        );


    if (
        carouselPage <
        totalPages - 1
    ) {

        carouselPage++;

    } else {

        carouselPage = 0;

    }


    updateCarousel(items);
}


function previousCarousel() {

    const items =
        getFilteredProducts();


    const perPage =
        getCardsPerPage();


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                items.length / perPage
            )
        );


    if (carouselPage > 0) {

        carouselPage--;

    } else {

        carouselPage =
            totalPages - 1;

    }


    updateCarousel(items);
}


/* =========================================================
   MODAL — POST ITEM
   ========================================================= */

function setupModal() {

    if (!modalBackdrop) {
        return;
    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            openPostModal
        );

    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closePostModal
        );

    }


    modalBackdrop.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalBackdrop
            ) {

                closePostModal();

            }

        }
    );


    if (publishButton) {

        publishButton.addEventListener(
            "click",
            publishItem
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modalBackdrop.hidden
            ) {

                closePostModal();

            }

        }
    );

}


function openPostModal() {

    if (!modalBackdrop) {
        return;
    }


    modalBackdrop.hidden = false;

    document.body.style.overflow =
        "hidden";


    if (itemName) {
        setTimeout(
            () => itemName.focus(),
            50
        );
    }

}


function closePostModal() {

    if (!modalBackdrop) {
        return;
    }


    modalBackdrop.hidden = true;

    document.body.style.overflow =
        "";

}


function publishItem() {

    const name =
        itemName
            ? itemName.value.trim()
            : "";


    const price =
        itemPrice
            ? Number(itemPrice.value)
            : 0;


    const category =
        itemCategory
            ? itemCategory.value
            : "Others";


    if (!name) {

        showToast(
            "Please enter an item name"
        );

        itemName?.focus();

        return;
    }


    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {

        showToast(
            "Please enter a valid price"
        );

        itemPrice?.focus();

        return;
    }


    const newProduct = {

        id:
            Date.now(),

        name,

        price,

        category,

        location:
            "Campus",

        condition:
            "NEW",

        rating:
            5,

        image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"

    };


    products.unshift(
        newProduct
    );


    activeCategory = "All";

    searchTerm = "";

    carouselPage = 0;


    if (searchInput) {
        searchInput.value = "";
    }


    document
        .querySelectorAll(
            ".category"
        )
        .forEach(
            category => {

                category.classList.remove(
                    "active"
                );

            }
        );


    renderProducts();

    closePostModal();


    if (itemName) {
        itemName.value = "";
    }

    if (itemPrice) {
        itemPrice.value = "";
    }


    showToast(
        "Item posted successfully!"
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    const page =
                        item.dataset.page;


                    navItems.forEach(
                        nav => {

                            nav.classList.toggle(
                                "active",
                                nav === item
                            );

                        }
                    );


                    if (
                        page === "home"
                    ) {

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });

                        return;

                    }


                    if (
                        page === "marketplace"
                    ) {

                        showToast(
                            "Marketplace page coming soon"
                        );

                        return;

                    }


                    if (
                        page === "favorites"
                    ) {

                        if (
                            favorites.size === 0
                        ) {

                            showToast(
                                "You have no favorites yet"
                            );

                        } else {

                            showToast(
                                `${favorites.size} favorite${favorites.size === 1 ? "" : "s"} saved`
                            );

                        }

                        return;

                    }


                    if (
                        page === "profile"
                    ) {

                        showToast(
                            "Profile page coming soon"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(
    callback,
    delay
) {

    let timer;


    return function (...args) {

        clearTimeout(timer);


        timer =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   GLOBAL SAFETY
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "NORSU Campus Marketplace error:",
            event.error || event.message
        );

    }
);
/* =========================================================
   PHASE 1 FINAL ADDITIONS
   ========================================================= */

/*
 * IMPORTANT:
 * This block intentionally replaces the earlier header/navigation
 * behavior rather than adding duplicate click listeners.
 */

/* ---------- Sticky header + brand back-to-top ---------- */

(function setupPhase1Header() {

    const topbar = document.querySelector(".topbar");
    const brand = document.querySelector(".brand");

    if (!topbar) return;

    function updateHeader() {
        topbar.classList.toggle(
            "scrolled",
            window.scrollY > 12
        );
    }

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );

    updateHeader();

    if (brand) {

        brand.setAttribute("tabindex", "0");
        brand.setAttribute("role", "button");
        brand.setAttribute(
            "aria-label",
            "Return to top"
        );

        const goTop = () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        };

        brand.addEventListener("click", goTop);

        brand.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    goTop();
                }
            }
        );
    }

})();


/* ---------- Marketplace page navigation ---------- */

function goToMarketplace() {

    window.location.href =
        "marketplace/marketplace.html";
}


/* ---------- Replace old bottom-nav behavior ---------- */

function setupNavigation() {

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;

                navItems.forEach(nav => {

                    nav.classList.toggle(
                        "active",
                        nav === item
                    );

                });

                if (page === "home") {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                    return;
                }

                if (page === "marketplace") {

                    goToMarketplace();

                    return;
                }

                if (page === "favorites") {

                    window.location.href =
                        "favorites/favorites.html";

                    return;
                }

                if (page === "messages") {

                    window.location.href =
                        "messages/messages.html";

                    return;
                }

                if (page === "profile") {

                    window.location.href =
                        "profile/profile.html";

                }

            }
        );

    });

}


/* ---------- View All buttons ---------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const viewCategories =
            document.getElementById(
                "viewCategories"
            );

        const viewFeatured =
            document.getElementById(
                "viewFeatured"
            );

        // All categories live on the Marketplace page.
        if (viewCategories) {

            viewCategories.addEventListener(
                "click",
                goToMarketplace
            );

        }

        if (viewFeatured) {

            viewFeatured.addEventListener(
                "click",
                goToMarketplace
            );

        }

    }
);


/* ---------- Desktop carousel arrows ---------- */

(function setupDesktopCarouselArrows() {

    if (!productGrid) return;

    const featuredSection =
        document.querySelector(
            ".featured-section"
        );

    if (!featuredSection) return;

    const left =
        document.createElement("button");

    left.type = "button";
    left.className =
        "carousel-arrow carousel-arrow-left";
    left.setAttribute(
        "aria-label",
        "Previous featured items"
    );
    left.textContent = "‹";

    const right =
        document.createElement("button");

    right.type = "button";
    right.className =
        "carousel-arrow carousel-arrow-right";
    right.setAttribute(
        "aria-label",
        "Next featured items"
    );
    right.textContent = "›";

    featuredSection.appendChild(left);
    featuredSection.appendChild(right);

    left.addEventListener(
        "click",
        previousCarousel
    );

    right.addEventListener(
        "click",
        nextCarousel
    );

    function updateArrowVisibility() {

        const pages =
            Math.max(
                1,
                Math.ceil(
                    getFilteredProducts().length /
                    getCardsPerPage()
                )
            );

        left.hidden = pages <= 1;
        right.hidden = pages <= 1;

    }

    const originalUpdateCarousel =
        window.updateCarousel;

    /*
     * updateCarousel is a function declaration, so we refresh
     * arrow visibility whenever the existing carousel updates
     * by observing the dots container.
     */
    const observer =
        new MutationObserver(
            updateArrowVisibility
        );

    if (carouselDots) {

        observer.observe(
            carouselDots,
            {
                childList: true
            }
        );

    }

    window.addEventListener(
        "resize",
        updateArrowVisibility
    );

    setTimeout(
        updateArrowVisibility,
        50
    );

})();


/* Unified navigation post action */
(function campusNavPostHandler(){
  const post = document.querySelector('.sell-button, .add-button');
  if (!post) return;
  post.addEventListener('click', function(e){
    if (this.id === 'sellButton' && this.closest('.bottom-nav') && window.location.pathname.includes('/marketplace/')) {
      e.preventDefault();
    }
    const target = this.dataset.nav || 'post';
    if (target === 'post' && !this.closest('[data-post-bound]')) {
      window.location.href = 'post-item/post-item.html';
    }
  });
})();
