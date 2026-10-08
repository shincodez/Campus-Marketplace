<?php
/**
 * General helpers: escaping, URLs, redirects, flash messages, formatting,
 * request input, CSRF and uploads.
 */

// ---------------------------------------------------------------------------
// Escaping & URLs
// ---------------------------------------------------------------------------

/** Escape a value for HTML output. Use for EVERY dynamic value in templates. */
function e($value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Base URL path of the app, e.g. "/campus-marketplace" (no trailing slash).
 * Works no matter which folder inside htdocs the project lives in.
 */
function base_path(): string
{
    static $base = null;
    if ($base !== null) {
        return $base;
    }

    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $dir = rtrim(str_replace('\\', '/', dirname($script)), '/');

    // Scripts inside these sub-folders belong to the same app root.
    if (in_array(basename($dir), ['actions', 'api', 'includes'], true)) {
        $dir = rtrim(str_replace('\\', '/', dirname($dir)), '/');
    }

    return $base = ($dir === '.' ? '' : $dir);
}

/** Build an app URL: url('listing.php', ['id' => 4]) => /campus-marketplace/listing.php?id=4 */
function url(string $path = '', array $query = []): string
{
    $query = array_filter($query, fn($v) => $v !== null && $v !== '');
    $href = base_path() . '/' . ltrim($path, '/');
    if ($query) {
        $href .= (str_contains($href, '?') ? '&' : '?') . http_build_query($query);
    }
    return $href;
}

/** URL to a static asset with cache-busting version. */
function asset(string $path): string
{
    $file = dirname(__DIR__) . '/assets/' . ltrim($path, '/');
    $version = is_file($file) ? filemtime($file) : '1';
    return url('assets/' . ltrim($path, '/')) . '?v=' . $version;
}

/** Current request URI (path + query), used for "next" redirects. */
function current_url(): string
{
    return $_SERVER['REQUEST_URI'] ?? url();
}

/** The current script name without extension, e.g. "marketplace". */
function current_page(): string
{
    return basename($_SERVER['SCRIPT_NAME'] ?? 'index.php', '.php');
}

/** Redirect to an app path (or absolute app URL) and stop. */
function redirect(string $path, array $query = []): void
{
    $target = str_starts_with($path, '/') ? $path : url($path, $query);
    header('Location: ' . $target);
    exit;
}

/**
 * Only allow redirects to paths inside this app (prevents open redirects).
 * Returns null when $target is unsafe.
 */
function safe_redirect_target(?string $target): ?string
{
    if (!$target) {
        return null;
    }
    $target = trim($target);
    // Must be a site-relative path, not "//evil.com" or "https://..."
    if (!str_starts_with($target, '/') || str_starts_with($target, '//') || str_contains($target, '\\')) {
        return null;
    }
    $base = base_path();
    if ($base !== '' && !str_starts_with($target, $base . '/') && $target !== $base) {
        return null;
    }
    return $target;
}

/** Redirect back to the page the form came from (POST "back" field or Referer). */
function redirect_back(string $fallback = 'index.php'): void
{
    $candidates = [$_POST['back'] ?? null, $_GET['back'] ?? null];

    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if ($referer !== '') {
        $parts = parse_url($referer);
        $sameHost = ($parts['host'] ?? '') === ($_SERVER['HTTP_HOST'] ?? '')
            || (($parts['host'] ?? '') . (isset($parts['port']) ? ':' . $parts['port'] : '')) === ($_SERVER['HTTP_HOST'] ?? '');
        if ($sameHost) {
            $candidates[] = ($parts['path'] ?? '/') . (isset($parts['query']) ? '?' . $parts['query'] : '');
        }
    }

    foreach ($candidates as $candidate) {
        if ($safe = safe_redirect_target($candidate)) {
            header('Location: ' . $safe);
            exit;
        }
    }
    redirect($fallback);
}

// ---------------------------------------------------------------------------
// Request input
// ---------------------------------------------------------------------------

function is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

/** Trimmed string from POST. */
function input(string $key, string $default = ''): string
{
    $value = $_POST[$key] ?? $default;
    return is_string($value) ? trim($value) : $default;
}

/** Integer from POST. */
function input_int(string $key, int $default = 0): int
{
    $value = $_POST[$key] ?? null;
    return is_numeric($value) ? (int) $value : $default;
}

/** Trimmed string from the query string. */
function query(string $key, string $default = ''): string
{
    $value = $_GET[$key] ?? $default;
    return is_string($value) ? trim($value) : $default;
}

/** Integer from the query string. */
function query_int(string $key, int $default = 0): int
{
    $value = $_GET[$key] ?? null;
    return is_numeric($value) ? (int) $value : $default;
}

/** True when the request was sent by fetch() and wants JSON back. */
function wants_json(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch'
        || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

/** Send a JSON response and stop. */
function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// ---------------------------------------------------------------------------
// Flash messages & old input
// ---------------------------------------------------------------------------

/** Queue a toast for the next page view. $type: success | error | info */
function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

/** Pull (and clear) queued toasts. */
function take_flashes(): array
{
    $flashes = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flashes;
}

/** Remember submitted form values so a redirect can re-fill the form. */
function remember_input(array $except = ['password', 'password_confirm', 'current_password', 'new_password', '_token']): void
{
    $_SESSION['old_input'] = array_diff_key($_POST, array_flip($except));
}

/** Read a remembered form value. */
function old(string $key, $default = '')
{
    return $_SESSION['old_input'][$key] ?? $default;
}

/** Clear remembered values (call once the form has rendered). */
function forget_input(): void
{
    unset($_SESSION['old_input']);
}

// ---------------------------------------------------------------------------
// CSRF protection
// ---------------------------------------------------------------------------

function csrf_token(): string
{
    if (empty($_SESSION['_token'])) {
        $_SESSION['_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_token'];
}

/** Hidden input to drop into every POST form. */
function csrf_field(): string
{
    return '<input type="hidden" name="_token" value="' . e(csrf_token()) . '">';
}

/** Abort the request when the CSRF token is missing or wrong. */
function verify_csrf(): void
{
    $sent = $_POST['_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($sent) || !hash_equals(csrf_token(), $sent)) {
        if (wants_json()) {
            // 403, not 419: Apache rewrites status codes it does not know to 500.
            json_response(['ok' => false, 'code' => 'csrf', 'message' => 'Your session expired. Please reload the page.'], 403);
        }
        flash('error', 'Your session expired. Please try again.');
        redirect_back();
    }
}

/** Shortcut for action endpoints: must be POST with a valid token. */
function require_post(): void
{
    if (!is_post()) {
        http_response_code(405);
        header('Allow: POST');
        exit('Method not allowed');
    }
    verify_csrf();
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** ₱1,200 or ₱1,200.50 */
function money($amount): string
{
    $amount = (float) $amount;
    $decimals = fmod($amount, 1.0) === 0.0 ? 0 : 2;
    return CURRENCY_SYMBOL . number_format($amount, $decimals);
}

/** "3 min ago", "2 days ago", "Mar 4, 2026" */
function time_ago(?string $datetime): string
{
    if (!$datetime) {
        return '';
    }
    $time = strtotime($datetime);
    $diff = time() - $time;

    if ($diff < 60) return 'Just now';
    if ($diff < 3600) return floor($diff / 60) . ' min ago';
    if ($diff < 86400) return ($h = floor($diff / 3600)) . ' hr' . ($h > 1 ? 's' : '') . ' ago';
    if ($diff < 604800) return ($d = floor($diff / 86400)) . ' day' . ($d > 1 ? 's' : '') . ' ago';
    return date('M j, Y', $time);
}

/** "May 2026" */
function format_month_year(?string $datetime): string
{
    return $datetime ? date('F Y', strtotime($datetime)) : '';
}

/** "Mar 4, 2026 · 3:15 PM" */
function format_datetime(?string $datetime): string
{
    return $datetime ? date('M j, Y · g:i A', strtotime($datetime)) : '';
}

/** Two-letter initials from a name. */
function initials(?string $name): string
{
    $parts = preg_split('/\s+/', trim((string) $name)) ?: [];
    $letters = '';
    foreach (array_slice(array_filter($parts), 0, 2) as $part) {
        $letters .= mb_strtoupper(mb_substr($part, 0, 1));
    }
    return $letters !== '' ? $letters : 'CM';
}

/** Singular/plural label: plural(3, 'item') => "3 items" */
function plural(int $count, string $singular, ?string $pluralForm = null): string
{
    return number_format($count) . ' ' . ($count === 1 ? $singular : ($pluralForm ?? $singular . 's'));
}

/** Shorten text to $limit characters with an ellipsis. */
function str_limit(?string $text, int $limit = 100): string
{
    $text = trim((string) $text);
    return mb_strlen($text) > $limit ? rtrim(mb_substr($text, 0, $limit - 1)) . '…' : $text;
}

/** Image URL for a stored listing/avatar path (supports remote seed URLs). */
function image_url(?string $path, string $fallback = 'img/placeholder.svg'): string
{
    if (!$path) {
        return asset($fallback);
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return url($path);
}

/** HTML attribute helpers for forms. */
function selected($a, $b): string
{
    return (string) $a === (string) $b ? ' selected' : '';
}

function checked(bool $condition): string
{
    return $condition ? ' checked' : '';
}

/** Pagination numbers: [page, perPage, offset, totalPages]. */
function paginate(int $total, int $perPage, int $page): array
{
    $totalPages = max(1, (int) ceil($total / $perPage));
    $page = min(max(1, $page), $totalPages);
    return [$page, $perPage, ($page - 1) * $perPage, $totalPages];
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/** Turn PHP's $_FILES['x'] (single or multiple) into a list of file arrays. */
function normalize_files(?array $files): array
{
    if (!$files || !isset($files['name'])) {
        return [];
    }
    if (!is_array($files['name'])) {
        return $files['error'] === UPLOAD_ERR_NO_FILE ? [] : [$files];
    }
    $list = [];
    foreach ($files['name'] as $i => $name) {
        if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $list[] = [
            'name'     => $name,
            'type'     => $files['type'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'error'    => $files['error'][$i],
            'size'     => $files['size'][$i],
        ];
    }
    return $list;
}

/**
 * Validate and store an uploaded image.
 *
 * @param array  $file   One entry from normalize_files().
 * @param string $folder Sub-folder of /uploads ("listings" or "avatars").
 * @return array{path:?string, error:?string} path is relative to the app root, e.g. "uploads/listings/ab12.jpg"
 */
function store_uploaded_image(array $file, string $folder): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $tooBig = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
        return ['path' => null, 'error' => $tooBig ? 'Image is larger than 5 MB.' : 'Upload failed. Please try again.'];
    }
    if ($file['size'] > MAX_UPLOAD_BYTES) {
        return ['path' => null, 'error' => 'Image is larger than 5 MB.'];
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        return ['path' => null, 'error' => 'Invalid upload.'];
    }

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset($allowed[$mime]) || @getimagesize($file['tmp_name']) === false) {
        return ['path' => null, 'error' => 'Only JPG, PNG, WEBP or GIF images are allowed.'];
    }

    $dir = UPLOAD_DIR . DIRECTORY_SEPARATOR . $folder;
    if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
        return ['path' => null, 'error' => 'Upload folder is not writable.'];
    }

    $name = bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
    $target = $dir . DIRECTORY_SEPARATOR . $name;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        return ['path' => null, 'error' => 'Could not save the image.'];
    }

    resize_image($target, $mime, MAX_IMAGE_DIMENSION);

    return ['path' => 'uploads/' . $folder . '/' . $name, 'error' => null];
}

/** Shrink large images in place (keeps aspect ratio). Silently skips without GD. */
function resize_image(string $file, string $mime, int $max): void
{
    if (!function_exists('imagecreatetruecolor') || $mime === 'image/gif') {
        return;
    }
    [$width, $height] = @getimagesize($file) ?: [0, 0];
    if ($width <= $max && $height <= $max) {
        return;
    }

    $source = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($file),
        'image/png'  => @imagecreatefrompng($file),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file) : false,
        default      => false,
    };
    if (!$source) {
        return;
    }

    $scale = $max / max($width, $height);
    $newW = (int) round($width * $scale);
    $newH = (int) round($height * $scale);
    $canvas = imagecreatetruecolor($newW, $newH);
    imagealphablending($canvas, false);
    imagesavealpha($canvas, true);
    imagecopyresampled($canvas, $source, 0, 0, 0, 0, $newW, $newH, $width, $height);

    match ($mime) {
        'image/jpeg' => imagejpeg($canvas, $file, 84),
        'image/png'  => imagepng($canvas, $file, 6),
        'image/webp' => imagewebp($canvas, $file, 84),
    };
    imagedestroy($source);
    imagedestroy($canvas);
}

/** Delete a previously uploaded file (ignores remote seed URLs). */
function delete_upload(?string $path): void
{
    if (!$path || !str_starts_with($path, 'uploads/')) {
        return;
    }
    $file = realpath(dirname(__DIR__) . '/' . $path);
    $root = realpath(UPLOAD_DIR);
    if ($file && $root && str_starts_with($file, $root) && is_file($file)) {
        @unlink($file);
    }
}
