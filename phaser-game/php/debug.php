<?php
session_start();
header("Content-Type: application/json");
echo json_encode([
    "session_id" => session_id(),
    "user_id" => $_SESSION['user_id'] ?? null,
    "username" => $_SESSION['username'] ?? null,
    "role" => $_SESSION['role'] ?? null,
    "logged" => isset($_SESSION['user_id']),
    "cookie_phpssid" => $_COOKIE['PHPSESSID'] ?? 'NO COOKIE'
]);
?>