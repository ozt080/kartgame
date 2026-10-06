<?php
require __DIR__ . '/../config.php';
header('Content-Type: application/json');
$rows = db()->query('SELECT name, time_ms FROM scores ORDER BY time_ms ASC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows);