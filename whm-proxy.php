<?php
/**
 * WHM API Proxy
 * Upload this to your PHP server
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get parameters
$input = json_decode(file_get_contents('php://input'), true) ?: $_GET;

$host = $input['host'] ?? '';
$token = $input['token'] ?? '';
$endpoint = $input['endpoint'] ?? 'servicestatus';

if (!$host || !$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing host or token']);
    exit;
}

// Allowed endpoints (security)
$allowed = ['servicestatus', 'loadavg', 'system_stats', 'server_status', 'diskusage', 'disk_usage', 'df'];
if (!in_array($endpoint, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid endpoint']);
    exit;
}

// Call WHM API
$whmUrl = "https://{$host}:2087/json-api/{$endpoint}?api.version=1";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $whmUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        "Authorization: whm root:{$token}",
        "Accept: application/json"
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
