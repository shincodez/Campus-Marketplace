<?php
/**
 * Marketplace listings (the `listings` and `listing_images` tables), so an
 * item one student posts is seen — and can be messaged — by everyone.
 *
 * GET                       every listing, newest first (anyone can browse)
 * GET  ?mine=1              the logged-in student's own listings
 * POST action=create        new listing (multipart form, photos[] up to 5)
 * POST action=status        {id, status: "available" | "sold"}   owner only
 * POST action=delete        {id}                                 owner only
 * POST action=view          {id}   counts one view per visitor (for "Popular")
 */
require dirname(__DIR__) . '/includes/api.php';

const MAX_LISTING_PRICE = 999999.99;


function listing_payload(array $row, array $images): array
{
    $meetup = $row['fulfillment'] === 'meetup';

    return [
        'id'          => (int) $row['id'],
        'name'        => $row['title'],
        'price'       => (float) $row['price'],
        'category'    => $row['category_name'],
        'condition'   => $row['item_condition'],
        'location'    => $row['location'],
        'description' => (string) $row['description'],
        'seller'      => $row['seller_name'],
        'sellerId'    => (int) $row['user_id'],
        'image'       => $images[0] ?? '',
        'images'      => $images,
        'status'      => $row['status'],
        'views'       => (int) $row['views'],
        'createdAt'   => date('c', strtotime($row['created_at'])),
        'listedAgo'   => time_ago($row['created_at']),
        'fulfillment' => $row['fulfillment'],
        'meetup'      => $meetup ? [
            'location'     => $row['meetup_location'],
            'availability' => $row['meetup_availability'],
            'safety'       => $row['meetup_safety'],
        ] : null,
        'delivery'    => $meetup ? null : [
            'area'  => $row['delivery_area'],
            'fee'   => $row['delivery_fee'] === null ? 0 : (float) $row['delivery_fee'],
            'payer' => $row['delivery_payer'],
            'notes' => $row['delivery_notes'],
        ],
    ];
}


/** Listings (with seller name, category and photo URLs) matching $where. */
function load_listings(string $where = '1 = 1', array $params = []): array
{
    $rows = db_all(
        "SELECT l.*, c.name AS category_name, u.full_name AS seller_name
           FROM listings l
           JOIN categories c ON c.id = l.category_id
           JOIN users u ON u.id = l.user_id
          WHERE {$where}
          ORDER BY l.created_at DESC, l.id DESC",
        $params
    );
    if (!$rows) {
        return [];
    }

    $ids = array_column($rows, 'id');
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $images = [];
    foreach (db_all("SELECT listing_id, path FROM listing_images WHERE listing_id IN ({$marks}) ORDER BY sort_order, id", $ids) as $image) {
        $images[$image['listing_id']][] = image_url($image['path']);
    }

    return array_map(fn($row) => listing_payload($row, $images[$row['id']] ?? []), $rows);
}


/** The listing named in the request, owned by $me — or stop. */
function own_listing(array $me): array
{
    $id = (int) (api_input()['id'] ?? 0);
    $listing = $id > 0 ? db_one('SELECT * FROM listings WHERE id = ?', [$id]) : null;
    if (!$listing) {
        api_fail('That listing could not be found.', null, 404);
    }
    if ((int) $listing['user_id'] !== (int) $me['id']) {
        api_fail('You can only change your own listings.', null, 403);
    }
    return $listing;
}


/** "1,299.50" → "1299.50"; null when it is not a valid amount. */
function parse_money(string $value): ?string
{
    $value = str_replace([',', ' '], '', $value);
    return preg_match('/^\d{1,9}(\.\d{1,2})?$/', $value) ? $value : null;
}


/** Optional short text field, trimmed and limited. */
function short_text(string $key, int $max, string $label): string
{
    $value = preg_replace('/\s+/u', ' ', api_string($key)) ?? '';
    if (mb_strlen($value) > $max) {
        api_fail("{$label} must be {$max} characters or fewer.", $key);
    }
    return $value;
}


// ============================================================== GET
if (!is_post()) {
    if (isset($_GET['mine'])) {
        $me = require_login();
        json_response(['ok' => true, 'items' => load_listings('l.user_id = ?', [(int) $me['id']])]);
    }
    json_response(['ok' => true, 'items' => load_listings()]);
}


// ============================================================== POST
// A body larger than post_max_size arrives with empty $_POST and $_FILES.
if (!$_POST && !$_FILES && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0 && !api_input()) {
    api_fail('Those photos are too large to upload together. Please choose smaller photos.', 'photos', 413);
}

verify_csrf();
$action = api_string('action');


// ---- Count a view (anyone; once per visitor per listing) ----------------------
if ($action === 'view') {
    $id = (int) (api_input()['id'] ?? 0);
    $listing = $id > 0 ? db_one('SELECT id, user_id FROM listings WHERE id = ?', [$id]) : null;
    if ($listing && (int) $listing['user_id'] !== user_id() && empty($_SESSION['viewed'][$id])) {
        db_exec('UPDATE listings SET views = views + 1 WHERE id = ?', [$id]);
        $_SESSION['viewed'][$id] = true;
    }
    json_response(['ok' => true]);
}

$me = require_login();


// ---- Mark sold / available --------------------------------------------------
if ($action === 'status') {
    $listing = own_listing($me);
    $status = api_string('status');
    if (!in_array($status, ['available', 'sold'], true)) {
        api_fail('Choose available or sold.', 'status');
    }
    db_exec('UPDATE listings SET status = ? WHERE id = ?', [$status, $listing['id']]);
    json_response(['ok' => true, 'item' => load_listings('l.id = ?', [$listing['id']])[0], 'message' => $status === 'sold' ? 'Marked as sold.' : 'Marked as available.']);
}


