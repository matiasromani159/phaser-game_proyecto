<?php
// permitir CORS completo para desarrollo
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// responder a preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// recibir JSON
$data = json_decode(file_get_contents("php://input"), true);

// validar datos
$tiempo = $data["tiempo"] ?? 0;
$vida   = $data["vida"] ?? 0;
$x      = $data["x"] ?? 0;
$y      = $data["y"] ?? 0;

// conectar a DB
$conn = new mysqli("localhost", "root", "1234", "juego");

if ($conn->connect_error) {
    echo json_encode(["error" => "DB error"]);
    exit;
}

// insertar partida
$stmt = $conn->prepare(
    "INSERT INTO partidas (tiempo, vida, x, y) VALUES (?, ?, ?, ?)"
);
$stmt->bind_param("iiii", $tiempo, $vida, $x, $y);
$stmt->execute();

echo json_encode(["ok" => true]);
