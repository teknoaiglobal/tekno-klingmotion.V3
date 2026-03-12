<?php
/**
 * TEXA Motion Control - PHP CORS Proxy for cPanel
 * Replaces Node.js proxy.js for shared hosting compatibility.
 * 
 * Routes:
 *   /proxy.php?route=api&path=/v1/ai/video/...  → https://api.freepik.com/...
 *   /proxy.php?route=upload                      → https://upload.iismedika.online/
 */

// Allow all CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, x-freepik-api-key');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$route = isset($_GET['route']) ? $_GET['route'] : '';

// ─── Route 1: Upload Proxy ────────────────────────────────────
if ($route === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetUrl = 'https://upload.iismedika.online/';

    // For multipart/form-data, PHP does not populate php://input.
    // We must reconstruct the payload using $_POST and $_FILES and let cURL handle the boundary.
    $postFields = $_POST;

    if (!empty($_FILES)) {
        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                // Compatible with PHP 5.5+
                $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            }
        }
    }

    $ch = curl_init($targetUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_FOLLOWLOCATION => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Upload proxy error: ' . $error]);
        exit;
    }

    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
    exit;
}

// ─── Route 2: Freepik API Proxy ───────────────────────────────
if ($route === 'api') {
    $path = isset($_GET['path']) ? $_GET['path'] : '';
    if (empty($path)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Missing "path" parameter']);
        exit;
    }

    $targetUrl = 'https://api.freepik.com' . $path;
    $method = $_SERVER['REQUEST_METHOD'];

    // Build headers
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];

    // Forward API key
    $apiKey = '';
    if (isset($_SERVER['HTTP_X_FREEPIK_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_FREEPIK_API_KEY'];
    }
    if ($apiKey) {
        $headers[] = 'x-freepik-api-key: ' . $apiKey;
    }

    // Read body for POST/PUT
    $body = null;
    if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
        $body = file_get_contents('php://input');
        if ($body) {
            $headers[] = 'Content-Length: ' . strlen($body);
        }
    }

    $ch = curl_init($targetUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_FOLLOWLOCATION => true,
    ]);

    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'API proxy error: ' . $error]);
        exit;
    }

    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
    exit;
}

// ─── Fallback ─────────────────────────────────────────────────
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Use ?route=api&path=/... or ?route=upload']);
