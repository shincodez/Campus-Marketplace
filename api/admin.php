<?php
/**
 * Administrator API for admin/admin.html. Every request needs an admin account.
 *
 * GET  ?view=overview&days=30                    dashboard numbers, recent listings and activity
 * GET  ?view=users&q=&status=&role=&page=        accounts, newest first
 * GET  ?view=user&id=                            one account with its listings
 * GET  ?view=listings&q=&category=&status=&days=&page=
 * GET  ?view=categories
 * GET  ?view=reports&months=12                   totals and listings per month
 * GET  ?view=activity&type=&page=                activity log (students' and admins')
 * GET  ?view=settings
 *
 * POST action=user-save        {id?, name, email, studentId, campus, role, password?}
 * POST action=user-status      {id, status: active | suspended}
 * POST action=listing-status   {id, status: available | sold | removed}   (pending → available = approve)
 * POST action=listing-save     {id, name, price, categoryId, condition}
 * POST action=category-save    {id?, name, description, icon, active}
 * POST action=category-delete  {id}
 * POST action=settings-save    {reviewListings}
 */
require dirname(__DIR__) . '/includes/api.php';

$admin = require_admin();

const PAGE_SIZE = 10;
const LISTING_STATUSES = ['available', 'pending', 'sold', 'removed'];

/** Icons an administrator can pick for a category (drawn by js/category-icons.js). */
const CATEGORY_ICONS = [
    'book-open', 'laptop', 'smartphone', 'headphones', 'shirt', 'pencil-ruler', 'calculator', 'dumbbell',
    'armchair', 'bed', 'backpack', 'flask-conical', 'music', 'camera', 'watch', 'gamepad', 'bike',
    'utensils', 'gift', 'tag', 'layout-grid', 'ellipsis',
];


// =============================================================== helpers

function log_admin(string $action, string $type, ?int $id, string $label): void
{
    global $admin;
    db_insert(
        'INSERT INTO admin_log (admin_id, action, target_type, target_id, target_label) VALUES (?, ?, ?, ?, ?)',
        [(int) $admin['id'], $action, $type, $id, mb_substr($label, 0, 120)]
    );
}

/** "%term%" for LIKE, with LIKE's own wildcards taken literally. */
function like(string $term): string
{
    return '%' . addcslashes($term, '%_\\') . '%';
}

function page_number(): int
{
    return max(1, query_int('page', 1));
}

/** Rows for one page plus the paging numbers the tables show. */
function paged(string $from, string $where, array $params, string $select, string $order): array
{
    $total = (int) db_value("SELECT COUNT(*) {$from} WHERE {$where}", $params);
    $pages = max(1, (int) ceil($total / PAGE_SIZE));
    $page = min(page_number(), $pages);
    $offset = ($page - 1) * PAGE_SIZE;

    $rows = db_all("SELECT {$select} {$from} WHERE {$where} ORDER BY {$order} LIMIT " . PAGE_SIZE . " OFFSET {$offset}", $params);

    return [$rows, ['page' => $page, 'pages' => $pages, 'total' => $total, 'perPage' => PAGE_SIZE]];
}

function short_date(?string $datetime): string
{
    return $datetime ? date('M j, Y', strtotime($datetime)) : '';
}

function user_payload(array $row): array
{
    return [
        'id'        => (int) $row['id'],
        'name'      => $row['full_name'],
        'initials'  => initials($row['full_name']),
        'email'     => $row['email'],
        'studentId' => (string) $row['student_id'],
        'campus'    => $row['campus'],
        'role'      => $row['role'],
        'status'    => $row['status'],
        'joined'    => short_date($row['created_at']),
        'listings'  => (int) ($row['listing_count'] ?? 0),
    ];
}

const LISTING_COLUMNS = "l.id, l.title, l.price, l.status, l.item_condition, l.location, l.description, l.views,
        l.created_at, l.user_id, l.category_id, c.name AS category_name, c.icon AS category_icon,
        u.full_name AS seller_name,
        (SELECT li.path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order, li.id LIMIT 1) AS cover";

