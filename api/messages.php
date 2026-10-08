<?php
/**
 * Direct messages between students (the `messages` table).
 *
 * GET                        conversations of the logged-in student
 * GET  ?with=<id or email>   one conversation; marks their messages as read
 * GET  ?summary=1            just the unread count (for the sidebar badge)
 * POST {to, body, listing?}  send a message (to = account id or email);
 *                            listing = the item it is about (shown as a card)
 * POST {action: "delete", with}
 *                            delete a chat for the logged-in student only;
 *                            the other person keeps their copy
 */
require dirname(__DIR__) . '/includes/api.php';

$me = require_login();
$meId = (int) $me['id'];

// Databases made before "Delete chat" existed get its two columns once.
if (empty($_SESSION['messages_schema_ok'])) {
    if (!db_one("SHOW COLUMNS FROM messages LIKE 'deleted_by_sender'")) {
        db_exec('ALTER TABLE messages
                   ADD COLUMN deleted_by_sender TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read,
                   ADD COLUMN deleted_by_recipient TINYINT(1) NOT NULL DEFAULT 0 AFTER deleted_by_sender');
    }
    $_SESSION['messages_schema_ok'] = true;
}

/** Find a student by account id or email. */
function find_contact(string $key): ?array
{
    $key = trim($key);
    if ($key === '') {
        return null;
    }
    return ctype_digit($key)
        ? db_one('SELECT * FROM users WHERE id = ?', [(int) $key])
        : db_one('SELECT * FROM users WHERE email = ?', [mb_strtolower($key)]);
}

function contact_payload(array $user): array
{
    return [
        'id'       => (int) $user['id'],
        'name'     => $user['full_name'],
        'initials' => initials($user['full_name']),
        'campus'   => $user['campus'],
    ];
}

function message_payload(array $message, int $meId): array
{
    return [
        'id'      => (int) $message['id'],
        'mine'    => (int) $message['sender_id'] === $meId,
        'body'    => $message['body'],
        'sent'    => date('c', strtotime($message['created_at'])),
        'ago'     => time_ago($message['created_at']),
        // The item the message is about, with its current status.
        'listing' => $message['listing_id'] && $message['l_title'] !== null ? [
            'id'       => (int) $message['listing_id'],
            'name'     => $message['l_title'],
            'price'    => (float) $message['l_price'],
            'status'   => $message['l_status'],
            'category' => $message['l_category'],
            'image'    => $message['l_image'] ? image_url($message['l_image']) : '',
            'sellerId' => (int) $message['l_seller'],
        ] : null,
    ];
}


/** Messages (with the item each one is about) matching $where. */
function fetch_messages(string $where, array $params): array
{
    return db_all(
        "SELECT m.*, l.title AS l_title, l.price AS l_price, l.status AS l_status, l.user_id AS l_seller,
                c.name AS l_category,
                (SELECT i.path FROM listing_images i WHERE i.listing_id = l.id ORDER BY i.sort_order, i.id LIMIT 1) AS l_image
           FROM messages m
           LEFT JOIN listings l ON l.id = m.listing_id
           LEFT JOIN categories c ON c.id = l.category_id
          WHERE {$where}",
        $params
    );
}

function unread_total(int $meId): int
{
    return (int) db_value('SELECT COUNT(*) FROM messages WHERE recipient_id = ? AND is_read = 0 AND deleted_by_recipient = 0', [$meId], 0);
}

/** The contact named in the request, or stop with a clear message. */
function require_contact(string $key, int $meId): array
{
    $contact = find_contact($key);
    if (!$contact) {
        api_fail("That seller's account could not be found.", 'to', 404);
    }
    if ((int) $contact['id'] === $meId) {
        api_fail("You can't send a message to yourself.", 'to');
    }
    return $contact;
}


// ---- Delete a chat (only for me) ------------------------------------------------
if (is_post() && api_string('action') === 'delete') {
    verify_csrf();

    $contact = require_contact(api_string('with'), $meId);
    $otherId = (int) $contact['id'];

    db_exec('UPDATE messages SET deleted_by_sender = 1 WHERE sender_id = ? AND recipient_id = ?', [$meId, $otherId]);
    db_exec('UPDATE messages SET deleted_by_recipient = 1, is_read = 1 WHERE sender_id = ? AND recipient_id = ?', [$otherId, $meId]);
    db_exec("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'message' AND link = ?", [$meId, 'messages.php?with=' . $otherId]);

    // Once both people have deleted a message, nobody can see it any more.
    db_exec(
        'DELETE FROM messages WHERE deleted_by_sender = 1 AND deleted_by_recipient = 1
            AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))',
        [$meId, $otherId, $otherId, $meId]
    );

    json_response(['ok' => true, 'message' => 'Chat deleted.', 'unread' => unread_total($meId)]);
}


