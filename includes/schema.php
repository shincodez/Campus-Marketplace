<?php
/**
 * Database changes made after the original SQL dump.
 *
 * Applied automatically the first time a session needs them, and safe to run
 * any number of times, so an existing database is brought up to date without
 * re-importing campus_marketplace.sql.
 *
 *   users.role            student | admin
 *   users.status          active | suspended (suspended accounts can't log in)
 *   listings.status       + pending (waiting for an administrator to approve it)
 *                         + removed (taken down by an administrator)
 *   categories            + description, is_active (hidden from the Post Item form)
 *   settings              marketplace settings, e.g. review_listings = 1
 *   admin_log             what administrators changed, for Reports & Activity
 */

const SCHEMA_VERSION = 1;

/** The categories the student pages are built around (Home and Marketplace link to them by name). */
const BUILT_IN_CATEGORIES = [
    'books'       => 'Course books, reviewers, and academic references',
    'electronics' => 'Phones, laptops, accessories, and gadgets',
    'uniforms'    => 'School, laboratory, and PE uniforms',
    'supplies'    => 'Stationery, art materials, and project supplies',
    'calculators' => 'Scientific, graphing, and printing calculators',
    'sports'      => 'Athletic gear, apparel, and equipment',
    'furniture'   => 'Desks, chairs, lamps, and dorm furniture',
    'accessories' => 'Bags, headphones, watches, and other add-ons',
    'others'      => 'Other campus-appropriate student items',
];

function ensure_schema(): void
{
    if (($_SESSION['schema_version'] ?? 0) === SCHEMA_VERSION) {
        return;
    }

    if (!db_one("SHOW COLUMNS FROM users LIKE 'role'")) {
        db_exec("ALTER TABLE users ADD COLUMN role ENUM('student','admin') NOT NULL DEFAULT 'student' AFTER campus");
    }
    if (!db_one("SHOW COLUMNS FROM users LIKE 'status'")) {
        db_exec("ALTER TABLE users ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active' AFTER role");
    }

    $listingStatus = db_one("SHOW COLUMNS FROM listings LIKE 'status'");
    if ($listingStatus && !str_contains($listingStatus['Type'], "'pending'")) {
        db_exec("ALTER TABLE listings MODIFY status ENUM('available','pending','sold','removed') NOT NULL DEFAULT 'available'");
    }

    if (!db_one("SHOW COLUMNS FROM categories LIKE 'description'")) {
        db_exec("ALTER TABLE categories ADD COLUMN description VARCHAR(120) NOT NULL DEFAULT '' AFTER icon");
        foreach (BUILT_IN_CATEGORIES as $slug => $description) {
            db_exec("UPDATE categories SET description = ? WHERE slug = ? AND description = ''", [$description, $slug]);
        }
        // Home shows "Others" as three dots; keep the stored icon the same.
        db_exec("UPDATE categories SET icon = 'ellipsis' WHERE slug = 'others' AND icon = 'layout-grid'");
    }
    if (!db_one("SHOW COLUMNS FROM categories LIKE 'is_active'")) {
        db_exec("ALTER TABLE categories ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description");
    }

    db_exec("CREATE TABLE IF NOT EXISTS settings (
                name VARCHAR(40) NOT NULL PRIMARY KEY,
                value VARCHAR(255) NOT NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    db_exec("CREATE TABLE IF NOT EXISTS admin_log (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                admin_id INT UNSIGNED NULL,
                action VARCHAR(40) NOT NULL,
                target_type VARCHAR(20) NOT NULL,
                target_id INT UNSIGNED NULL,
                target_label VARCHAR(120) NOT NULL DEFAULT '',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_admin_log_time (created_at),
                CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $_SESSION['schema_version'] = SCHEMA_VERSION;
}


/** A marketplace setting (settings table), or $default when it was never saved. */
function setting(string $name, string $default = ''): string
{
    return (string) db_value('SELECT value FROM settings WHERE name = ?', [$name], $default);
}

function save_setting(string $name, string $value): void
{
    db_exec('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [$name, $value]);
}