const LISTING_FROM = 'FROM listings l JOIN categories c ON c.id = l.category_id JOIN users u ON u.id = l.user_id';

function listing_payload(array $row): array
{
    return [
        'id'           => (int) $row['id'],
        'name'         => $row['title'],
        'details'      => $row['item_condition'] . ' · ' . $row['location'],
        'description'  => (string) $row['description'],
        'price'        => (float) $row['price'],
        'condition'    => $row['item_condition'],
        'categoryId'   => (int) $row['category_id'],
        'category'     => $row['category_name'],
        'categoryIcon' => $row['category_icon'],
        'seller'       => $row['seller_name'],
        'sellerId'     => (int) $row['user_id'],
        'status'       => $row['status'],
        'image'        => $row['cover'] ? image_url($row['cover']) : '',
        'views'        => (int) $row['views'],
        'posted'       => short_date($row['created_at']),
        'postedAgo'    => time_ago($row['created_at']),
    ];
}

function find_listing_row(int $id): array
{
    $row = $id > 0 ? db_one('SELECT ' . LISTING_COLUMNS . ' ' . LISTING_FROM . ' WHERE l.id = ?', [$id]) : null;
    if (!$row) {
        api_fail('That listing could not be found.', null, 404);
    }
    return $row;
}

function find_user_row(int $id): array
{
    $row = $id > 0 ? db_one('SELECT * FROM users WHERE id = ?', [$id]) : null;
    if (!$row) {
        api_fail('That account could not be found.', null, 404);
    }
    return $row;
}


/**
 * Everything that happened on the marketplace, newest first: students signing
 * up, listings being posted, and what administrators changed (admin_log).
 * $type: all | students | admins | listings
 */
function activity_feed(int $limit, int $offset = 0, string $type = 'all'): array
{
    $filters = [
        'students' => "actor_role = 'student'",
        'admins'   => "actor_role = 'admin'",
        'listings' => "target_type = 'listing'",
    ];
    $where = $filters[$type] ?? '1 = 1';

    $feed = "SELECT u.created_at AS at, 'registered' AS kind, u.full_name AS actor, u.role AS actor_role,
                    'Student account' AS target, u.id AS target_id, 'user' AS target_type, 'completed' AS state
               FROM users u WHERE u.role = 'student'
             UNION ALL
             SELECT l.created_at, 'posted', u.full_name, u.role, l.title, l.id, 'listing',
                    IF(l.status = 'pending', 'review', 'completed')
               FROM listings l JOIN users u ON u.id = l.user_id
             UNION ALL
             SELECT a.created_at, a.action, COALESCE(u.full_name, 'Former administrator'), 'admin',
                    a.target_label, a.target_id, a.target_type,
                    CASE WHEN a.action IN ('listing.remove', 'category.delete') THEN 'removed'
                         WHEN a.action = 'user.suspend' THEN 'suspended' ELSE 'completed' END
               FROM admin_log a LEFT JOIN users u ON u.id = a.admin_id";

    $total = (int) db_value("SELECT COUNT(*) FROM ({$feed}) feed WHERE {$where}");
    $rows = db_all("SELECT * FROM ({$feed}) feed WHERE {$where} ORDER BY at DESC LIMIT {$limit} OFFSET {$offset}");

    $labels = [
        'registered'       => 'Registered an account',
        'posted'           => 'Posted a listing',
        'listing.approve'  => 'Approved a listing',
        'listing.remove'   => 'Removed a listing',
        'listing.restore'  => 'Restored a listing',
        'listing.sold'     => 'Marked a listing sold',
        'listing.edit'     => 'Edited a listing',
        'user.create'      => 'Created an account',
        'user.edit'        => 'Edited an account',
        'user.suspend'     => 'Suspended an account',
        'user.activate'    => 'Reactivated an account',
        'category.create'  => 'Created a category',
        'category.edit'    => 'Edited a category',
        'category.delete'  => 'Deleted a category',
        'settings.review_on'  => 'Turned on listing review',
        'settings.review_off' => 'Turned off listing review',
    ];

    $items = array_map(fn($row) => [
        'kind'       => $row['kind'],
        'activity'   => $row['kind'] === 'posted' && $row['state'] === 'review'
            ? 'Submitted a listing'
            : ($labels[$row['kind']] ?? 'Updated the marketplace'),
        'actor'      => $row['actor'],
        'actorRole'  => $row['actor_role'],
        'target'     => $row['target'],
        'targetType' => $row['target_type'],
        'targetId'   => $row['target_id'] === null ? null : (int) $row['target_id'],
        'status'     => $row['state'],
        'date'       => short_date($row['at']),
        'time'       => date('g:i A', strtotime($row['at'])),
        'ago'        => time_ago($row['at']),
    ], $rows);

    return [$items, $total];
}


