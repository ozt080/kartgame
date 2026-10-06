<?php
require __DIR__ . '/../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$name = trim(strip_tags($data['name'] ?? ''));
$time = (float)($data['time'] ?? 0);

if ($name === '' || mb_strlen($name) > 20 || $time < 10 || $time > 600) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid']);
    exit;
}

$stmt = db()->prepare('INSERT INTO scores (name, time_ms) VALUES (?, ?)');
$stmt->execute([$name, (int)round($time * 1000)]);
echo json_encode(['ok' => true]);