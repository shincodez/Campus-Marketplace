/* ============================================================
   CAMPUS MARKETPLACE
   MOBILE PROTOTYPE
   ============================================================ */


/* ============================================================
   PRODUCT DATA
   ============================================================ */

const products = [

    {
        name: "Casio FX-991ES Plus",
        price: "₱500",
        category: "Calculators",
        location: "Near Library",
        rating: "4.8",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1596495578063-6e0763fa1178?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Calculus Textbook",
        price: "₱230",
        category: "Books",
        location: "Near Engineering",
        rating: "4.7",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7b?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Gray Hoodie",
        price: "₱400",
        category: "Uniforms",
        location: "Near Gate 3",
        rating: "4.9",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Wireless Earbuds",
        price: "₱1,200",
        category: "Electronics",
        location: "Near Student Center",
        rating: "4.8",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Mechanical Keyboard",
        price: "₱1,500",
        category: "Electronics",
        location: "Near Engineering",
        rating: "4.7",
        badge: "Reserved",
        image:
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Chemistry Book",
        price: "₱300",
        category: "Books",
        location: "Near Library",
        rating: "4.9",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80"
    },

    {
        name: "Black Backpack",
        price: "₱800",
        category: "Supplies",
        location: "Near Gate 2",
        rating: "4.6",
        badge: "Used",
        image:
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
    }

];


/* ============================================================
   STATE
   ============================================================ */

let activeCategory = "All";

const favorites = new Set();


/* ============================================================
   DOM
   ============================================================ */

const productGrid =
    document.getElementById("productGrid");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const searchForm =
    document.getElementById("searchForm");

const categoryGrid =
    document.getElementById("categoryGrid");

const clearCategory =
    document.getElementById("clearCategory");

const resetSearch =
    document.getElementById("resetSearch");

const featuredViewAll =
    document.getElementById("featuredViewAll");

const notificationButton =
    document.getElementById("notificationButton");

const profileButton =
    document.getElementById("profileButton");

const favoritesNav =
    document.getElementById("favoritesNav");

const profileNav =
    document.getElementById("profileNav");

const postButton =
    document.getElementById("postButton");

const modalBackdrop =
    document.getElementById("modalBackdrop");

const closeModal =
    document.getElementById("closeModal");

const publishButton =
    document.getElementById("publishButton");

const itemName =
    document.getElementById("itemName");

const toast =
    document.getElementById("toast");


/* ============================================================
   LOGIN
   ============================================================ */

function isLoggedIn() {

    return (
        localStorage.getItem(
            "campusMarketplaceLoggedIn"
        ) === "true"
    );

}


function goToLogin() {

    window.location.href =
        "login/login.html";

}


/* ============================================================
   TOAST
   ============================================================ */

let toastTimer = null;


function showToast(message) {

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2400);

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   FALLBACK IMAGE
   ============================================================ */