// =============================================================== GET
if (!is_post()) {
    $view = query('view', 'overview');

    // ---- Dashboard ------------------------------------------------------
    if ($view === 'overview') {
        $days = in_array(query_int('days', 30), [7, 30, 90, 365], true) ? query_int('days', 30) : 30;
        $since = date('Y-m-d H:i:s', strtotime("-{$days} days"));

        $count = fn(string $sql, array $params = []) => (int) db_value($sql, $params);

        [$activity] = activity_feed(5);
        $recent = db_all('SELECT ' . LISTING_COLUMNS . ' ' . LISTING_FROM . ' ORDER BY l.created_at DESC, l.id DESC LIMIT 5');

        json_response([
            'ok'    => true,
            'days'  => $days,
            'stats' => [
                'users'    => ['total' => $count("SELECT COUNT(*) FROM users WHERE role = 'student'"),
                               'recent' => $count("SELECT COUNT(*) FROM users WHERE role = 'student' AND created_at >= ?", [$since])],
                'active'   => ['total' => $count("SELECT COUNT(*) FROM listings WHERE status = 'available'"),
                               'recent' => $count("SELECT COUNT(*) FROM listings WHERE status = 'available' AND created_at >= ?", [$since])],
                'pending'  => ['total' => $count("SELECT COUNT(*) FROM listings WHERE status = 'pending'")],
                'sold'     => ['total' => $count("SELECT COUNT(*) FROM listings WHERE status = 'sold'"),
                               'recent' => $count("SELECT COUNT(*) FROM listings WHERE status = 'sold' AND COALESCE(updated_at, created_at) >= ?", [$since])],
            ],
            'listings' => array_map('listing_payload', $recent),
            'activity' => $activity,
        ]);
    }

    // ---- Users ----------------------------------------------------------
    if ($view === 'users') {
        $where = ['1 = 1'];
        $params = [];
        if (($q = query('q')) !== '') {
            $where[] = '(u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)';
            array_push($params, like($q), like($q), like($q));
        }
        if (in_array($status = query('status'), ['active', 'suspended'], true)) {
            $where[] = 'u.status = ?';
            $params[] = $status;
        }
        if (in_array($role = query('role'), ['student', 'admin'], true)) {
            $where[] = 'u.role = ?';
            $params[] = $role;
        }

        [$rows, $paging] = paged(
            'FROM users u',
            implode(' AND ', $where),
            $params,
            "u.*, (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status <> 'removed') AS listing_count",
            'u.created_at DESC, u.id DESC'
        );
        json_response(['ok' => true, 'users' => array_map('user_payload', $rows), 'paging' => $paging, 'me' => (int) $admin['id']]);
    }

    if ($view === 'user') {
        $row = find_user_row(query_int('id'));
        $counts = [];
        foreach (db_all('SELECT status, COUNT(*) AS n FROM listings WHERE user_id = ? GROUP BY status', [$row['id']]) as $c) {
            $counts[$c['status']] = (int) $c['n'];
        }
        $row['listing_count'] = array_sum($counts) - ($counts['removed'] ?? 0);
        $recent = db_all('SELECT ' . LISTING_COLUMNS . ' ' . LISTING_FROM . ' WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 5', [$row['id']]);

        json_response([
            'ok'       => true,
            'user'     => user_payload($row) + ['bio' => (string) $row['bio'], 'counts' => $counts],
            'listings' => array_map('listing_payload', $recent),
            'me'       => (int) $admin['id'],
        ]);
    }

    // ---- Listings -------------------------------------------------------
    if ($view === 'listings') {
        $where = ['1 = 1'];
        $params = [];
        if (($q = query('q')) !== '') {
            $where[] = '(l.title LIKE ? OR u.full_name LIKE ?)';
            array_push($params, like($q), like($q));
        }
        if (($category = query_int('category')) > 0) {
            $where[] = 'l.category_id = ?';
            $params[] = $category;
        }
        if (in_array($status = query('status'), LISTING_STATUSES, true)) {
            $where[] = 'l.status = ?';
            $params[] = $status;
        }
        if (in_array($days = query_int('days'), [7, 30, 90], true)) {
            $where[] = 'l.created_at >= ?';
            $params[] = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        }

        [$rows, $paging] = paged(LISTING_FROM, implode(' AND ', $where), $params, LISTING_COLUMNS, 'l.created_at DESC, l.id DESC');
        json_response(['ok' => true, 'listings' => array_map('listing_payload', $rows), 'paging' => $paging]);
    }

    // ---- Categories -----------------------------------------------------
    if ($view === 'categories') {
        $rows = db_all("SELECT c.*, (SELECT COUNT(*) FROM listings l WHERE l.category_id = c.id AND l.status <> 'removed') AS listing_count
                          FROM categories c ORDER BY c.sort_order, c.name");
        json_response([
            'ok'         => true,
            'categories' => array_map(fn($row) => [
                'id'          => (int) $row['id'],
                'name'        => $row['name'],
                'slug'        => $row['slug'],
                'icon'        => $row['icon'],
                'description' => $row['description'],
                'active'      => (bool) $row['is_active'],
                'listings'    => (int) $row['listing_count'],
                'builtIn'     => array_key_exists($row['slug'], BUILT_IN_CATEGORIES),
            ], $rows),
            'icons'      => CATEGORY_ICONS,
        ]);
    }

    // ---- Reports & Activity ---------------------------------------------
    if ($view === 'reports') {
        $months = query_int('months', 12) === 6 ? 6 : 12;
        $now = time();
        $monthAgo = date('Y-m-d H:i:s', strtotime('-30 days', $now));
        $twoMonthsAgo = date('Y-m-d H:i:s', strtotime('-60 days', $now));
        $count = fn(string $sql, array $params = []) => (int) db_value($sql, $params);

        // Listings created per calendar month, oldest first, with empty months as 0.
        $first = date('Y-m-01', strtotime('-' . ($months - 1) . ' months', strtotime(date('Y-m-01'))));
        $byMonth = [];
        foreach (db_all("SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS n FROM listings WHERE created_at >= ? GROUP BY ym", [$first]) as $row) {
            $byMonth[$row['ym']] = (int) $row['n'];
        }
        $series = [];
        for ($i = 0; $i < $months; $i++) {
            $month = strtotime("+{$i} months", strtotime($first));
            $series[] = ['label' => date('M', $month), 'title' => date('F Y', $month), 'count' => $byMonth[date('Y-m', $month)] ?? 0];
        }

        $students = $count("SELECT COUNT(*) FROM users WHERE role = 'student'");

        json_response([
            'ok'     => true,
            'months' => $months,
            'stats'  => [
                'listings' => ['total'    => $count("SELECT COUNT(*) FROM listings WHERE status <> 'removed'"),
                               'current'  => $count('SELECT COUNT(*) FROM listings WHERE created_at >= ?', [$monthAgo]),
                               'previous' => $count('SELECT COUNT(*) FROM listings WHERE created_at >= ? AND created_at < ?', [$twoMonthsAgo, $monthAgo])],
                'sold'     => ['total'    => $count("SELECT COUNT(*) FROM listings WHERE status = 'sold'"),
                               'current'  => $count("SELECT COUNT(*) FROM listings WHERE status = 'sold' AND COALESCE(updated_at, created_at) >= ?", [$monthAgo]),
                               'previous' => $count("SELECT COUNT(*) FROM listings WHERE status = 'sold' AND COALESCE(updated_at, created_at) >= ? AND COALESCE(updated_at, created_at) < ?", [$twoMonthsAgo, $monthAgo])],
                'users'    => ['total'    => $count("SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active'"),
                               'students' => $students],
                'pending'  => ['total'    => $count("SELECT COUNT(*) FROM listings WHERE status = 'pending'")],
            ],
            'series' => $series,
        ]);
    }

    if ($view === 'activity') {
        $type = in_array(query('type'), ['students', 'admins', 'listings'], true) ? query('type') : 'all';
        $page = page_number();
        [$items, $total] = activity_feed(PAGE_SIZE, ($page - 1) * PAGE_SIZE, $type);
        json_response([
            'ok'       => true,
            'activity' => $items,
            'paging'   => ['page' => $page, 'pages' => max(1, (int) ceil($total / PAGE_SIZE)), 'total' => $total, 'perPage' => PAGE_SIZE],
        ]);
    }

    // ---- Settings -------------------------------------------------------
    if ($view === 'settings') {
        json_response([
            'ok'       => true,
            'settings' => ['reviewListings' => setting('review_listings', '0') === '1'],
            'pending'  => (int) db_value("SELECT COUNT(*) FROM listings WHERE status = 'pending'"),
        ]);
    }

    // Sidebar badge and the bell.
    if ($view === 'counts') {
        json_response(['ok' => true, 'pending' => (int) db_value("SELECT COUNT(*) FROM listings WHERE status = 'pending'")]);
    }

    api_fail('Unknown view.', null, 400);
}


// =============================================================== POST
api_require_post();
$action = api_string('action');
$input = api_input();
$id = (int) ($input['id'] ?? 0);


// ---- Accounts ---------------------------------------------------------------
if ($action === 'user-save') {
    $existing = $id ? find_user_row($id) : null;

    $name = preg_replace('/\s+/u', ' ', api_string('name')) ?? '';
    $email = mb_strtolower(api_string('email'));
    $studentId = api_string('studentId');
    $campus = preg_replace('/\s+/u', ' ', api_string('campus')) ?: 'Main Campus';
    $role = api_string('role') === 'admin' ? 'admin' : 'student';
    $password = api_raw('password');

    if ($error = validate_account_fields($name, $email, $existing ? (int) $existing['id'] : null)) {
        api_fail($error[0], $error[1]);
    }
    if ($studentId === '' && $role === 'student') {
        api_fail('Enter the student ID.', 'studentId');
    }
    if ($studentId !== '' && !preg_match('/^[A-Za-z0-9-]{4,30}$/', $studentId)) {
        api_fail('Student ID must be 4 to 30 characters using letters, numbers and dashes only.', 'studentId');
    }
    if ($studentId !== '' && db_value('SELECT id FROM users WHERE student_id = ? AND id <> ?', [$studentId, $existing['id'] ?? 0])) {
        api_fail('Another account already uses that student ID.', 'studentId');
    }
    if (mb_strlen($campus) > 80) {
        api_fail('Campus must be 80 characters or fewer.', 'campus');
    }
    if ($existing && (int) $existing['id'] === (int) $admin['id'] && $role !== 'admin') {
        api_fail("You can't remove your own administrator access.", 'role');
    }
    if (!$existing || $password !== '') {
        if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            api_fail('Password must be at least 8 characters and include a letter and a number.', 'password');
        }
        if (strlen($password) > 72) {
            api_fail('Password must be 72 characters or fewer.', 'password');
        }
    }

    if ($existing) {
        db_exec('UPDATE users SET full_name = ?, email = ?, student_id = ?, campus = ?, role = ? WHERE id = ?',
            [$name, $email, $studentId === '' ? null : $studentId, $campus, $role, $existing['id']]);
        if ($password !== '') {
            db_exec('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $existing['id']]);
        }
        $userId = (int) $existing['id'];
        log_admin('user.edit', 'user', $userId, $name);
        $message = 'Account updated.';
    } else {
        $userId = db_insert(
            'INSERT INTO users (full_name, email, student_id, password_hash, campus, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [$name, $email, $studentId === '' ? null : $studentId, password_hash($password, PASSWORD_DEFAULT), $campus, $role]
        );
        log_admin('user.create', 'user', $userId, $name);
        $message = $role === 'admin' ? 'Administrator account created.' : 'Student account created.';
    }

    $row = db_one("SELECT u.*, (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status <> 'removed') AS listing_count FROM users u WHERE u.id = ?", [$userId]);
    json_response(['ok' => true, 'user' => user_payload($row), 'message' => $message], $existing ? 200 : 201);
}

if ($action === 'user-status') {
    $user = find_user_row($id);
    $status = api_string('status');
    if (!in_array($status, ['active', 'suspended'], true)) {
        api_fail('Choose active or suspended.', 'status');
    }
    if ((int) $user['id'] === (int) $admin['id']) {
        api_fail("You can't suspend your own account.", 'status');
    }
    db_exec('UPDATE users SET status = ? WHERE id = ?', [$status, $user['id']]);
    log_admin($status === 'suspended' ? 'user.suspend' : 'user.activate', 'user', (int) $user['id'], $user['full_name']);
    json_response(['ok' => true, 'message' => $status === 'suspended'
        ? $user['full_name'] . ' is suspended. Their listings are hidden from the Marketplace.'
        : $user['full_name'] . ' can use the marketplace again.']);
}


// ---- Listings ---------------------------------------------------------------
if ($action === 'listing-status') {
    $listing = find_listing_row($id);
    $status = api_string('status');
    if (!in_array($status, ['available', 'sold', 'removed'], true)) {
        api_fail('Choose available, sold or removed.', 'status');
    }
    if ($status === $listing['status']) {
        json_response(['ok' => true, 'listing' => listing_payload($listing), 'message' => 'Nothing to change.']);
    }

    db_exec('UPDATE listings SET status = ? WHERE id = ?', [$status, $listing['id']]);
    [$logAction, $message] = match (true) {
        $status === 'removed'               => ['listing.remove', 'Listing removed from the Marketplace.'],
        $listing['status'] === 'pending'    => ['listing.approve', 'Listing approved. It is now live in the Marketplace.'],
        $listing['status'] === 'removed'    => ['listing.restore', 'Listing restored to the Marketplace.'],
        $status === 'sold'                  => ['listing.sold', 'Listing marked as sold.'],
        default                             => ['listing.edit', 'Listing marked as available.'],
    };
    log_admin($logAction, 'listing', (int) $listing['id'], $listing['title']);
    json_response(['ok' => true, 'listing' => listing_payload(find_listing_row((int) $listing['id'])), 'message' => $message]);
}

if ($action === 'listing-save') {
    $listing = find_listing_row($id);

    $title = preg_replace('/\s+/u', ' ', api_string('name')) ?? '';
    if (mb_strlen($title) < 3 || mb_strlen($title) > 80) {
        api_fail('Item name must be between 3 and 80 characters.', 'name');
    }
    $price = str_replace([',', ' '], '', api_string('price'));
    if (!preg_match('/^\d{1,9}(\.\d{1,2})?$/', $price) || (float) $price > 999999.99) {
        api_fail('Please enter a valid price, e.g. 450 or 1299.50.', 'price');
    }
    $categoryId = (int) ($input['categoryId'] ?? 0);
    if (!db_value('SELECT id FROM categories WHERE id = ?', [$categoryId])) {
        api_fail('Choose a category.', 'categoryId');
    }
    $condition = api_string('condition');
    if (!in_array($condition, ITEM_CONDITIONS, true)) {
        api_fail('Choose the condition of the item.', 'condition');
    }

    db_exec('UPDATE listings SET title = ?, price = ?, category_id = ?, item_condition = ? WHERE id = ?',
        [$title, $price, $categoryId, $condition, $listing['id']]);
    log_admin('listing.edit', 'listing', (int) $listing['id'], $title);
    json_response(['ok' => true, 'listing' => listing_payload(find_listing_row((int) $listing['id'])), 'message' => 'Listing updated.']);
}


// ---- Categories -------------------------------------------------------------
if ($action === 'category-save') {
    $existing = $id ? db_one('SELECT * FROM categories WHERE id = ?', [$id]) : null;
    if ($id && !$existing) {
        api_fail('That category could not be found.', null, 404);
    }

    $name = preg_replace('/\s+/u', ' ', api_string('name')) ?? '';
    $description = preg_replace('/\s+/u', ' ', api_string('description')) ?? '';
    $icon = api_string('icon');
    $active = in_array($input['active'] ?? true, [true, 1, '1', 'true', 'on'], true);
    $builtIn = $existing && array_key_exists($existing['slug'], BUILT_IN_CATEGORIES);

    if ($builtIn && $name !== $existing['name']) {
        api_fail('Built-in category names are used across the student pages, so they can\'t be renamed.', 'name');
    }
    if (mb_strlen($name) < 2 || mb_strlen($name) > 40) {
        api_fail('Category name must be between 2 and 40 characters.', 'name');
    }
    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($name)), '-');
    if ($slug === '') {
        api_fail('Use letters or numbers in the category name.', 'name');
    }
    if (db_value('SELECT id FROM categories WHERE (LOWER(name) = LOWER(?) OR slug = ?) AND id <> ?', [$name, $slug, $existing['id'] ?? 0])) {
        api_fail('A category with that name already exists.', 'name');
    }
    if (mb_strlen($description) > 120) {
        api_fail('Description must be 120 characters or fewer.', 'description');
    }
    if (!in_array($icon, CATEGORY_ICONS, true)) {
        api_fail('Choose an icon.', 'icon');
    }
    if (!$active && !db_value('SELECT id FROM categories WHERE is_active = 1 AND id <> ?', [$existing['id'] ?? 0])) {
        api_fail('Keep at least one category visible so students can post items.', 'active');
    }

    if ($existing) {
        db_exec('UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, is_active = ? WHERE id = ?',
            [$name, $builtIn ? $existing['slug'] : $slug, $description, $icon, $active ? 1 : 0, $existing['id']]);
        $categoryId = (int) $existing['id'];
        log_admin('category.edit', 'category', $categoryId, $name);
    } else {
        $order = (int) db_value('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories');
        $categoryId = db_insert('INSERT INTO categories (name, slug, icon, description, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [$name, $slug, $icon, $description, $active ? 1 : 0, $order]);
        log_admin('category.create', 'category', $categoryId, $name);
    }
    json_response(['ok' => true, 'message' => $existing ? 'Category updated.' : 'Category added. Students can post in it now.'], $existing ? 200 : 201);
}

