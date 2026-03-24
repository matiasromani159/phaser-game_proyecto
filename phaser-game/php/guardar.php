<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["ok" => false, "error" => "No autenticado"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de DB"]);
    exit;
}

$uid          = $_SESSION['user_id'];
$scene        = htmlspecialchars($data['roomActual']       ?? 'Room1');
$pos_x        = intval($data['playerSpawn']['x']           ?? 200);
$pos_y        = intval($data['playerSpawn']['y']           ?? 200);
$vida         = intval($data['playerHP']                   ?? 100);
$tiempo       = intval($data['segundos']                   ?? 0);
$monsters     = json_encode($data['monstersDead']          ?? []);
$player_name  = htmlspecialchars($data['playerName']       ?? 'KRIS');
$player_level = intval($data['playerLevel']                ?? 1);

$stmt = $conn->prepare("
    INSERT INTO partidas (user_id, scene, pos_x, pos_y, vida, tiempo, monsters_dead, player_name, player_level, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
        scene         = VALUES(scene),
        pos_x         = VALUES(pos_x),
        pos_y         = VALUES(pos_y),
        vida          = VALUES(vida),
        tiempo        = VALUES(tiempo),
        monsters_dead = VALUES(monsters_dead),
        player_name   = VALUES(player_name),
        player_level  = VALUES(player_level),
        updated_at    = NOW()
");
$stmt->bind_param("isiiiiisi", $uid, $scene, $pos_x, $pos_y, $vida, $tiempo, $monsters, $player_name, $player_level);

if ($stmt->execute()) {
    echo json_encode(["ok" => true, "timestamp" => date('c')]);
} else {
    echo json_encode(["ok" => false, "error" => $stmt->error]);
}
?>