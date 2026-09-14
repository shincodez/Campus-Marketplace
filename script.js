/* =========================================================
   CAMPUS MARKETPLACE
   PHASE 1 — MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   PRODUCT DATA
   ========================================================= */

const products = [
    {
        id: 1,
        name: "Casio FX-991ES Plus",
        price: 500,
        category: "Calculators",
        location: "Near Library",
        condition: "USED",
        rating: 4.8,
        image:
            "https://images.unsplash.com/photo-1596495578066-2e8a2f3f2f7e?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 2,
        name: "Calculus Textbook",
        price: 230,
        category: "Books",
        location: "Near Engineering",
        condition: "USED",
        rating: 4.7,
        image:
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 3,
        name: "Gray Hoodie",
        price: 400,
        category: "Uniforms",
        location: "Near Gate 3",
        condition: "USED",
        rating: 4.6,
        image:
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 4,
        name: "Wireless Earbuds",
        price: 650,
        category: "Electronics",
        location: "Near Student Center",
        condition: "LIKE NEW",
        rating: 4.9,
        image:
            "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 5,
        name: "Mechanical Keyboard",
        price: 1200,
        category: "Electronics",
        location: "Near Library",
        condition: "USED",
        rating: 4.8,
        image:
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 6,
        name: "Chemistry Book",
        price: 350,
        category: "Books",
        location: "Near Science Building",
        condition: "USED",
        rating: 4.5,
        image:
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 7,
        name: "Black Backpack",
        price: 550,
        category: "Supplies",
        location: "Near Gate 1",
        condition: "LIKE NEW",
        rating: 4.7,
        image:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 8,
        name: "Basketball",
        price: 450,
        category: "Sports",
        location: "Near Gym",
        condition: "USED",
        rating: 4.6,
        image:
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=700&q=80"
    },

    {
        id: 9,
        name: "Study Desk",
        price: 1500,
        category: "Furniture",
        location: "Near Dormitory",
        condition: "USED",
        rating: 4.8,
        image:
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=80"
    }
];


/* =========================================================
   STATE
   ========================================================= */

let activeCategory = "All";

let searchTerm = "";

const favorites = new Set();

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

const notificationButton =
    document.getElementById("notificationButton");

const profileButton =
    document.getElementById("profileButton");

const toast =
    document.getElementById("toast");

