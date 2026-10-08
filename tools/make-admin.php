<?php
/**
 * Give an existing account administrator access, or take it away.
 * Run it from the project folder (it refuses to run from a browser):
 *
 *   C:\xampp\php\php.exe tools\make-admin.php you@campus.edu
 *   C:\xampp\php\php.exe tools\make-admin.php 2024-10001 --student
 *
 * Use the email or student ID the account logs in with. To get a brand-new
 * admin, sign up on the site first, then run this. Administrators can make
 * more administrators from the Users page of the admin dashboard.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/includes/bootstrap.php';

$identifier = $argv[1] ?? '';
$role = in_array('--student', $argv, true) ? 'student' : 'admin';

if ($identifier === '' || str_starts_with($identifier, '--')) {
    fwrite(STDERR, "Usage: php tools/make-admin.php <email or student ID> [--student]\n");
    exit(1);
}

$user = db_one('SELECT id, full_name, role FROM users WHERE email = ? OR student_id = ? LIMIT 1', [mb_strtolower($identifier), $identifier]);
if (!$user) {
    fwrite(STDERR, "No account found for \"{$identifier}\". Sign up on the site first.\n");
    exit(1);
}

if ($role === 'student' && (int) db_value("SELECT COUNT(*) FROM users WHERE role = 'admin' AND id <> ?", [$user['id']]) === 0) {
    fwrite(STDERR, "{$user['full_name']} is the only administrator. Make someone else an admin first.\n");
    exit(1);
}

db_exec('UPDATE users SET role = ?, status = \'active\' WHERE id = ?', [$role, $user['id']]);

echo $role === 'admin'
    ? "{$user['full_name']} is now an administrator. Log in to open admin/admin.html.\n"
    : "{$user['full_name']} is a student account again.\n";