if ($action === 'category-delete') {
    $category = $id ? db_one('SELECT * FROM categories WHERE id = ?', [$id]) : null;
    if (!$category) {
        api_fail('That category could not be found.', null, 404);
    }
    if (array_key_exists($category['slug'], BUILT_IN_CATEGORIES)) {
        api_fail('Built-in categories can\'t be deleted. Hide it instead so students can\'t post in it.');
    }
    $used = (int) db_value('SELECT COUNT(*) FROM listings WHERE category_id = ?', [$category['id']]);
    if ($used) {
        api_fail('This category has ' . plural($used, 'listing') . '. Move them to another category or hide the category instead.');
    }
    db_exec('DELETE FROM categories WHERE id = ?', [$category['id']]);
    log_admin('category.delete', 'category', (int) $category['id'], $category['name']);
    json_response(['ok' => true, 'message' => 'Category deleted.']);
}


// ---- Settings ---------------------------------------------------------------
if ($action === 'settings-save') {
    $review = in_array($input['reviewListings'] ?? false, [true, 1, '1', 'true', 'on'], true);
    if ((setting('review_listings', '0') === '1') !== $review) {
        save_setting('review_listings', $review ? '1' : '0');
        log_admin($review ? 'settings.review_on' : 'settings.review_off', 'settings', null, 'Marketplace settings');
    }
    json_response(['ok' => true, 'settings' => ['reviewListings' => $review], 'message' => $review
        ? 'New listings will wait for approval before they appear.'
        : 'New listings will go live right away.']);
}

api_fail('Unknown action.', null, 400);
