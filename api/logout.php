<?php
/**
 * POST — end the session.
 */
require dirname(__DIR__) . '/includes/api.php';
api_require_post();

logout_user();

json_response(['ok' => true, 'loggedIn' => false, 'user' => null, 'message' => 'You have been signed out.']);