// ---- Delete -------------------------------------------------------------------
if ($action === 'delete') {
    $listing = own_listing($me);
    $paths = array_column(db_all('SELECT path FROM listing_images WHERE listing_id = ?', [$listing['id']]), 'path');
    db_exec('DELETE FROM listings WHERE id = ?', [$listing['id']]);

    // Remove uploaded photo files (not outside links).
    foreach ($paths as $path) {
        if (str_starts_with($path, 'uploads/listings/')) {
            @unlink(dirname(__DIR__) . '/' . $path);
        }
    }
    json_response(['ok' => true, 'message' => 'Listing removed from the Marketplace.']);
}


// ---- Create -------------------------------------------------------------------
if ($action !== 'create') {
    api_fail('Unknown action.', null, 400);
}

$title = preg_replace('/\s+/u', ' ', api_string('name')) ?? '';
$titleLength = mb_strlen($title);
if ($titleLength < 3 || $titleLength > 80) {
    api_fail($titleLength === 0 ? 'Please enter an item name.' : 'Item name must be between 3 and 80 characters.', 'itemName');
}

$categoryId = (int) db_value('SELECT id FROM categories WHERE name = ?', [api_string('category')], 0);
if (!$categoryId) {
    api_fail('Choose a category.', 'category');
}

$condition = api_string('condition');
if (!in_array($condition, ITEM_CONDITIONS, true)) {
    api_fail('Choose the condition of your item.', 'condition');
}

$price = parse_money(api_string('price'));
if ($price === null || (float) $price > MAX_LISTING_PRICE) {
    api_fail('Please enter a valid price, e.g. 450 or 1299.50.', 'price');
}

$location = short_text('location', 80, 'Location') ?: 'Other campus location';

$description = trim(str_replace(["\r\n", "\r"], "\n", api_raw('description')));
if (mb_strlen($description) > 500) {
    api_fail('Description must be 500 characters or fewer.', 'description');
}

$fulfillment = api_string('fulfillment') === 'delivery' ? 'delivery' : 'meetup';
$handoff = [
    'meetup_location'     => null,
    'meetup_availability' => null,
    'meetup_safety'       => null,
    'delivery_area'       => null,
    'delivery_fee'        => null,
    'delivery_payer'      => null,
    'delivery_notes'      => null,
];

if ($fulfillment === 'meetup') {
    $handoff['meetup_location'] = short_text('meetupLocation', 80, 'Meetup location') ?: $location;
    $handoff['meetup_availability'] = short_text('meetupAvailability', 80, 'Availability') ?: 'Flexible';
    $handoff['meetup_safety'] = short_text('meetupSafety', 80, 'Safety option') ?: MEETUP_SAFETY[0];
} else {
    $handoff['delivery_area'] = short_text('deliveryArea', 80, 'Delivery area') ?: DELIVERY_AREAS[0];
    $fee = api_string('deliveryFee') === '' ? '0' : parse_money(api_string('deliveryFee'));
    if ($fee === null || (float) $fee > MAX_LISTING_PRICE) {
        api_fail('Please enter a valid delivery fee.', 'deliveryFee');
    }
    $handoff['delivery_fee'] = $fee;
    $payer = api_string('deliveryPayer');
    $handoff['delivery_payer'] = array_key_exists($payer, DELIVERY_PAYERS) ? $payer : 'buyer';
    $notes = trim(str_replace(["\r\n", "\r"], "\n", api_raw('deliveryNotes')));
    if (mb_strlen($notes) > 300) {
        api_fail('Delivery notes must be 300 characters or fewer.', 'deliveryNotes');
    }
    $handoff['delivery_notes'] = $notes === '' ? null : $notes;
}

// Photos: checked, renamed and resized by store_uploaded_image().
$files = normalize_files($_FILES['photos'] ?? null);
if (count($files) > MAX_LISTING_PHOTOS) {
    api_fail('You can add up to ' . MAX_LISTING_PHOTOS . ' photos.', 'photos');
}

$stored = [];
foreach ($files as $file) {
    $result = store_uploaded_image($file, 'listings');
    if ($result['error']) {
        foreach ($stored as $path) {
            @unlink(dirname(__DIR__) . '/' . $path);
        }
        api_fail($result['error'], 'photos');
    }
    $stored[] = $result['path'];
}

$pdo = db();
$pdo->beginTransaction();
try {
    $listingId = db_insert(
        'INSERT INTO listings (user_id, category_id, title, description, price, item_condition, location, fulfillment,
                               meetup_location, meetup_availability, meetup_safety,
                               delivery_area, delivery_fee, delivery_payer, delivery_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $me['id'], $categoryId, $title, $description === '' ? null : $description, $price, $condition, $location, $fulfillment,
            $handoff['meetup_location'], $handoff['meetup_availability'], $handoff['meetup_safety'],
            $handoff['delivery_area'], $handoff['delivery_fee'], $handoff['delivery_payer'], $handoff['delivery_notes'],
        ]
    );
    foreach ($stored as $order => $path) {
        db_insert('INSERT INTO listing_images (listing_id, path, sort_order) VALUES (?, ?, ?)', [$listingId, $path, $order]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    foreach ($stored as $path) {
        @unlink(dirname(__DIR__) . '/' . $path);
    }
    throw $e;
}

json_response([
    'ok'      => true,
    'item'    => load_listings('l.id = ?', [$listingId])[0],
    'message' => 'Your item is now live in the Marketplace.',
], 201);