const navItems =
    document.querySelectorAll(".nav-item");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    renderProducts();

    setupSearch();

    setupCategories();

    setupModal();

    setupNavigation();

    setupHeaderButtons();

    setupCarousel();

});


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
                ★ ${product.rating}
            </div>

            <span class="badge">
                ${escapeHTML(product.condition)}
            </span>

        </div>
    `;


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


    renderProducts();
}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

function showProduct(product) {

    const overlay =
        document.createElement("div");

    overlay.className =
        "modal-backdrop product-preview";

    overlay.innerHTML = `
        <div
            class="modal product-preview-modal"
            role="dialog"
            aria-modal="true"
        >

            <button
                class="modal-close"
                aria-label="Close"
            >
                ×
            </button>

            <div
                style="
                    width:100%;
                    aspect-ratio:4/3;
                    overflow:hidden;
                    border-radius:14px;
                    background:#f2f4f7;
                    margin-bottom:18px;
                "
            >
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                    "
                >
            </div>

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <p>
                ${escapeHTML(product.category)}
            </p>

            <div
                style="
                    margin:12px 0;
                    color:#1554d1;
                    font-size:24px;
                    font-weight:800;
                "
            >
                ₱${Number(product.price).toLocaleString()}
            </div>

            <p>
                📍 ${escapeHTML(product.location)}
            </p>

            <p style="margin-top:6px;">
                ★ ${product.rating}
                · ${escapeHTML(product.condition)}
            </p>

            <button
                class="publish-button"
                type="button"
                data-contact
                style="margin-top:20px;"
            >
                Contact seller
            </button>

        </div>
    `;


    document.body.appendChild(overlay);


    requestAnimationFrame(() => {

        overlay.classList.add("show");

    });


    const close =
        () => {

            overlay.remove();

        };


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


    overlay
        .querySelector("[data-contact]")
        .addEventListener(
            "click",
            () => {

                showToast(
                    "Seller contact coming soon"
                );

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
   HEADER BUTTONS
   ========================================================= */

function setupHeaderButtons() {

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showToast(
                    "No new notifications"
                );

            }
        );

    }


    if (profileButton) {

        profileButton.addEventListener(
            "click",
            () => {

                showToast(
                    "Profile page coming soon"
                );

            }
        );

    }

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
            "Campus Marketplace error:",
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


/* ---------- Header panel helpers ---------- */

let phase1OpenPanel = null;

function closePhase1Panel() {

    if (phase1OpenPanel) {
        phase1OpenPanel.remove();
        phase1OpenPanel = null;
    }

    document.body.classList.remove(
        "phase1-panel-open"
    );
}


function openPhase1Panel(content, anchor) {

    closePhase1Panel();

    const panel =
        document.createElement("section");

    panel.className = "phase1-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");

    panel.innerHTML = content;

    document.body.appendChild(panel);

    phase1OpenPanel = panel;

    const close =
        panel.querySelector(
            ".phase1-panel-close"
        );

    if (close) {
        close.addEventListener(
            "click",
            closePhase1Panel
        );
    }

    document.body.classList.add(
        "phase1-panel-open"
    );

    requestAnimationFrame(() => {

        const rect =
            anchor?.getBoundingClientRect();

        if (rect) {

            const panelWidth =
                Math.min(
                    360,
                    window.innerWidth - 32
                );

            let left =
                rect.right - panelWidth;

            left =
                Math.max(
                    16,
                    Math.min(
                        left,
                        window.innerWidth -
                        panelWidth -
                        16
                    )
                );

            panel.style.left =
                `${left}px`;

            panel.style.right = "auto";
        }

    });
}


/* Close a panel when clicking outside it. */
document.addEventListener(
    "click",
    event => {

        if (!phase1OpenPanel) return;

        const clickedPanel =
            event.target.closest(
                ".phase1-panel"
            );

        const clickedHeaderButton =
            event.target.closest(
                "#notificationButton, #profileButton"
            );

        if (
            !clickedPanel &&
            !clickedHeaderButton
        ) {
            closePhase1Panel();
        }

    }
);


/* ---------- Real notification panel ---------- */

function showNotifications() {

    const content = `
        <div class="phase1-panel-header">
            <h3>Notifications</h3>

            <button
                class="phase1-panel-close"
                type="button"
                aria-label="Close notifications"
            >×</button>
        </div>

        <div class="phase1-panel-body">

            <div class="phase1-notification">
                <div class="phase1-notification-icon">♥</div>

                <div>
                    <strong>Favorites are ready</strong>
                    <span>
                        Items you favorite will appear in your
                        Favorites section.
                    </span>
                </div>
            </div>

            <div class="phase1-notification">
                <div class="phase1-notification-icon">+</div>

                <div>
                    <strong>Post an item</strong>
                    <span>
                        Have something useful to sell?
                        Use the + button to post it.
                    </span>
                </div>
            </div>

        </div>
    `;

    openPhase1Panel(
        content,
        notificationButton
    );
}


/* ---------- Real profile panel ---------- */

function showProfile() {

    const content = `
        <div class="phase1-panel-header">
            <h3>My Profile</h3>

            <button
                class="phase1-panel-close"
                type="button"
                aria-label="Close profile"
            >×</button>
        </div>

        <div class="phase1-profile">

            <div class="phase1-profile-top">

                <div class="phase1-avatar">
                    ME
                </div>

                <div>
                    <div class="phase1-profile-name">
                        Campus Student
                    </div>

                    <div class="phase1-profile-status">
                        ● Verified student
                    </div>
                </div>

            </div>

            <div class="phase1-profile-actions">

                <button
                    class="phase1-profile-action"
                    type="button"
                    data-profile-action="favorites"
                >
                    ♥ My Favorites
                </button>

                <button
                    class="phase1-profile-action"
                    type="button"
                    data-profile-action="sell"
                >
                    + Post an Item
                </button>

                <button
                    class="phase1-profile-action"
                    type="button"
                    data-profile-action="close"
                >
                    Close
                </button>

            </div>

        </div>
    `;

    openPhase1Panel(
        content,
        profileButton
    );

    phase1OpenPanel
        ?.querySelectorAll(
            "[data-profile-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.profileAction;

                    closePhase1Panel();

                    if (
                        action === "favorites"
                    ) {
                        showFavorites();
                    }

                    if (
                        action === "sell"
                    ) {
                        openPostModal();
                    }

                }
            );

        });
}


/* ---------- Replace old header toast behavior ---------- */

function setupHeaderButtons() {

    if (notificationButton) {

        notificationButton.onclick =
            event => {

                event.stopPropagation();

                showNotifications();

            };
    }

    if (profileButton) {

        profileButton.onclick =
            event => {

                event.stopPropagation();

                showProfile();

            };
    }
}


/* ---------- Favorites page/section ---------- */

function showFavorites() {

    closePhase1Panel();

    const items =
        products.filter(product =>
            favorites.has(product.id)
        );

    navItems.forEach(nav => {
        nav.classList.toggle(
            "active",
            nav.dataset.page === "favorites"
        );
    });

    productGrid?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    if (items.length === 0) {

        showToast(
            "You have no favorites yet"
        );

        return;
    }

    productGrid.innerHTML = "";

    items.forEach(product => {

        productGrid.appendChild(
            createProductCard(product)
        );

    });

    carouselPage = 0;

    updateCarousel(items);

    showToast(
        `${items.length} favorite${items.length === 1 ? "" : "s"} shown`
    );
}


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

                    showFavorites();

                    return;
                }

                if (page === "profile") {

                    showProfile();

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

        if (viewCategories) {

            viewCategories.addEventListener(
                "click",
                () => {

                    const firstCategory =
                        document.querySelector(
                            ".category"
                        );

                    document
                        .querySelector(
                            ".categories-section"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    firstCategory?.focus();

                }
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


/* ---------- ESC closes Phase 1 panels ---------- */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            phase1OpenPanel
        ) {
            closePhase1Panel();
        }

    }
);
