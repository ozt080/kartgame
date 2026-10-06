<?php
// Réglages locaux (Laragon)
$host = 'localhost'; $db = 'kartgame'; $user = 'root'; $pass = '';

// En ligne : config.prod.php (créé uniquement sur InfinityFree) remplace ces valeurs
if (file_exists(__DIR__ . '/config.prod.php')) require __DIR__ . '/config.prod.php';

function db(): PDO {
    global $host, $db, $user, $pass;
    return new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}