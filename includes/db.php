<?php
/**
 * PDO connection + small query helpers.
 *
 * Always use these helpers with placeholders — never interpolate user input
 * into SQL strings.
 */

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            $pdo->exec("SET time_zone = '" . date('P') . "'");
        } catch (PDOException $e) {
            render_database_error($e);
        }
    }

    return $pdo;
}

/** Run a statement and return it. */
function db_query(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/** First row or null. */
function db_one(string $sql, array $params = []): ?array
{
    $row = db_query($sql, $params)->fetch();
    return $row === false ? null : $row;
}

/** All rows. */
function db_all(string $sql, array $params = []): array
{
    return db_query($sql, $params)->fetchAll();
}

/** First column of the first row (or $default). */
function db_value(string $sql, array $params = [], $default = null)
{
    $value = db_query($sql, $params)->fetchColumn();
    return $value === false ? $default : $value;
}

/** INSERT and return the new id. */
function db_insert(string $sql, array $params = []): int
{
    db_query($sql, $params);
    return (int) db()->lastInsertId();
}

/** UPDATE/DELETE and return affected rows. */
function db_exec(string $sql, array $params = []): int
{
    return db_query($sql, $params)->rowCount();
}

/** Friendly page shown when MySQL is not running or the DB is not installed. */
function render_database_error(PDOException $e): void
{
    $code = (int) ($e->errorInfo[1] ?? $e->getCode());
    $notInstalled = $code === 1049; // Unknown database
    http_response_code(503);

    $title = $notInstalled ? 'Database not installed yet' : 'Cannot connect to the database';
    $hint = $notInstalled
        ? 'The <strong>' . htmlspecialchars(DB_NAME) . '</strong> database does not exist. Import <strong>database/campus_marketplace.sql</strong> (for example with phpMyAdmin), then reload this page.'
        : 'Make sure <strong>MySQL</strong> is running and the database settings in <strong>includes/config.php</strong> are correct, then reload this page.';
    $detail = APP_DEBUG ? '<pre>' . htmlspecialchars($e->getMessage()) . '</pre>' : '';

    // The static pages talk to /api with fetch(), so answer them in JSON.
    if (wants_json()) {
        json_response(['ok' => false, 'code' => 'database', 'message' => $title . '. ' . strip_tags($hint)], 503);
    }

    echo <<<HTML
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$title}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f7fb;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#101828;padding:24px}
.box{max-width:520px;background:#fff;border:1px solid #e4e7ec;border-radius:16px;padding:32px;box-shadow:0 8px 24px -4px rgba(16,24,40,.08)}
h1{font-size:22px;margin:0 0 8px}p{color:#475467;line-height:1.6;margin:0 0 20px}
pre{white-space:pre-wrap;background:#f9fafb;border:1px solid #e4e7ec;border-radius:10px;padding:12px;font-size:12px;color:#b42318;margin:0 0 20px}
</style></head><body><div class="box"><h1>{$title}</h1><p>{$hint}</p>{$detail}</div></body></html>
HTML;
    exit;
}
