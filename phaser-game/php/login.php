<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["logged" => false, "error" => "Error de DB"]);
    exit;
}

// ── 1. Verificar sesión activa ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        // Carga el save más reciente del usuario desde DB
        $uid  = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT * FROM partidas WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $save = $stmt->get_result()->fetch_assoc();

        echo json_encode([
            "logged"      => true,
            "userId"      => $uid,
            "username"    => $_SESSION['username'],
            "hasSave"     => $save !== null,
            "scene"       => $save['scene']   ?? 'Room1',
            "x"           => $save['pos_x']   ?? 200,
            "y"           => $save['pos_y']   ?? 200,
            "tiempo"      => $save['tiempo']  ?? 0,
            "playerHP"    => $save['vida']    ?? 100,
            "monstersDead"=> $save['monsters_dead'] ?? '[]',
        ]);
    } else {
        echo json_encode(["logged" => false]);
    }
    exit;
}

// ── 2. Login con credenciales (POST) ─────────────────────────
$data     = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(["logged" => false, "error" => "Faltan credenciales"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$u = $stmt->get_result()->fetch_assoc();

// Verifica con password_hash
if ($u && password_verify($password, $u['password'])) {
    $_SESSION['user_id']  = $u['id'];
    $_SESSION['username'] = $u['username'];

    // Carga save del usuario
    $uid  = $u['id'];
    $stmt = $conn->prepare("SELECT * FROM partidas WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $save = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        "logged"       => true,
        "userId"       => $uid,
        "username"     => $u['username'],
        "hasSave"      => $save !== null,
        "scene"        => $save['scene']   ?? 'Room1',
        "x"            => $save['pos_x']   ?? 200,
        "y"            => $save['pos_y']   ?? 200,
        "tiempo"       => $save['tiempo']  ?? 0,
        "playerHP"     => $save['vida']    ?? 100,
        "monstersDead" => $save['monsters_dead'] ?? '[]',
    ]);
} else {
    echo json_encode(["logged" => false, "error" => "Usuario o contraseña incorrectos"]);
}
?>