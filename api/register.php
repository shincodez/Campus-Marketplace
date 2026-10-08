<?php
/**
 * POST {name, email, studentId, password, confirmPassword, acceptTerms}
 * Create a student account, then log in as that account.
 */
require dirname(__DIR__) . '/includes/api.php';
api_require_post();

if (is_logged_in()) {
    api_fail('You are already logged in. Log out first to create another account.', null, 409);
}

$name = preg_replace('/\s+/u', ' ', api_string('name'));
$email = mb_strtolower(api_string('email'));
$studentId = api_string('studentId');
$password = api_raw('password');
$confirmPassword = api_raw('confirmPassword');

// --- Validation ------------------------------------------------------------
if ($error = validate_account_fields($name, $email)) {
    api_fail(...$error);
}

if ($studentId === '') {
    api_fail('Enter your student ID.', 'studentId');
}
if (!preg_match('/^[A-Za-z0-9-]{4,30}$/', $studentId)) {
    api_fail('Student ID must be 4 to 30 characters using letters, numbers and dashes only.', 'studentId');
}
if (db_value('SELECT id FROM users WHERE student_id = ?', [$studentId])) {
    api_fail('That student ID is already registered. Log in instead.', 'studentId');
}

if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
    api_fail('Password must be at least 8 characters and include a letter and a number.', 'password');
}
if (strlen($password) > 72) {
    api_fail('Password must be 72 characters or fewer.', 'password');
}
if (!hash_equals($password, $confirmPassword)) {
    api_fail('Passwords do not match.', 'confirmPassword');
}
if (!in_array(api_input()['acceptTerms'] ?? false, [true, 1, '1', 'true', 'on'], true)) {
    api_fail('Please agree to the Terms and Conditions to create an account.', 'acceptTerms');
}

// --- Create the account ------------------------------------------------------
try {
    $userId = db_insert(
        'INSERT INTO users (full_name, email, student_id, password_hash, is_verified) VALUES (?, ?, ?, ?, 1)',
        [$name, $email, $studentId, password_hash($password, PASSWORD_DEFAULT)]
    );
} catch (PDOException $e) {
    if ($e->getCode() !== '23000') {
        throw $e;
    }
    // Someone registered the same email / student ID a moment ago.
    api_fail('That email or student ID is already registered. Log in instead.', 'email', 409);
}

$user = db_one('SELECT * FROM users WHERE id = ?', [$userId]);
login_user($user);

api_session($user, 'Account created. Welcome, ' . explode(' ', $name)[0] . '!', 201);