// ---- Send ---------------------------------------------------------------------
if (is_post()) {
    verify_csrf();

    $contact = require_contact(api_string('to'), $meId);
    $body = trim(preg_replace("/\r\n?/", "\n", api_raw('body')));

    if ($body === '') {
        api_fail('Type a message first.', 'body');
    }
    if (mb_strlen($body) > 1000) {
        api_fail('Messages can be up to 1,000 characters.', 'body');
    }

    // Only an item that belongs to one of the two people can be attached.
    $listingId = (int) (api_input()['listing'] ?? 0);
    if ($listingId > 0) {
        $owner = (int) db_value('SELECT user_id FROM listings WHERE id = ?', [$listingId], 0);
        if (!in_array($owner, [$meId, (int) $contact['id']], true)) {
            $listingId = 0;
        }
    }

    $id = db_insert(
        'INSERT INTO messages (sender_id, recipient_id, listing_id, body) VALUES (?, ?, ?, ?)',
        [$meId, $contact['id'], $listingId ?: null, $body]
    );
    notify((int) $contact['id'], 'message', 'New message from ' . $me['full_name'], str_limit($body, 120), 'messages.php?with=' . $meId);

    json_response([
        'ok'      => true,
        'contact' => contact_payload($contact),
        'message' => message_payload(fetch_messages('m.id = ?', [$id])[0], $meId),
    ], 201);
}


// ---- Unread count -----------------------------------------------------------
if (isset($_GET['summary'])) {
    json_response(['ok' => true, 'unread' => unread_total($meId)]);
}


// ---- One conversation ---------------------------------------------------------
if (isset($_GET['with'])) {
    $contact = require_contact((string) $_GET['with'], $meId);
    $otherId = (int) $contact['id'];

    db_exec('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ? AND is_read = 0', [$otherId, $meId]);

    $rows = fetch_messages(
        '((m.sender_id = ? AND m.recipient_id = ? AND m.deleted_by_sender = 0)
           OR (m.sender_id = ? AND m.recipient_id = ? AND m.deleted_by_recipient = 0))
          ORDER BY m.id DESC LIMIT 300',
        [$meId, $otherId, $otherId, $meId]
    );

    json_response([
        'ok'       => true,
        'contact'  => contact_payload($contact),
        'messages' => array_map(fn($m) => message_payload($m, $meId), array_reverse($rows)),
        'unread'   => unread_total($meId),
    ]);
}


// ---- All conversations --------------------------------------------------------
$rows = db_all(
    'SELECT u.*, m.body AS last_body, m.sender_id AS last_sender, m.created_at AS last_at,
            (SELECT COUNT(*) FROM messages x
              WHERE x.sender_id = u.id AND x.recipient_id = ? AND x.is_read = 0 AND x.deleted_by_recipient = 0) AS unread
       FROM (SELECT IF(sender_id = ?, recipient_id, sender_id) AS other_id, MAX(id) AS last_id
               FROM messages
              WHERE (sender_id = ? AND deleted_by_sender = 0) OR (recipient_id = ? AND deleted_by_recipient = 0)
              GROUP BY other_id) c
       JOIN messages m ON m.id = c.last_id
       JOIN users u ON u.id = c.other_id
      ORDER BY m.id DESC',
    [$meId, $meId, $meId, $meId]
);

json_response([
    'ok'            => true,
    'conversations' => array_map(fn($row) => [
        'contact' => contact_payload($row),
        'last'    => ((int) $row['last_sender'] === $meId ? 'You: ' : '') . str_limit($row['last_body'], 80),
        'ago'     => time_ago($row['last_at']),
        'unread'  => (int) $row['unread'],
    ], $rows),
    'unread'        => unread_total($meId),
]);