function createFallbackImage(productName) {

    const svg = `

        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 800"
        >

            <rect
                width="800"
                height="800"
                fill="#f3f5f8"
            />

            <circle
                cx="400"
                cy="350"
                r="95"
                fill="#eaf1ff"
            />

            <text
                x="400"
                y="505"
                text-anchor="middle"
                font-family="Arial"
                font-size="32"
                font-weight="700"
                fill="#1554d1"
            >
                ${escapeHtml(productName)}
            </text>

        </svg>

    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}


/* ============================================================
   FILTER
   ============================================================ */

function getFilteredProducts() {

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    return products.filter(product => {

        const categoryMatches =
            activeCategory === "All" ||
            product.category === activeCategory;


        const searchableText = [

            product.name,
            product.category,
            product.location

        ]
            .join(" ")
            .toLowerCase();


        const searchMatches =
            searchTerm === "" ||
            searchableText.includes(
                searchTerm
            );


        return (
            categoryMatches &&
            searchMatches
        );

    });

}


/* ============================================================
   PRODUCT CARD
   ============================================================ */

function createProductCard(product) {

    const article =
        document.createElement("article");


    article.className =
        "product-card";


    article.dataset.product =
        product.name;


    const isFavorite =
        favorites.has(product.name);


    const badgeClass =
        product.badge
            .toLowerCase()
            .replace(/\s+/g, "-");


    article.innerHTML = `

        <div class="product-thumb">

            <img
                src="${product.image}"
                alt="${escapeHtml(product.name)}"
                loading="lazy"
            >


            <span
                class="badge ${badgeClass}"
            >
                ${escapeHtml(product.badge)}
            </span>


            <button
                class="fav-toggle ${
                    isFavorite
                        ? "is-fav"
                        : ""
                }"
                type="button"
                data-favorite="${escapeHtml(product.name)}"
                aria-label="${
                    isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                }"
                aria-pressed="${isFavorite}"
            >

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >

                    <path
                        d="
                            M20.8 8.7
                            C20.8 5.7 18.7 4 16.2 4
                            C14.4 4 12.9 5 12 6.4
                            C11.1 5 9.6 4 7.8 4
                            C5.3 4 3.2 5.7 3.2 8.7
                            C3.2 13.1 8.1 16.4 12 20
                            C15.9 16.4 20.8 13.1 20.8 8.7Z
                        "
                    ></path>

                </svg>

            </button>

        </div>


        <div class="product-body">

            <div class="name">
                ${escapeHtml(product.name)}
            </div>


            <div class="price">
                ${escapeHtml(product.price)}
            </div>


            <div class="meta">

                <span aria-hidden="true">
                    📍
                </span>

                <span>
                    ${escapeHtml(product.location)}
                </span>

            </div>


            <div class="rating">
                ★ ${escapeHtml(product.rating)}
            </div>

        </div>

    `;


    /* Image fallback */

    const image =
        article.querySelector(
            ".product-thumb img"
        );


    if (image) {

        image.addEventListener(
            "error",
            () => {

                image.src =
                    createFallbackImage(
                        product.name
                    );

            },
            {
                once: true
            }
        );

    }


    return article;

}


/* ============================================================
   RENDER
   ============================================================ */

function renderProducts() {

    if (!productGrid) {
        return;
    }


    const filtered =
        getFilteredProducts();


    productGrid.innerHTML = "";


    filtered.forEach(product => {

        productGrid.appendChild(
            createProductCard(product)
        );

    });


    if (emptyState) {

        emptyState.classList.toggle(
            "hidden",
            filtered.length !== 0
        );

    }

}


/* ============================================================
   CATEGORY
   ============================================================ */

function setActiveCategory(category) {

    activeCategory = category;


    if (categoryGrid) {

        const buttons =
            categoryGrid.querySelectorAll(
                ".category-card"
            );


        buttons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category ===
                    activeCategory
            );

        });

    }


    renderProducts();

}


/* ============================================================
   CATEGORY CLICK
   ============================================================ */

if (categoryGrid) {

    categoryGrid.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".category-card"
                );


            if (!button) {
                return;
            }


            const category =
                button.dataset.category;


            if (!category) {
                return;
            }


            setActiveCategory(
                category
            );

        }
    );

}


/* ============================================================
   VIEW ALL CATEGORIES
   ============================================================ */

if (clearCategory) {

    clearCategory.addEventListener(
        "click",
        () => {

            activeCategory = "All";


            if (searchInput) {

                searchInput.value = "";

            }


            if (categoryGrid) {

                categoryGrid
                    .querySelectorAll(
                        ".category-card"
                    )
                    .forEach(button => {

                        button.classList.remove(
                            "active"
                        );

                    });

            }


            renderProducts();


            showToast(
                "Showing all campus items."
            );

        }
    );

}


/* ============================================================
   FEATURED VIEW ALL
   ============================================================ */

if (featuredViewAll) {

    featuredViewAll.addEventListener(
        "click",
        () => {

            activeCategory = "All";


            if (searchInput) {

                searchInput.value = "";

            }


            if (categoryGrid) {

                categoryGrid
                    .querySelectorAll(
                        ".category-card"
                    )
                    .forEach(button => {

                        button.classList.remove(
                            "active"
                        );

                    });

            }


            renderProducts();


            document
                .getElementById(
                    "marketplace"
                )
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );

}


/* ============================================================
   SEARCH
   ============================================================ */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            renderProducts();

        }
    );

}


/* Live search */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            renderProducts();

        }
    );

}


/* ============================================================
   RESET SEARCH
   ============================================================ */

if (resetSearch) {

    resetSearch.addEventListener(
        "click",
        () => {

            if (searchInput) {

                searchInput.value = "";

            }


            activeCategory = "All";


            if (categoryGrid) {

                categoryGrid
                    .querySelectorAll(
                        ".category-card"
                    )
                    .forEach(button => {

                        button.classList.remove(
                            "active"
                        );

                    });

            }


            renderProducts();


            showToast(
                "Search cleared."
            );

        }
    );

}


/* ============================================================
   FAVORITES
   ============================================================ */

if (productGrid) {

    productGrid.addEventListener(
        "click",
        event => {

            const favoriteButton =
                event.target.closest(
                    ".fav-toggle"
                );


            if (!favoriteButton) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();


            if (!isLoggedIn()) {

                showToast(
                    "Please login to save favorites."
                );


                setTimeout(
                    goToLogin,
                    650
                );


                return;

            }


            const productName =
                favoriteButton.dataset.favorite;


            if (!productName) {
                return;
            }


            if (
                favorites.has(
                    productName
                )
            ) {

                favorites.delete(
                    productName
                );


                favoriteButton.classList.remove(
                    "is-fav"
                );


                favoriteButton.setAttribute(
                    "aria-pressed",
                    "false"
                );


                favoriteButton.setAttribute(
                    "aria-label",
                    "Add to favorites"
                );


                showToast(
                    "Removed from favorites."
                );

            } else {

                favorites.add(
                    productName
                );


                favoriteButton.classList.add(
                    "is-fav"
                );


                favoriteButton.setAttribute(
                    "aria-pressed",
                    "true"
                );


                favoriteButton.setAttribute(
                    "aria-label",
                    "Remove from favorites"
                );


                showToast(
                    "Added to favorites."
                );

            }

        }
    );

}


/* ============================================================
   PRODUCT CLICK
   ============================================================ */

if (productGrid) {

    productGrid.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".fav-toggle"
                )
            ) {
                return;
            }


            const card =
                event.target.closest(
                    ".product-card"
                );


            if (!card) {
                return;
            }


            const productName =
                card.dataset.product;


            const product =
                products.find(
                    item =>
                        item.name ===
                        productName
                );


            if (!product) {
                return;
            }


            showToast(
                `${product.name} • ${product.price}`
            );

        }
    );

}


/* ============================================================
   POST MODAL
   ============================================================ */

function openPostModal() {

    if (!isLoggedIn()) {

        showToast(
            "Please login before posting an item."
        );


        setTimeout(
            goToLogin,
            650
        );


        return;

    }


    if (!modalBackdrop) {
        return;
    }


    modalBackdrop.classList.add(
        "open"
    );


    if (itemName) {

        setTimeout(
            () => itemName.focus(),
            100
        );

    }

}


function closePostModal() {

    if (!modalBackdrop) {
        return;
    }


    modalBackdrop.classList.remove(
        "open"
    );

}


if (postButton) {

    postButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openPostModal();

        }
    );

}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closePostModal
    );

}


/* Click outside modal */

if (modalBackdrop) {

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

}


/* Escape */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closePostModal();

        }

    }
);


/* ============================================================
   PUBLISH
   ============================================================ */

if (publishButton) {

    publishButton.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if (!itemName) {
                return;
            }


            const name =
                itemName.value.trim();


            if (!name) {

                showToast(
                    "Please enter an item name."
                );


                itemName.focus();

                return;

            }


            closePostModal();


            itemName.value = "";


            showToast(
                "Listing draft started."
            );

        }
    );

}


/* ============================================================
   NOTIFICATIONS
   ============================================================ */

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            if (!isLoggedIn()) {

                showToast(
                    "Please login to view notifications."
                );


                setTimeout(
                    goToLogin,
                    650
                );


                return;

            }


            showToast(
                "No new notifications."
            );

        }
    );

}


/* ============================================================
   PROFILE HEADER
   ============================================================ */

if (profileButton) {

    profileButton.addEventListener(
        "click",
        () => {

            if (!isLoggedIn()) {

                goToLogin();

                return;

            }


            const name =
                localStorage.getItem(
                    "campusMarketplaceName"
                );


            const email =
                localStorage.getItem(
                    "campusMarketplaceUser"
                );


            if (name) {

                showToast(
                    `Welcome back, ${name}!`
                );

            } else if (email) {

                showToast(
                    `Logged in as ${email}.`
                );

            } else {

                showToast(
                    "Profile coming next."
                );

            }

        }
    );

}


/* ============================================================
   FAVORITES BOTTOM NAV
   ============================================================ */

if (favoritesNav) {

    favoritesNav.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if (!isLoggedIn()) {

                showToast(
                    "Please login to view favorites."
                );


                setTimeout(
                    goToLogin,
                    650
                );


                return;

            }


            showToast(
                "Favorites page coming next."
            );

        }
    );

}


/* ============================================================
   PROFILE BOTTOM NAV
   ============================================================ */

if (profileNav) {

    profileNav.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if (!isLoggedIn()) {

                goToLogin();

                return;

            }


            showToast(
                "Profile page coming next."
            );

        }
    );

}


/* ============================================================
   BOTTOM NAV ACTIVE STATE
   ============================================================ */

const bottomNavItems =
    document.querySelectorAll(
        ".bottom-nav-item"
    );


bottomNavItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            bottomNavItems.forEach(
                navItem => {

                    navItem.classList.remove(
                        "active"
                    );

                }
            );


            item.classList.add(
                "active"
            );

        }
    );

});


/* ============================================================
   INITIAL RENDER
   ============================================================ */

renderProducts();


/* ============================================================
   GLOBAL API
   Useful for future pages
   ============================================================ */

window.CampusMarketplace = {

    products,

    favorites,

    isLoggedIn,

    showToast,

    renderProducts,

    setActiveCategory

};