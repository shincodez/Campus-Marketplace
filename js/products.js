/* =========================================================
   NORSU CAMPUS MARKETPLACE
   ITEM CATALOG (shared by Home, Marketplace, Favorites,
   Post an Item and Profile)

   Every item lives in the database (api/listings.php), so an
   item one student posts is seen by everyone, and "Message"
   reaches the seller's real inbox.
========================================================= */

(function () {

    const escapeXML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[c]));

    /* Shown when an item has no photo, or its photo fails to load. */
    function placeholder(category) {
        const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">` +
            `<rect width="500" height="500" fill="#f1f4f8"/>` +
            `<circle cx="250" cy="210" r="95" fill="#e2e8f0"/>` +
            `<text x="250" y="345" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#1457d9">${escapeXML(category || "Item")}</text>` +
            `</svg>`;
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    const withPhoto = item => ({ ...item, image: item.image || placeholder(item.category) });

    let allItems = null;


    window.CampusCatalog = {

        /* Every listing, newest first (cached for the page). */
        load() {
            allItems = allItems || CampusAuth.api("listings.php").then(data => data.items.map(withPhoto));
            return allItems;
        },

        /* The logged-in student's own listings. */
        mine: () => CampusAuth.api("listings.php?mine=1").then(data => data.items.map(withPhoto)),

        /* New listing from the Post an Item form (FormData with photos[]). */
        create: form => CampusAuth.api("listings.php", form),

        setStatus: (id, status) => CampusAuth.api("listings.php", { action: "status", id, status }),

        remove: id => CampusAuth.api("listings.php", { action: "delete", id }),

        /* Counts toward "Popular"; failures don't matter. */
        countView: id => CampusAuth.api("listings.php", { action: "view", id }).catch(() => {}),

        placeholder,

        /* Who to message about an item (the seller's account id). */
        sellerKey: item => item.sellerId ?? null,

        /* True when the logged-in student posted this item. */
        isMine: (item, user) => Boolean(user) && item.sellerId != null && item.sellerId === user.id,

        /* Link to the conversation with an item's seller. */
        messageUrl: item => {
            const url = new URL(window.CampusAuth.url("messages/messages.html"));
            url.searchParams.set("to", String(window.CampusCatalog.sellerKey(item)));
            url.searchParams.set("item", item.name);
            url.searchParams.set("listing", String(item.id));
            return url.href;
        }
    };

})();
