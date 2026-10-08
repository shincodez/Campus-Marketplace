<?php
/**
 * Campus Marketplace configuration.
 *
 * The defaults match a fresh XAMPP install (MySQL/MariaDB user "root" with
 * no password). Change them here if your setup is different.
 */

// ---- Database ---------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'campus_marketplace');
define('DB_USER', 'root');
define('DB_PASS', '');

// ---- Application ------------------------------------------------------------
define('APP_NAME', 'NORSU Campus Marketplace');
define('APP_TIMEZONE', 'Asia/Manila');
define('APP_DEBUG', false);           // true shows detailed errors (only while developing)
define('CURRENCY_SYMBOL', '₱');

// ---- Uploads ----------------------------------------------------------------
define('UPLOAD_DIR', dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads');
define('MAX_UPLOAD_BYTES', 5 * 1024 * 1024);   // 5 MB per image
define('MAX_LISTING_PHOTOS', 5);
define('MAX_IMAGE_DIMENSION', 1400);           // longest side after resize (px)

// ---- Marketplace vocab (single source of truth for forms and filters) ------
const ITEM_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair'];

const CAMPUS_LOCATIONS = [
    'Near Student Center',
    'Near Library',
    'Near Engineering',
    'Near Main Gate',
    'Near Gate 2',
    'Near Gate 3',
    'Other campus location',
];

const MEETUP_AVAILABILITY = ['Weekdays · 8 AM–5 PM', 'Weekdays · After 4 PM', 'Weekends', 'Flexible'];
const MEETUP_SAFETY = ['Public campus location', 'Campus security area'];
const DELIVERY_AREAS = ['Within campus', 'Campus + nearby area', 'Seller-defined area'];
const DELIVERY_PAYERS = [
    'buyer'    => 'Buyer pays',
    'seller'   => 'Seller pays',
    'included' => 'Included in item price',
];

const SORT_OPTIONS = [
    'newest'     => 'Newest first',
    'popular'    => 'Most popular',
    'price_asc'  => 'Price: Low to High',
    'price_desc' => 'Price: High to Low',
];
