<?php
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'kartgame';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

if (file_exists(__DIR__ . '/config.prod.php')) require __DIR__ . '/config.prod.php';

function db(): PDO {
    global $host, $db, $user, $pass;
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('CREATE TABLE IF NOT EXISTS scores (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20) NOT NULL,
      time_ms INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    return $pdo;
}