<?php
/**
 * GET — the categories students can post in (admins manage them in admin/).
 * [{ id, name, slug, icon, description }] in display order.
 */
require dirname(__DIR__) . '/includes/api.php';

$rows = db_all('SELECT id, name, slug, icon, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name');

json_response([
    'ok'         => true,
    'categories' => array_map(fn($row) => [
        'id'          => (int) $row['id'],
        'name'        => $row['name'],
        'slug'        => $row['slug'],
        'icon'        => $row['icon'],
        'description' => $row['description'],
    ], $rows),
]);
