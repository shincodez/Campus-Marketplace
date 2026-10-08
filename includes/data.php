<?php
/**
 * Marketplace data helpers shared by every page.
 */

/** All categories ordered for display: [['id','name','slug','icon'], ...] */
function categories(): array
{
    static $categories = null;
    if ($categories === null) {
        $categories = db_all('SELECT id, name, slug, icon FROM categories ORDER BY sort_order, name');
    }
    return $categories;
}

/** Category row by slug, or null. */
function category_by_slug(string $slug): ?array
{
    foreach (categories() as $category) {
        if ($category['slug'] === $slug) {
            return $category;
        }
    }
    return null;
}

/**
 * Standard SELECT for listing cards / detail pages.
 *
 * Columns: every listings column plus category_name, category_slug,
 * seller_name, seller_avatar, cover (first photo path), photo_count,
 * favorite_count, is_favorite (for $viewerId), in_cart (for $viewerId).
 *
 * Append your own WHERE / ORDER BY / LIMIT, e.g.
 *   db_all(listing_select() . ' WHERE l.status = ? ORDER BY l.created_at DESC', ['available']);
 */
function listing_select(?int $viewerId = null): string
{
    $viewer = (int) ($viewerId ?? user_id());

    return "SELECT l.*,
            c.name AS category_name, c.slug AS category_slug,
            u.full_name AS seller_name, u.avatar AS seller_avatar,
            (SELECT li.path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order, li.id LIMIT 1) AS cover,
            (SELECT COUNT(*) FROM listing_images li2 WHERE li2.listing_id = l.id) AS photo_count,
            (SELECT COUNT(*) FROM favorites f WHERE f.listing_id = l.id) AS favorite_count,
            EXISTS(SELECT 1 FROM favorites f2 WHERE f2.listing_id = l.id AND f2.user_id = {$viewer}) AS is_favorite,
            EXISTS(SELECT 1 FROM cart_items ci WHERE ci.listing_id = l.id AND ci.user_id = {$viewer}) AS in_cart
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        JOIN users u ON u.id = l.user_id";
}

/** One listing (with listing_select columns) or null. */
function find_listing(int $id): ?array
{
    return db_one(listing_select() . ' WHERE l.id = ?', [$id]);
}

/** Photos for a listing ordered for display. */
function listing_images(int $listingId): array
{
    return db_all('SELECT id, path, sort_order FROM listing_images WHERE listing_id = ? ORDER BY sort_order, id', [$listingId]);
}

/**
 * Store an in-app notification for a user, respecting their preferences.
 *
 * @param string $type message | order | sold | favorite | system
 * @param string $link App-relative path WITHOUT a leading slash, e.g. 'orders.php?tab=sales'
 */
function notify(int $userId, string $type, string $title, string $body = '', string $link = ''): void
{
    $preference = ['message' => 'notify_messages', 'order' => 'notify_orders', 'sold' => 'notify_orders', 'favorite' => 'notify_favorites'][$type] ?? null;
    if ($preference !== null && !(int) db_value("SELECT {$preference} FROM users WHERE id = ?", [$userId], 0)) {
        return; // user turned this kind of notification off
    }

    db_insert(
        'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
        [$userId, $type, str_limit($title, 120), str_limit($body, 255), $link]
    );
}

/** Badge counts for the header (zeros for guests). */
function header_counts(): array
{
    $id = user_id();
    if (!$id) {
        return ['cart' => 0, 'notifications' => 0, 'messages' => 0];
    }
    return [
        'cart'          => (int) db_value('SELECT COUNT(*) FROM cart_items WHERE user_id = ?', [$id], 0),
        'notifications' => (int) db_value('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0', [$id], 0),
        'messages'      => (int) db_value('SELECT COUNT(*) FROM messages WHERE recipient_id = ? AND is_read = 0', [$id], 0),
    ];
}

/** Latest notifications for the header dropdown. */
function recent_notifications(int $limit = 6): array
{
    $id = user_id();
    if (!$id) {
        return [];
    }
    return db_all(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ' . (int) $limit,
        [$id]
    );
}

/** Icon name for a notification type. */
function notification_icon(string $type): string
{
    return [
        'message'  => 'message-circle',
        'order'    => 'receipt',
        'favorite' => 'heart',
        'sold'     => 'package-check',
        'system'   => 'bell',
    ][$type] ?? 'bell';
}
