<?php
/**
 * POST {name, email, campus}
 * Update the logged-in student's details.
 */
require dirname(__DIR__) . '/includes/api.php';
api_require_post();
$user = require_login();

$name = preg_replace('/\s+/u', ' ', api_string('name'));
$email = mb_strtolower(api_string('email'));
$campus = preg_replace('/\s+/u', ' ', api_string('campus'));

if ($error = validate_account_fields($name, $email, (int) $user['id'])) {
    api_fail(...$error);
}

if ($campus === '') {
    $campus = 'Main Campus';
} elseif (mb_strlen($campus) > 80) {
    api_fail('Campus must be 80 characters or fewer.', 'campus');
}

try {
    db_exec('UPDATE users SET full_name = ?, email = ?, campus = ? WHERE id = ?', [$name, $email, $campus, $user['id']]);
} catch (PDOException $e) {
    if ($e->getCode() !== '23000') {
        throw $e;
    }
    api_fail('Another account already uses that email.', 'email', 409);
}

api_session(db_one('SELECT * FROM users WHERE id = ?', [$user['id']]), 'Profile updated.');
