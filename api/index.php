<?php
/**
 * PHP API router — Node yerine shared hosting
 *
 * Rotalar:
 *   GET  /api/health
 *   POST /api/apply
 *   GET  /api/applications          (Basic Auth)
 *   PUT  /api/applications/{id}     (Basic Auth)
 */

require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rawurldecode($uri);

// /api/... veya /api/index.php/... yakala
$path = $uri;
if (preg_match('#/api(?:/index\.php)?(/.*)?$#', $uri, $m)) {
    $path = isset($m[1]) && $m[1] !== '' ? $m[1] : '/';
} else {
    $path = '/';
}

$path = rtrim($path, '/') ?: '/';

try {
    // GET /api/health
    if ($method === 'GET' && $path === '/health') {
        try {
            db()->query('SELECT 1');
            jsonResponse(['ok' => true, 'db' => true, 'engine' => 'php']);
        } catch (Throwable $e) {
            jsonResponse(['ok' => false, 'db' => false, 'error' => 'Veritabanı bağlantısı yok', 'engine' => 'php'], 503);
        }
    }

    // POST /api/apply
    if ($method === 'POST' && $path === '/apply') {
        $body = readJsonBody();
        list($row, $extra) = splitApplicationPayload($body);

        $id = (string) round(microtime(true) * 1000);
        $createdAt = gmdate('Y-m-d H:i:s');
        $record = array_merge($row, [
            'id' => $id,
            'status' => 'Bekliyor',
            'notes' => '',
            'data' => json_encode($extra, JSON_UNESCAPED_UNICODE),
            'createdAt' => $createdAt,
        ]);

        $cols = APPLICATION_COLUMNS;
        $placeholders = array_map(function ($c) {
            return ':' . $c;
        }, $cols);

        $sql = 'INSERT INTO applications (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = db()->prepare($sql);
        foreach ($cols as $col) {
            $stmt->bindValue(':' . $col, isset($record[$col]) ? $record[$col] : '');
        }
        $stmt->execute();

        $response = $record;
        unset($response['data']);
        $response = array_merge($response, $extra);

        jsonResponse([
            'success' => true,
            'message' => 'Başvuru alındı',
            'data' => $response,
        ], 201);
    }

    // GET /api/applications
    if ($method === 'GET' && $path === '/applications') {
        requireAdmin();
        $stmt = db()->query('SELECT * FROM applications ORDER BY createdAt DESC');
        $rows = $stmt->fetchAll();
        $apps = array_map('mapApplicationRow', $rows);
        jsonResponse($apps);
    }

    // PUT /api/applications/{id}
    if ($method === 'PUT' && preg_match('#^/applications/([^/]+)$#', $path, $m)) {
        requireAdmin();
        $id = $m[1];
        $body = readJsonBody();

        $updates = [];
        $params = [':id' => $id];

        if (array_key_exists('status', $body)) {
            $updates[] = 'status = :status';
            $params[':status'] = $body['status'];
        }
        if (array_key_exists('notes', $body)) {
            $updates[] = 'notes = :notes';
            $params[':notes'] = $body['notes'];
        }

        if ($updates) {
            $sql = 'UPDATE applications SET ' . implode(', ', $updates) . ' WHERE id = :id';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = db()->prepare('SELECT * FROM applications WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            jsonResponse(['success' => false, 'error' => 'Başvuru bulunamadı'], 404);
        }

        jsonResponse(['success' => true, 'data' => $row]);
    }

    jsonResponse(['success' => false, 'error' => 'Endpoint bulunamadı', 'path' => $path], 404);
} catch (Throwable $e) {
    error_log('RAKE API error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Sunucu hatası'], 500);
}
