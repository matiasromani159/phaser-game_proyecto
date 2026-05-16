<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["ok" => false, "error" => "No autenticado"]);
    exit;
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de DB"]);
    exit;
}

$uid = $_SESSION['user_id'];

// Estadísticas del jugador
$stmt = $conn->prepare("
    SELECT 
        COUNT(*) as total_partidas,
        MAX(tiempo) as tiempo_max,
        SUM(tiempo) as tiempo_total,
        MAX(player_level) as nivel_max,
        MAX(vida) as vida_max,
        COUNT(DISTINCT scene) as escenas_visitadas
    FROM partidas 
    WHERE user_id = ?
");
$stmt->bind_param("i", $uid);
$stmt->execute();
$stats = $stmt->get_result()->fetch_assoc();

// Monstruos totales eliminados (suma de arrays JSON)
$stmt = $conn->prepare("SELECT monsters_dead FROM partidas WHERE user_id = ?");
$stmt->bind_param("i", $uid);
$stmt->execute();
$result = $stmt->get_result();

$totalMonsters = 0;
while ($row = $result->fetch_assoc()) {
    $arr = json_decode($row['monsters_dead'] ?? '[]', true);
    if (is_array($arr)) $totalMonsters += count($arr);
}

echo json_encode([
    "ok" => true,
    "stats" => [
        "partidasJugadas"  => (int)$stats['total_partidas'],
        "tiempoTotal"      => (int)$stats['tiempo_total'],
        "tiempoMaximo"     => (int)$stats['tiempo_max'],
        "nivelMaximo"      => (int)$stats['nivel_max'],
        "vidaMaxima"       => (int)$stats['vida_max'],
        "escenasVisitadas" => (int)$stats['escenas_visitadas'],
        "monstruosMatados" => $totalMonsters
    ]
]);
?>