<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de DB"]);
    exit;
}

// Top por tiempo total jugado
$result = $conn->query("
    SELECT 
        u.username,
        MAX(p.player_level) as nivel_max,
        SUM(p.tiempo) as tiempo_total,
        COUNT(p.id) as partidas
    FROM users u
    LEFT JOIN partidas p ON u.id = p.user_id
    GROUP BY u.id, u.username
    ORDER BY tiempo_total DESC
    LIMIT 50
");

$ranking = [];
while ($row = $result->fetch_assoc()) {
    $ranking[] = [
        "username"     => $row['username'],
        "nivelMaximo"  => (int)$row['nivel_max'],
        "tiempoTotal"  => (int)$row['tiempo_total'],
        "partidas"     => (int)$row['partidas']
    ];
}

echo json_encode(["ok" => true, "ranking" => $ranking]);
?>