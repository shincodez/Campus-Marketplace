<?php
/**
 * Loaded by every API endpoint in /api (through includes/api.php).
 */

require_once __DIR__ . '/config.php';

date_default_timezone_set(APP_TIMEZONE);

error_reporting(E_ALL);
ini_set('display_errors', APP_DEBUG ? '1' : '0');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('campus_marketplace');
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
    ]);
}

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/schema.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/data.php';

ensure_schema();
