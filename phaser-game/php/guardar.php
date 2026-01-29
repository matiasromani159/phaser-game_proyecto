<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$data = json_decode(file_get_contents("php://input"), true);

$tiempo = $data["tiempo"];
$vida   = $data["vida"];
$x      = $data["x"];
$y      = $data["y"];

$conn = new mysqli("localhost", "root", "", "juego");

if ($conn->connect_error) {
    echo json_encode(["error" => "DB error"]);
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO partidas (tiempo, vida, x, y) VALUES (?, ?, ?, ?)"
);
$stmt->bind_param("iiii", $tiempo, $vida, $x, $y);
$stmt->execute();

echo json_encode(["ok" => true]);
