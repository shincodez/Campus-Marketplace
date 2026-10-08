<?php
/**
 * Session-based authentication.
 */

/** The logged-in user row, or null for guests. */
function current_user(): ?array
{
    static $user = false;

    if ($user === false) {
        $user = null;
        if (!empty($_SESSION['user_id'])) {
            $user = db_one('SELECT * FROM users WHERE id = ?', [(int) $_SESSION['user_id']]);
            if ($user === null) {
                unset($_SESSION['user_id']); // account was deleted
            }
        }
    }

    return $user;
}

function is_logged_in(): bool
{
    return current_user() !== null;
}

/** Id of the logged-in user (0 for guests). */
function user_id(): int
{
    return (int) (current_user()['id'] ?? 0);
}

/** Stop guests: a JSON 401 for the site's API calls, the login page otherwise. */
function require_login(): array
{
    $user = current_user();
    if ($user) {
        return $user;
    }

    if (wants_json()) {
        json_response(['ok' => false, 'message' => 'Please log in first.', 'login' => url('login/login.html')], 401);
    }

    redirect('login/login.html');
}

/** Start an authenticated session. */
function login_user(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    unset($_SESSION['_token']); // fresh CSRF token for the new session
}

function logout_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
