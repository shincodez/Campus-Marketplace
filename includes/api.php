<?php
/**
 * Shared setup for the JSON endpoints in /api.
 *
 * The HTML pages (index.html, login/login.html, …) call these endpoints with
 * fetch() through auth.js. Accounts live in the `users` table and the login
 * itself is a normal PHP session, so it works like any real website.
 *
 *   require dirname(__DIR__) . '/includes/api.php';
 */

require_once __DIR__ . '/bootstrap.php';

header('Cache-Control: no-store');

// Answer unexpected errors in JSON too, so the page can show a toast.
set_exception_handler(function (Throwable $e): void {
    json_response([
        'ok'      => false,
        'message' => APP_DEBUG ? $e->getMessage() : 'Something went wrong. Please try again.',
    ], 500);
});

/** Decoded JSON body of the request (falls back to normal form fields). */
function api_input(): array
{
    static $data = null;

    if ($data === null) {
        $decoded = json_decode((string) file_get_contents('php://input'), true);
        $data = is_array($decoded) ? $decoded : $_POST;
    }

    return $data;
}

/** Trimmed string field from the request body. */
function api_string(string $key): string
{
    $value = api_input()[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

/** Raw (untrimmed) string field — for passwords. */
function api_raw(string $key): string
{
    $value = api_input()[$key] ?? '';
    return is_string($value) ? $value : '';
}

/** Endpoints that change data must be POST and carry the CSRF token (X-CSRF-Token header). */
function api_require_post(): void
{
    if (!is_post()) {
        header('Allow: POST');
        json_response(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    verify_csrf();
}

/** Stop with a message. $field names the input the page should highlight. */
function api_fail(string $message, ?string $field = null, int $status = 422, array $extra = []): void
{
    json_response(['ok' => false, 'message' => $message, 'field' => $field] + $extra, $status);
}

/** The account fields the pages are allowed to see (never the password hash). */
function api_user(array $user): array
{
    $name = (string) $user['full_name'];

    return [
        'id'        => (int) $user['id'],
        'name'      => $name,
        'firstName' => explode(' ', $name)[0],
        'initials'  => initials($name),
        'email'     => $user['email'],
        'studentId' => $user['student_id'],
        'campus'    => $user['campus'],
        'joined'    => format_month_year($user['created_at']),
        'verified'  => (bool) $user['is_verified'],
        'role'      => $user['role'] ?? 'student',
    ];
}

/** Send the login state (plus a fresh CSRF token) and stop. */
function api_session(?array $user, string $message = '', int $status = 200): void
{
    json_response([
        'ok'       => true,
        'loggedIn' => $user !== null,
        'user'     => $user ? api_user($user) : null,
        'csrf'     => csrf_token(),
        'message'  => $message,
    ], $status);
}

/** Validation shared by sign up and profile edits. Returns [message, field] or null. */
function validate_account_fields(string $name, string $email, ?int $exceptUserId = null): ?array
{
    $nameLength = mb_strlen($name);
    if ($nameLength < 2 || $nameLength > 80) {
        return ['Enter your full name (2 to 80 characters).', 'name'];
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['Enter a valid school email address.', 'email'];
    }
    if (mb_strlen($email) > 120) {
        return ['Email must be 120 characters or fewer.', 'email'];
    }
    if (db_value('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $exceptUserId ?? 0])) {
        return $exceptUserId
            ? ['Another account already uses that email.', 'email']
            : ['An account with that email already exists. Log in instead.', 'email'];
    }

    return null;
}
