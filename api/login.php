<?php
/**
 * POST {identifier, password}
 * Log in with a registered email or student ID. Unknown accounts are refused.
 */
require dirname(__DIR__) . '/includes/api.php';
api_require_post();

$identifier = api_string('identifier');
$password = api_raw('password');

// Slow down password guessing: 5 failures locks the login for 60 seconds.
$lockedUntil = (int) ($_SESSION['login_locked_until'] ?? 0);
if ($lockedUntil > time()) {
    api_fail('Too many failed attempts. Please wait ' . ($lockedUntil - time()) . ' seconds and try again.', null, 429);
}

if ($identifier === '' || $password === '') {
    api_fail('Enter your email or student ID and your password.', $identifier === '' ? 'identifier' : 'password');
}

$user = db_one('SELECT * FROM users WHERE email = ? OR student_id = ? LIMIT 1', [$identifier, $identifier]);

if ($user && password_verify($password, $user['password_hash'])) {
    unset($_SESSION['login_failures'], $_SESSION['login_locked_until']);
    if (is_suspended($user)) {
        api_fail('This account has been suspended. Please contact the marketplace administrator.', 'identifier', 403, ['code' => 'suspended']);
    }
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        db_exec('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
    login_user($user);
    api_session($user, 'Welcome back, ' . explode(' ', $user['full_name'])[0] . '!');
}

$_SESSION['login_failures'] = (int) ($_SESSION['login_failures'] ?? 0) + 1;
if ($_SESSION['login_failures'] >= 5) {
    $_SESSION['login_locked_until'] = time() + 60;
    $_SESSION['login_failures'] = 0;
}

if (!$user) {
    api_fail('No account found with that email or student ID. Please sign up first.', 'identifier', 401, ['code' => 'no_account']);
}
api_fail('Incorrect password. Please try again.', 'password', 401);
