/* =========================================
   CAMPUS MARKETPLACE
   ACTUAL MARKETPLACE JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       PRODUCT DATA
    ====================================== */

    // Every student's listings, loaded from the database on start (../products.js).
    const products = [];

    const MESSAGE_ICON =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>';


    /* =====================================
       STATE
    ====================================== */

    let activeCategory = "All";

    let searchTerm = "";

    let selectedCondition = "All";

    let sortType = "popular";

    // Each account has its own favorites and cart (see auth.js).
    const favoritesKey =
        CampusAuth.storageKey("campusMarketplaceFavorites");

    const cartKey =
        CampusAuth.storageKey("campusMarketplaceCart");

    let favorites =
        JSON.parse(
            localStorage.getItem(favoritesKey) || "[]"
        );

    let cart =
        JSON.parse(
            localStorage.getItem(cartKey) || "[]"
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
        return `₱${Number(price || 0).toLocaleString("en-PH")}`;
    }


    // Listings typed by students are shown as text, never as HTML.
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[character]));
    }


    // Posted items use "New", "Like New", "Used - Good", "Used - Fair";
    // the filter chips group them as New / Used.
    function conditionGroup(condition) {
        return /used/i.test(condition || "") ? "Used" : "New";
    }


    // When the item was posted, e.g. "2 days ago".
    function listedText(product) {
        return product.listedAgo || "Just now";
    }


    function saveFavorites() {
        localStorage.setItem(
            favoritesKey,
            JSON.stringify(favorites)
        );
    }


    function saveCart() {
        localStorage.setItem(
            cartKey,
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

                return [
                    product.name,
                    product.category,
                    product.location,
                    product.seller
                ].some(value =>
                    String(value || "").toLowerCase().includes(query)
                );

            });

        }


        /* Condition */

        if (selectedCondition !== "All") {

            filtered = filtered.filter(
                product =>
                    conditionGroup(product.condition) === selectedCondition
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


            case "newest":

                filtered.sort(
                    (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id
                );

                break;


            case "popular":

            default:

                filtered.sort(
                    (a, b) => (b.views || 0) - (a.views || 0) || b.id - a.id
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


            const sold =
                String(product.status || "").toLowerCase() === "sold";

            const conditionClass =
                sold ? "sold" : conditionGroup(product.condition).toLowerCase();


            card.innerHTML = `

                <div class="product-image-wrap">

                    <img
                        class="product-image"
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                    >

                    <button
                        class="favorite-button ${favoriteActive}"
                        data-favorite="${product.id}"
                        type="button"
                        aria-label="Favorite ${escapeHTML(product.name)}"
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
                        ${escapeHTML(product.name)}
                    </h3>

                    <div class="product-price">
                        ${formatPrice(product.price)}
                    </div>

                    <div class="product-location">
                        ${escapeHTML(product.location)}
                    </div>

                    <div class="product-rating">
                        <span class="star">🕒</span>
                        <span class="rating-number">
                            ${escapeHTML(listedText(product))}
                        </span>
                    </div>

                    <span
                        class="product-condition ${conditionClass}"
                    >
                        ${sold ? "Sold" : escapeHTML(product.condition)}
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
                    ${escapeHTML(category)}
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


            const card =
                event.target.closest(
                    ".product-card"
                );


            if (card) {

                openProduct(
                    Number(card.dataset.id)
                );

            }

        }
    );


    /* =====================================
       FAVORITES
    ====================================== */

    function toggleFavorite(productId) {

        if (!CampusAuth.requireLogin("favorites")) return;


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


        const mine =
            CampusCatalog.isMine(product, CampusAuth.user);

        const sold =
            String(product.status || "").toLowerCase() === "sold";

        const canMessage =
            !mine && CampusCatalog.sellerKey(product) != null;

        const cartButtonText =
            mine
                ? "Your listing"
                : sold
                    ? "Sold"
                    : isInCart(productId)
                        ? "Remove from cart"
                        : "Add to cart";

        CampusCatalog.countView(product.id);


        productDetails.innerHTML = `

            <img
                class="details-image"
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
            >

            <div class="details-content">

                <span class="details-category">
                    ${escapeHTML(product.category)}
                </span>

                <h2 class="details-title">
                    ${escapeHTML(product.name)}
                </h2>

                <div class="details-price">
                    ${formatPrice(product.price)}
                </div>

                <div class="details-meta">

                    <span>
                        📍 ${escapeHTML(product.location)}
                    </span>

                    <span>
                        🕒 Listed ${escapeHTML(product.listedAgo || "just now")} · ${Number(product.views || 0)} view${Number(product.views) === 1 ? "" : "s"}
                    </span>

                    <span>
                        📦 ${escapeHTML(product.condition)}
                    </span>

                </div>

                <div class="details-seller">

                    <div class="seller-avatar">
                        ${escapeHTML(String(product.seller || "Campus Student")
                            .split(/\s+/)
                            .filter(Boolean)
                            .map(part => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase())}
                    </div>

                    <div>

                        <div class="seller-name">
                            ${escapeHTML(product.seller || "Campus Student")}
                        </div>

                        <div class="seller-label">
                            ${mine ? "Your listing" : "Campus seller"}
                        </div>

                    </div>

                    ${canMessage ? `
                    <button
                        class="message-seller-button"
                        id="messageSeller"
                        type="button"
                    >
                        ${MESSAGE_ICON}
                        <span>Message</span>
                    </button>` : ""}

                </div>

                <p
                    style="
                        margin-top:18px;
                        color:#667085;
                        font-size:14px;
                        line-height:1.6;
                    "
                >
                    ${escapeHTML(product.description || "No description provided.")}
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
                        ${mine || (sold && !isInCart(productId)) ? "disabled" : ""}
                    >
                        ${cartButtonText}
                    </button>

                </div>

            </div>
        `;


        productDetails
            .querySelector(".details-image")
            .addEventListener(
                "error",
                event => {
                    event.currentTarget.src =
                        createFallbackImage(product.category);
                },
                { once: true }
            );


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


        // Opens the conversation with this item's seller.
        document
            .getElementById("messageSeller")
            ?.addEventListener(
                "click",
                () => {

                    if (!CampusAuth.requireLogin("messages")) return;

                    window.location.href =
                        CampusCatalog.messageUrl(product);

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

        if (!CampusAuth.requireLogin("cart")) return;


        const product =
            products.find(
                item => item.id === productId
            );


        if (!product) return;


        if (CampusCatalog.isMine(product, CampusAuth.user)) {

            showToast("This is your own listing.");

            return;

        }


        if (
            !isInCart(productId) &&
            String(product.status || "").toLowerCase() === "sold"
        ) {

            showToast("This item is already sold.");

            return;

        }


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
                    sum + Number(product.price || 0),
                0
            );


        cartContent.innerHTML = `

            ${cartProducts.map(product => `

                <div class="cart-item">

                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                    >

                    <div class="cart-item-info">

                        <strong>
                            ${escapeHTML(product.name)}
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

                if (!CampusAuth.requireLogin("cart")) return;

                renderCheckout();

            }
        );

    }


    /* =====================================
       CHECKOUT
       Each seller gets the purchase request as a
       message; buyer and seller then agree on
       payment and a campus meetup in Messages.
    ====================================== */

    const ordersKey =
        CampusAuth.storageKey("campusMarketplaceOrders");


    function cartItems() {

        return cart
            .map(id => products.find(product => product.id === id))
            .filter(Boolean);

    }


    function renderCheckout() {

        const items = cartItems();

        if (items.length === 0) {
            renderCart();
            return;
        }

        const total =
            items.reduce((sum, product) => sum + Number(product.price || 0), 0);

        cartContent.innerHTML = `

            <div class="checkout">

                <p class="checkout-intro">
                    Each seller gets your purchase request as a message.
                    You'll agree on payment and a safe campus meetup in Messages.
                </p>

                <ul class="checkout-items">
                    ${items.map(product => `
                    <li>
                        <span>
                            ${escapeHTML(product.name)}
                            <small>Seller: ${escapeHTML(product.seller || "Campus Student")}</small>
                        </span>
                        <b>${formatPrice(product.price)}</b>
                    </li>`).join("")}
                </ul>

                <label class="checkout-note">
                    <span>Message to the seller</span>
                    <textarea id="checkoutNote" rows="3" maxlength="600">Hi! I'd like to buy this. When and where can we meet on campus?</textarea>
                </label>

                <div class="cart-total">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                </div>

                <button class="primary-button checkout-button" id="sendRequest" type="button">
                    Send purchase request
                </button>

                <button class="secondary-button checkout-button" id="backToCart" type="button">
                    Back to cart
                </button>

            </div>
        `;

        document.getElementById("backToCart").addEventListener("click", renderCart);
        document.getElementById("sendRequest").addEventListener("click", sendPurchaseRequests);

    }


    async function sendPurchaseRequests() {

        const button = document.getElementById("sendRequest");
        const note = document.getElementById("checkoutNote").value.trim();

        button.disabled = true;
        button.textContent = "Sending…";

        const sent = [];
        const failed = [];

        for (const product of cartItems()) {

            const to = CampusCatalog.sellerKey(product);

            if (to == null) {
                failed.push({ product, reason: "This item has no seller account to message." });
                continue;
            }

            try {
                await CampusAuth.api("messages.php", {
                    to: String(to),
                    listing: product.id,
                    body: `🛒 Purchase request: ${product.name} — ${formatPrice(product.price)}` + (note ? `\n\n${note}` : "")
                });
                sent.push(product);
            } catch (error) {
                failed.push({ product, reason: error.message });
            }

        }

        if (sent.length) {

            cart = cart.filter(id => !sent.some(product => product.id === id));
            saveCart();
            updateCartCount();

            // Profile → Items Bought lists these requests.
            try {
                const orders = JSON.parse(localStorage.getItem(ordersKey) || "[]");
                sent.forEach(product => orders.unshift({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price || 0),
                    seller: product.seller || "Campus Student",
                    sellerKey: CampusCatalog.sellerKey(product),
                    requestedAt: new Date().toISOString()
                }));
                localStorage.setItem(ordersKey, JSON.stringify(orders.slice(0, 100)));
            } catch { /* the messages were still sent */ }

        }

        renderCheckoutResult(sent, failed);

    }


    function renderCheckoutResult(sent, failed) {

        const sellers =
            new Set(sent.map(product => String(CampusCatalog.sellerKey(product)))).size;

        cartContent.innerHTML = `

            <div class="checkout-done">

                <div class="checkout-done-icon ${sent.length ? "" : "failed"}">
                    ${sent.length ? "✓" : "!"}
                </div>

                <h3>${sent.length ? "Purchase request sent" : "Request not sent"}</h3>

                <p>
                    ${sent.length
                        ? `${sellers === 1 ? "The seller has" : `${sellers} sellers have`} your request. Check Messages for the reply.`
                        : "Nothing was sent. Please try again."}
                </p>

                ${failed.length ? `
                <ul class="checkout-failed">
                    ${failed.map(({ product, reason }) => `
                    <li><b>${escapeHTML(product.name)}</b> — ${escapeHTML(reason)}</li>`).join("")}
                </ul>` : ""}

                ${sent.length
                    ? `<button class="primary-button checkout-button" id="openMessages" type="button">Open Messages</button>`
                    : `<button class="primary-button checkout-button" id="retryCheckout" type="button">Back to checkout</button>`}

                <button class="secondary-button checkout-button" id="keepBrowsing" type="button">
                    Keep browsing
                </button>

            </div>
        `;

        document.getElementById("openMessages")?.addEventListener("click", () => {
            window.location.href = "../messages/messages.html";
        });

        document.getElementById("retryCheckout")?.addEventListener("click", renderCheckout);

        document.getElementById("keepBrowsing").addEventListener("click", () => {
            cartOverlay.classList.add("hidden");
        });

        showToast(sent.length ? "Purchase request sent!" : "Purchase request not sent.");

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


            case "messages":

                window.location.href =
                    "../messages/messages.html";

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
            window.location.href = "../post-item/post-item.html";
        }
    );


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

        }
    );


    /* =====================================
       INITIALIZE
    ====================================== */

    updateCartCount();

    const startParams =
        new URLSearchParams(window.location.search);

    if (startParams.get("post") === "1") {
        window.location.href = "../post-item/post-item.html";
    }

    productList.innerHTML =
        `<p class="loading-items">Loading items…</p>`;

    resultsCount.textContent = "";

    CampusCatalog.load().then(
        items => {

            products.push(...items);

            renderProducts();

            if (startParams.get("item")) {
                openProduct(Number(startParams.get("item")));
            }

            // Home's cart button opens the cart here.
            if (startParams.get("cart") === "1") {
                renderCart();
                cartOverlay.classList.remove("hidden");
            }

        },
        error => {

            productList.innerHTML =
                `<p class="loading-items">Items couldn't load. ${escapeHTML(error.message)}</p>`;

        }
    );

});

