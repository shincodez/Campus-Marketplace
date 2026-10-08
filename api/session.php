<?php
/**
 * GET — who is logged in right now, plus the CSRF token for the next request.
 */
require dirname(__DIR__) . '/includes/api.php';

api_session(current_user());
