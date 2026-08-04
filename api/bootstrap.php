<?php
/**
 * Ortak yapılandırma, DB ve auth yardımcıları (PHP 7.4+)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('FORM_FIELD_COLUMNS', [
    'fullName', 'email', 'phone', 'department', 'team',
    'qReason', 'qCareer', 'qProgram', 'qClubs', 'qTime', 'qWeekend',
    'qMekanikTasarim', 'qMekanikCad', 'qMekanikUretim',
    'qYazilimDiller', 'qYazilimLinux', 'qYazilimRos', 'qYazilimGithub',
    'qElektronikGomulu', 'qElektronikPcb', 'qElektronikDonanim',
    'qOrgDeneyim', 'qOrgNeden',
]);

define('APPLICATION_COLUMNS', [
    'id', 'fullName', 'email', 'phone', 'department', 'team', 'status', 'notes',
    'qReason', 'qCareer', 'qProgram', 'qClubs', 'qTime', 'qWeekend',
    'qMekanikTasarim', 'qMekanikCad', 'qMekanikUretim',
    'qYazilimDiller', 'qYazilimLinux', 'qYazilimRos', 'qYazilimGithub',
    'qElektronikGomulu', 'qElektronikPcb', 'qElektronikDonanim',
    'qOrgDeneyim', 'qOrgNeden', 'data', 'createdAt',
]);

function loadEnv($path)
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");
        $_ENV[$key] = $value;
        putenv($key . '=' . $value);
    }
}

function env($key, $default = null)
{
    $value = isset($_ENV[$key]) ? $_ENV[$key] : getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return (string) $value;
}

loadEnv(dirname(__DIR__) . '/.env');

function jsonResponse($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function db()
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env('DB_HOST', 'localhost');
    $name = env('DB_NAME', 'rake_db');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASSWORD', '');

    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function requireAdmin()
{
    $user = env('ADMIN_USER', 'admin');
    $pass = env('ADMIN_PASSWORD', 'admin123');

    $login = '';
    $password = '';

    if (!empty($_SERVER['PHP_AUTH_USER'])) {
        $login = trim((string) $_SERVER['PHP_AUTH_USER']);
        $password = (string) (isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '');
    } else {
        $header = '';
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (stripos($header, 'Basic ') === 0) {
            $decoded = base64_decode(substr($header, 6), true);
            if ($decoded !== false && strpos($decoded, ':') !== false) {
                list($login, $password) = explode(':', $decoded, 2);
                $login = trim($login);
            }
        }
    }

    if ($login === $user && $password === $pass) {
        return;
    }

    header('WWW-Authenticate: Basic realm="401"');
    jsonResponse(['success' => false, 'error' => 'Yetkisiz erişim'], 401);
}

function readJsonBody()
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function splitApplicationPayload(array $source)
{
    $row = [];
    foreach (FORM_FIELD_COLUMNS as $key) {
        $value = isset($source[$key]) ? $source[$key] : '';
        $row[$key] = $value === null ? '' : (string) $value;
    }

    $reserved = array_flip(array_merge(FORM_FIELD_COLUMNS, ['id', 'status', 'notes', 'data', 'createdAt']));
    $extra = [];
    foreach ($source as $key => $value) {
        if (!isset($reserved[$key])) {
            $extra[$key] = $value;
        }
    }

    return [$row, $extra];
}

function mapApplicationRow(array $row)
{
    $dataObj = [];
    if (!empty($row['data'])) {
        $parsed = is_string($row['data']) ? json_decode($row['data'], true) : $row['data'];
        if (is_array($parsed)) {
            $dataObj = $parsed;
        }
    }
    unset($row['data']);
    return array_merge($row, $dataObj);
}
