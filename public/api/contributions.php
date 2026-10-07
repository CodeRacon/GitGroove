<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_THROW_ON_ERROR);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    respond(405, 'Method not allowed');
}

$username = trim((string) ($_GET['username'] ?? ''));
if (!preg_match('/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/iD', $username)) {
    respond(400, 'Invalid GitHub username');
}

$token = getenv('GITHUB_TOKEN');
if ($token === false || $token === '') {
    // A subdomain may live inside another site's public_html directory.
    // Look only above public_html so the secret cannot be served as a file.
    $directory = __DIR__;
    while (basename($directory) !== 'public_html' && dirname($directory) !== $directory) {
        $directory = dirname($directory);
    }
    $directory = basename($directory) === 'public_html'
        ? dirname($directory)
        : dirname(__DIR__, 2);

    for ($level = 0; $level < 3; $level++) {
        $secretFile = $directory . '/gitgroove-secret.php';
        if (is_file($secretFile) && is_readable($secretFile)) {
            $token = require $secretFile;
            break;
        }
        $parent = dirname($directory);
        if ($parent === $directory) break;
        $directory = $parent;
    }
}
if (!is_string($token) || $token === '' || preg_match('/[\r\n]/', $token)) {
    respond(503, 'GitHub token is not configured');
}
if (!function_exists('curl_init')) respond(503, 'PHP cURL is unavailable');

$cacheDirectory = sys_get_temp_dir() . '/gitgroove-calendar-cache';
$cachePath = $cacheDirectory . '/' . hash('sha256', strtolower($username)) . '.json';
if (is_file($cachePath) && filemtime($cachePath) > time() - 300) {
    $cached = file_get_contents($cachePath);
    if ($cached !== false) {
        echo $cached;
        exit;
    }
}

$query = 'query($username: String!) { user(login: $username) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } } }';
$request = json_encode(['query' => $query, 'variables' => ['username' => $username]], JSON_THROW_ON_ERROR);
$handle = curl_init('https://api.github.com/graphql');
if ($handle === false) respond(503, 'GitHub connection unavailable');
curl_setopt_array($handle, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $request,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/vnd.github+json',
        'User-Agent: GitGroove',
    ],
]);
$body = curl_exec($handle);
$status = curl_getinfo($handle, CURLINFO_HTTP_CODE);
curl_close($handle);
if ($body === false) respond(502, 'GitHub connection unavailable');
if ($status === 401 || $status === 403) respond(403, 'GitHub authorization unavailable');
if ($status === 429) respond(429, 'GitHub rate limit');
if ($status !== 200) respond(502, 'GitHub request failed');

try {
    $result = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(502, 'Invalid GitHub response');
}
if (!is_array($result)) respond(502, 'Invalid GitHub response');
if (!empty($result['errors'])) {
    foreach ($result['errors'] as $error) {
        if (!is_array($error)) continue;
        if (($error['type'] ?? null) === 'NOT_FOUND') respond(404, 'GitHub user not found');
        if (($error['type'] ?? null) === 'RATE_LIMITED') respond(429, 'GitHub rate limit');
    }
    respond(502, 'GitHub GraphQL error');
}
if (!is_array($result['data'] ?? null) || !array_key_exists('user', $result['data'])) {
    respond(502, 'Invalid GitHub response');
}
if ($result['data']['user'] === null) respond(404, 'GitHub user not found');
$calendar = $result['data']['user']['contributionsCollection']['contributionCalendar'] ?? null;
if (!is_array($calendar) || !isset($calendar['weeks'], $calendar['totalContributions'])) {
    respond(502, 'Invalid GitHub calendar');
}
$json = json_encode($calendar, JSON_THROW_ON_ERROR);
if (!is_dir($cacheDirectory)) @mkdir($cacheDirectory, 0700, true);
if (is_dir($cacheDirectory)) @file_put_contents($cachePath, $json, LOCK_EX);
echo $json;
