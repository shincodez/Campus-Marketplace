/* =========================================
   CAMPUS MARKETPLACE
   ACTUAL MARKETPLACE JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       PRODUCT DATA
    ====================================== */

    const products = [
        {
            id: 1,
            name: "Wireless Earbuds",
            price: 1200,
            category: "Electronics",
            location: "Near Student Center",
            rating: 4.8,
            condition: "Used",
            seller: "Alex D.",
            image:
                "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80",
            description:
                "Wireless earbuds in good working condition. Includes charging case."
        },

        {
            id: 2,
            name: "Mechanical Keyboard",
            price: 1500,
            category: "Electronics",
            location: "Near Engineering",
            rating: 4.7,
            condition: "Used",
            seller: "Mark R.",
            image:
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80",
            description:
                "Mechanical keyboard with RGB lighting. Great for studying, programming, and gaming."
        },

        {
            id: 3,
            name: "Chemistry Book",
            price: 300,
            category: "Books",
            location: "Near Library",
            rating: 4.9,
            condition: "Used",
            seller: "Jamie C.",
            image:
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80",
            description:
                "General Chemistry reference book. Some notes inside but all pages are complete."
        },

        {
            id: 4,
            name: "Nike Backpack",
            price: 800,
            category: "Supplies",
            location: "Near Gate 2",
            rating: 4.6,
            condition: "Used",
            seller: "Chris M.",
            image:
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
            description:
                "Black Nike backpack with multiple compartments. Good condition."
        },

        {
            id: 5,
            name: "Gray Hoodie",
            price: 400,
            category: "Uniforms",
            location: "Near Gate 3",
            rating: 4.5,
            condition: "Used",
            seller: "Taylor P.",
            image:
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80",
            description:
                "Comfortable gray hoodie. Medium size and lightly used."
        },

        {
            id: 6,
            name: "Scientific Calculator",
            price: 600,
            category: "Supplies",
            location: "Near Library",
            rating: 4.8,
            condition: "Used",
            seller: "Sam L.",
            image:
                "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=700&q=80",
            description:
                "Scientific calculator suitable for engineering, mathematics, and science subjects."
        },

        {
            id: 7,
            name: "Casio FX-991ES Plus",
            price: 500,
            category: "Supplies",
            location: "Near Library",
            rating: 4.8,
            condition: "Used",
            seller: "Jordan T.",
            image:
                "https://images.unsplash.com/photo-1596495578061-4e5d5d4f1b8f?auto=format&fit=crop&w=700&q=80",
            description:
                "Reliable scientific calculator for university mathematics and engineering subjects."
        },

        {
            id: 8,
            name: "Calculus Textbook",
            price: 230,
            category: "Books",
            location: "Near Engineering",
            rating: 4.7,
            condition: "Used",
            seller: "Pat G.",
            image:
                "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=80",
            description:
                "Calculus textbook with useful examples and exercises for college students."
        }
    ];


    /* =====================================
       STATE
    ====================================== */

    let activeCategory = "All";

    let searchTerm = "";

    let selectedCondition = "All";

    let sortType = "popular";

    let favorites =
        JSON.parse(
            localStorage.getItem("campusMarketplaceFavorites") || "[]"
        );

    let cart =
        JSON.parse(
            localStorage.getItem("campusMarketplaceCart") || "[]"
        );


    /* =====================================
       ELEMENTS
    ====================================== */

    const productList =
        document.getElementById("productList");

    const searchInput =
        document.getElementById("searchInput");

    const clearSearch =
        document.getElementById("clearSearch");

    const categoryList =
        document.getElementById("categoryList");

    const resultsCount =
        document.getElementById("resultsCount");

    const emptyState =
        document.getElementById("emptyState");

    const resetButton =
        document.getElementById("resetButton");

    const filterButton =
        document.getElementById("filterButton");

    const filterOverlay =
        document.getElementById("filterOverlay");

    const closeFilter =
        document.getElementById("closeFilter");

    const clearFilters =
        document.getElementById("clearFilters");

    const applyFilters =
        document.getElementById("applyFilters");

    const sortSelect =
        document.getElementById("sortSelect");

    const productOverlay =
        document.getElementById("productOverlay");

    const productDetails =
        document.getElementById("productDetails");

    const closeProduct =
        document.getElementById("closeProduct");

    const cartButton =
        document.getElementById("cartButton");

    const cartCount =
        document.getElementById("cartCount");

    const cartOverlay =
        document.getElementById("cartOverlay");

    const cartContent =
        document.getElementById("cartContent");

    const closeCart =
        document.getElementById("closeCart");

    const menuButton =
        document.getElementById("menuButton");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const closeMenu =
        document.getElementById("closeMenu");

    const sellButton =
        document.getElementById("sellButton");

    const viewAllButton =
        document.getElementById("viewAllButton");

    const toast =
        document.getElementById("toast");


    /* =====================================
       HELPERS
    ====================================== */

    function formatPrice(price) {
        return `₱${price.toLocaleString("en-PH")}`;
    }


    function saveFavorites() {
        localStorage.setItem(
            "campusMarketplaceFavorites",
            JSON.stringify(favorites)
        );
    }


    function saveCart() {
        localStorage.setItem(
            "campusMarketplaceCart",
            JSON.stringify(cart)
        );
    }


    function showToast(message) {

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }


    function isFavorite(productId) {
        return favorites.includes(productId);
    }


    function isInCart(productId) {
        return cart.includes(productId);
    }


    /* =====================================
       FILTER PRODUCTS
    ====================================== */

    function getFilteredProducts() {

        let filtered = [...products];


        /* Category */

        if (
            activeCategory !== "All" &&
            activeCategory !== "More"
        ) {

            filtered = filtered.filter(
                product =>
                    product.category === activeCategory
            );

        }


        /* More */

        if (activeCategory === "More") {

            filtered = filtered.filter(
                product =>
                    ![
                        "Books",
                        "Electronics",
                        "Uniforms",
                        "Supplies"
                    ].includes(product.category)
            );

        }


        /* Search */

        if (searchTerm.trim()) {

            const query =
                searchTerm.toLowerCase().trim();

            filtered = filtered.filter(product => {

                return (
                    product.name.toLowerCase().includes(query) ||
                    product.category.toLowerCase().includes(query) ||
                    product.location.toLowerCase().includes(query) ||
                    product.seller.toLowerCase().includes(query)
                );

            });

        }


        /* Condition */

        if (selectedCondition !== "All") {

            filtered = filtered.filter(
                product =>
                    product.condition === selectedCondition
            );

        }


        /* Sort */

        switch (sortType) {

            case "price-low":

                filtered.sort(
                    (a, b) => a.price - b.price
                );

                break;


            case "price-high":

                filtered.sort(
                    (a, b) => b.price - a.price
                );

                break;


            case "rating":

                filtered.sort(
                    (a, b) => b.rating - a.rating
                );

                break;


            case "newest":

                filtered.sort(
                    (a, b) => b.id - a.id
                );

                break;


            case "popular":

            default:

                filtered.sort(
                    (a, b) => b.rating - a.rating
                );

                break;
        }


        return filtered;
    }


    /* =====================================
       RENDER PRODUCTS
    ====================================== */

    function renderProducts() {

        const filtered =
            getFilteredProducts();


        productList.innerHTML = "";


        resultsCount.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "item"
                    : "items"
            }`;


        if (filtered.length === 0) {

            productList.classList.add("hidden");

            emptyState.classList.remove("hidden");

            return;

        }


        productList.classList.remove("hidden");

        emptyState.classList.add("hidden");


        filtered.forEach(product => {

            const card =
                document.createElement("article");

            card.className = "product-card";

            card.dataset.id = product.id;


            const favoriteActive =
                isFavorite(product.id)
                    ? "active"
                    : "";


            const conditionClass =
                product.condition.toLowerCase();


            card.innerHTML = `

                <div class="product-image-wrap">

                    <img
                        class="product-image"
                        src="${product.image}"
                        alt="${product.name}"
                        loading="lazy"
                    >

                    <button
                        class="favorite-button ${favoriteActive}"
                        data-favorite="${product.id}"
                        type="button"
                        aria-label="Favorite ${product.name}"
                    >

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M20.8 8.6c0 5.4-8.8 11-8.8 11S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z"
                            ></path>
                        </svg>

                    </button>

                </div>


                <div
                    class="product-info"
                    data-product="${product.id}"
                >

                    <h3 class="product-name">
                        ${product.name}
                    </h3>

                    <div class="product-price">
                        ${formatPrice(product.price)}
                    </div>

                    <div class="product-location">
                        ${product.location}
                    </div>

                    <div class="product-rating">
                        <span class="star">★</span>
                        <span class="rating-number">
                            ${product.rating}
                        </span>
                    </div>

                    <span
                        class="product-condition ${conditionClass}"
                    >
                        ${product.condition}
                    </span>

                </div>
            `;


            const image =
                card.querySelector(".product-image");


            image.addEventListener(
                "error",
                () => {

                    image.classList.add("fallback");

                    image.src =
                        createFallbackImage(product.category);

                },
                { once: true }
            );


            productList.appendChild(card);

        });

    }


    /* =====================================
       FALLBACK IMAGE
    ====================================== */

    function createFallbackImage(category) {

        const svg = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="500"
                height="500"
                viewBox="0 0 500 500"
            >
                <rect
                    width="500"
                    height="500"
                    fill="#f1f4f8"
                />

                <circle
                    cx="250"
                    cy="210"
                    r="95"
                    fill="#e2e8f0"
                />

                <text
                    x="250"
                    y="345"
                    text-anchor="middle"
                    font-family="Arial"
                    font-size="32"
                    font-weight="700"
                    fill="#1457d9"
                >
                    ${category}
                </text>
            </svg>
        `;

        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg)
        );
    }


    /* =====================================
       CATEGORY CLICK
    ====================================== */

    categoryList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".category-item"
                );

            if (!button) return;


            activeCategory =
                button.dataset.category;


            document
                .querySelectorAll(".category-item")
                .forEach(item => {

                    item.classList.toggle(
                        "active",
                        item === button
                    );

                });


            renderProducts();

        }
    );


    /* =====================================
       SEARCH
    ====================================== */

    searchInput.addEventListener(
        "input",
        () => {

            searchTerm =
                searchInput.value;


            clearSearch.classList.toggle(
                "visible",
                searchTerm.length > 0
            );


            renderProducts();

        }
    );


    clearSearch.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            searchTerm = "";

            clearSearch.classList.remove(
                "visible"
            );

            renderProducts();

            searchInput.focus();

        }
    );


    /* =====================================
       PRODUCT / FAVORITE CLICKS
    ====================================== */

    productList.addEventListener(
        "click",
        event => {

            const favoriteButton =
                event.target.closest(
                    "[data-favorite]"
                );


            if (favoriteButton) {

                event.stopPropagation();


                const productId =
                    Number(
                        favoriteButton.dataset.favorite
                    );


                toggleFavorite(productId);


                return;

            }


            const productInfo =
                event.target.closest(
                    "[data-product]"
                );


            if (productInfo) {

                const productId =
                    Number(
                        productInfo.dataset.product
                    );


                openProduct(productId);

            }

        }
    );


    /* =====================================
       FAVORITES
    ====================================== */

    function toggleFavorite(productId) {

        const product =
            products.find(
                item => item.id === productId
            );


        if (!product) return;


        if (isFavorite(productId)) {

            favorites =
                favorites.filter(
                    id => id !== productId
                );

            showToast(
                `${product.name} removed from favorites`
            );

        } else {

            favorites.push(productId);

            showToast(
                `${product.name} added to favorites`
            );

        }


        saveFavorites();

        renderProducts();

    }


    /* =====================================
       PRODUCT DETAILS
    ====================================== */

    function openProduct(productId) {

        const product =
            products.find(
                item => item.id === productId
            );


        if (!product) return;


        const cartButtonText =
            isInCart(productId)
                ? "Remove from cart"
                : "Add to cart";


        productDetails.innerHTML = `

            <img
                class="details-image"
                src="${product.image}"
                alt="${product.name}"
                onerror="
                    this.src='${createFallbackImage(product.category)}'
                "
            >

            <div class="details-content">

                <span class="details-category">
                    ${product.category}
                </span>

                <h2 class="details-title">
                    ${product.name}
                </h2>

                <div class="details-price">
                    ${formatPrice(product.price)}
                </div>

                <div class="details-meta">

                    <span>
                        📍 ${product.location}
                    </span>

                    <span>
                        ⭐ ${product.rating} rating
                    </span>

                    <span>
                        📦 ${product.condition}
                    </span>

                </div>

                <div class="details-seller">

                    <div class="seller-avatar">
                        ${product.seller
                            .split(" ")
                            .map(part => part[0])
                            .join("")
                            .slice(0, 2)}
                    </div>

                    <div>

                        <div class="seller-name">
                            ${product.seller}
                        </div>

                        <div class="seller-label">
                            Campus seller
                        </div>

                    </div>

                </div>

                <p
                    style="
                        margin-top:18px;
                        color:#667085;
                        font-size:14px;
                        line-height:1.6;
                    "
                >
                    ${product.description}
                </p>

                <div class="details-actions">

                    <button
                        class="secondary-button"
                        id="favoriteDetail"
                        type="button"
                    >
                        ${isFavorite(product.id)
                            ? "♥ Favorited"
                            : "♡ Favorite"}
                    </button>

                    <button
                        class="primary-button"
                        id="cartDetail"
                        type="button"
                    >
                        ${cartButtonText}
                    </button>

                </div>

            </div>
        `;


        productOverlay.classList.remove(
            "hidden"
        );


        document
            .getElementById("favoriteDetail")
            .addEventListener(
                "click",
                () => {

                    toggleFavorite(product.id);

                    openProduct(product.id);

                }
            );


        document
            .getElementById("cartDetail")
            .addEventListener(
                "click",
                () => {

                    toggleCart(product.id);

                    openProduct(product.id);

                }
            );

    }


    closeProduct.addEventListener(
        "click",
        () => {

            productOverlay.classList.add(
                "hidden"
            );

        }
    );


    productOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                productOverlay
            ) {

                productOverlay.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================
       CART
    ====================================== */

    function toggleCart(productId) {

        const product =
            products.find(
                item => item.id === productId
            );


        if (!product) return;


        if (isInCart(productId)) {

            cart =
                cart.filter(
                    id => id !== productId
                );

            showToast(
                `${product.name} removed from cart`
            );

        } else {

            cart.push(productId);

            showToast(
                `${product.name} added to cart`
            );

        }


        saveCart();

        updateCartCount();

    }


    function updateCartCount() {

        cartCount.textContent =
            cart.length;


        cartCount.style.display =
            cart.length > 0
                ? "grid"
                : "none";

    }


    function renderCart() {

        if (cart.length === 0) {

            cartContent.innerHTML = `

                <div class="cart-empty">

                    <div class="cart-empty-icon">
                        🛒
                    </div>

                    <h3>Your cart is empty</h3>

                    <p>
                        Items you add will appear here.
                    </p>

                </div>

            `;

            return;

        }


        const cartProducts =
            cart
                .map(id =>
                    products.find(
                        product =>
                            product.id === id
                    )
                )
                .filter(Boolean);


        const total =
            cartProducts.reduce(
                (sum, product) =>
                    sum + product.price,
                0
            );


        cartContent.innerHTML = `

            ${cartProducts.map(product => `

                <div class="cart-item">

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                    >

                    <div class="cart-item-info">

                        <strong>
                            ${product.name}
                        </strong>

                        <span>
                            ${formatPrice(product.price)}
                        </span>

                    </div>

                    <button
                        class="remove-cart-item"
                        data-remove-cart="${product.id}"
                        type="button"
                    >
                        Remove
                    </button>

                </div>

            `).join("")}


            <div class="cart-total">

                <span>Total</span>

                <span>
                    ${formatPrice(total)}
                </span>

            </div>

            <button
                class="primary-button"
                id="checkoutButton"
                type="button"
                style="width:100%;margin-top:18px;"
            >
                Continue
            </button>
        `;


        cartContent
            .querySelectorAll(
                "[data-remove-cart]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            Number(
                                button.dataset.removeCart
                            );

                        toggleCart(productId);

                        renderCart();

                    }
                );

            });


        const checkout =
            document.getElementById(
                "checkoutButton"
            );


        checkout.addEventListener(
            "click",
            () => {

                showToast(
                    "Checkout will be available soon."
                );

            }
        );

    }


    cartButton.addEventListener(
        "click",
        () => {

            renderCart();

            cartOverlay.classList.remove(
                "hidden"
            );

        }
    );


    closeCart.addEventListener(
        "click",
        () => {

            cartOverlay.classList.add(
                "hidden"
            );

        }
    );


    cartOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target === cartOverlay
            ) {

                cartOverlay.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================
       FILTER PANEL
    ====================================== */

    filterButton.addEventListener(
        "click",
        () => {

            filterOverlay.classList.remove(
                "hidden"
            );

        }
    );


    closeFilter.addEventListener(
        "click",
        () => {

            filterOverlay.classList.add(
                "hidden"
            );

        }
    );


    filterOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target === filterOverlay
            ) {

                filterOverlay.classList.add(
                    "hidden"
                );

            }

        }
    );


    document
        .querySelectorAll(
            ".filter-chip"
        )
        .forEach(chip => {

            chip.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-chip"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );


                    chip.classList.add(
                        "active"
                    );


                    selectedCondition =
                        chip.dataset.condition;

                }
            );

        });


    sortSelect.addEventListener(
        "change",
        () => {

            sortType =
                sortSelect.value;

        }
    );


    applyFilters.addEventListener(
        "click",
        () => {

            renderProducts();

            filterOverlay.classList.add(
                "hidden"
            );

            showToast(
                "Filters applied"
            );

        }
    );


    clearFilters.addEventListener(
        "click",
        () => {

            selectedCondition = "All";

            sortType = "popular";

            sortSelect.value =
                "popular";


            document
                .querySelectorAll(
                    ".filter-chip"
                )
                .forEach(chip => {

                    chip.classList.toggle(
                        "active",
                        chip.dataset.condition ===
                            "All"
                    );

                });


            renderProducts();

            showToast(
                "Filters reset"
            );

        }
    );


    /* =====================================
       RESET EVERYTHING
    ====================================== */

    resetButton.addEventListener(
        "click",
        resetMarketplace
    );


    viewAllButton.addEventListener(
        "click",
        resetMarketplace
    );


    function resetMarketplace() {

        activeCategory = "All";

        searchTerm = "";

        selectedCondition = "All";

        sortType = "popular";


        searchInput.value = "";

        clearSearch.classList.remove(
            "visible"
        );


        sortSelect.value =
            "popular";


        document
            .querySelectorAll(
                ".filter-chip"
            )
            .forEach(chip => {

                chip.classList.toggle(
                    "active",
                    chip.dataset.condition ===
                        "All"
                );

            });


        document
            .querySelectorAll(
                ".category-item"
            )
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.category ===
                        "All"
                );

            });


        renderProducts();

    }


    /* =====================================
       BOTTOM NAVIGATION
    ====================================== */

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const destination =
                        item.dataset.nav;


                    handleNavigation(
                        destination
                    );

                }
            );

        });


    function handleNavigation(destination) {

        switch (destination) {

            case "home":

                window.location.href =
                    "../index.html";

                break;


            case "marketplace":

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                break;


            case "favorites":

                window.location.href =
                    "../favorites/favorites.html";

                break;


            case "profile":

                window.location.href =
                    "../profile/profile.html";

                break;

        }

    }


    /* =====================================
       FAVORITES VIEW
    ====================================== */

    function showFavorites() {

        const originalCategory =
            activeCategory;

        const originalSearch =
            searchTerm;


        const favoriteProducts =
            products.filter(
                product =>
                    favorites.includes(
                        product.id
                    )
            );


        productList.innerHTML = "";

        emptyState.classList.add(
            "hidden"
        );

        productList.classList.remove(
            "hidden"
        );


        resultsCount.textContent =
            `${favoriteProducts.length} ${
                favoriteProducts.length === 1
                    ? "favorite"
                    : "favorites"
            }`;


        if (
            favoriteProducts.length === 0
        ) {

            productList.innerHTML = `

                <div
                    style="
                        padding:70px 20px;
                        text-align:center;
                        color:#667085;
                    "
                >

                    <div
                        style="
                            font-size:45px;
                            margin-bottom:12px;
                        "
                    >
                        ♡
                    </div>

                    <h3
                        style="
                            color:#101828;
                            font-size:20px;
                        "
                    >
                        No favorites yet
                    </h3>

                    <p
                        style="
                            margin-top:7px;
                            font-size:14px;
                        "
                    >
                        Tap the heart on an item
                        to save it here.
                    </p>

                </div>

            `;

            return;

        }


        favoriteProducts.forEach(
            product => {

                const card =
                    createProductCard(
                        product
                    );

                productList.appendChild(
                    card
                );

            }
        );

    }


    function createProductCard(product) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "product-card";

        card.dataset.id =
            product.id;


        const favoriteActive =
            isFavorite(product.id)
                ? "active"
                : "";


        card.innerHTML = `

            <div class="product-image-wrap">

                <img
                    class="product-image"
                    src="${product.image}"
                    alt="${product.name}"
                >

                <button
                    class="favorite-button ${favoriteActive}"
                    data-favorite="${product.id}"
                    type="button"
                >

                    <svg viewBox="0 0 24 24">
                        <path
                            d="M20.8 8.6c0 5.4-8.8 11-8.8 11S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z"
                        ></path>
                    </svg>

                </button>

            </div>


            <div
                class="product-info"
                data-product="${product.id}"
            >

                <h3 class="product-name">
                    ${product.name}
                </h3>

                <div class="product-price">
                    ${formatPrice(product.price)}
                </div>

                <div class="product-location">
                    ${product.location}
                </div>

                <div class="product-rating">
                    <span class="star">★</span>
                    <span class="rating-number">
                        ${product.rating}
                    </span>
                </div>

                <span class="product-condition">
                    ${product.condition}
                </span>

            </div>
        `;


        return card;

    }


    /* =====================================
       SELL BUTTON
    ====================================== */

    sellButton.addEventListener(
        "click",
        () => {

            showToast(
                "Post Item will be available soon."
            );

        }
    );


    /* =====================================
       SIDE MENU
    ====================================== */

    menuButton.addEventListener(
        "click",
        () => {

            menuOverlay.classList.remove(
                "hidden"
            );

        }
    );


    closeMenu.addEventListener(
        "click",
        () => {

            menuOverlay.classList.add(
                "hidden"
            );

        }
    );


    menuOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target === menuOverlay
            ) {

                menuOverlay.classList.add(
                    "hidden"
                );

            }

        }
    );


    document
        .querySelectorAll(
            "[data-menu]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const destination =
                        button.dataset.menu;


                    menuOverlay.classList.add(
                        "hidden"
                    );


                    handleNavigation(
                        destination
                    );

                }
            );

        });


    /* =====================================
       KEYBOARD ESC
    ====================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) return;


            filterOverlay.classList.add(
                "hidden"
            );

            productOverlay.classList.add(
                "hidden"
            );

            cartOverlay.classList.add(
                "hidden"
            );

            menuOverlay.classList.add(
                "hidden"
            );

        }
    );


    /* =====================================
       INITIALIZE
    ====================================== */

    updateCartCount();

    renderProducts();

    if (new URLSearchParams(window.location.search).get("post") === "1") {
        openPostItem();
    }

});

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
      const modal = document.getElementById('modalBackdrop');
      if (modal) { modal.hidden = false; modal.classList.add('show'); return; }
      if (window.location.pathname.includes('/marketplace/')) { window.scrollTo({top:0,behavior:'smooth'}); }
      else window.location.href = 'marketplace/marketplace.html?post=1';
    }
  });
})();
