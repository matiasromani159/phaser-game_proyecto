<?php
// register.php — Registro de nuevos usuarios
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["ok" => false, "error" => "Método no permitido"]);
    exit;
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de base de datos"]);
    exit;
}

$data     = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// ── Validaciones ──────────────────────────────────────────────
if (!$username || !$password) {
    echo json_encode(["ok" => false, "error" => "Faltan campos obligatorios"]);
    exit;
}
if (strlen($username) < 3 || strlen($username) > 20) {
    echo json_encode(["ok" => false, "error" => "El nombre debe tener entre 3 y 20 caracteres"]);
    exit;
}
if (!preg_match('/^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+$/', $username)) {
    echo json_encode(["ok" => false, "error" => "El nombre solo puede contener letras, números y guiones bajos"]);
    exit;
}
if (strlen($password) < 4) {
    echo json_encode(["ok" => false, "error" => "La contraseña debe tener al menos 4 caracteres"]);
    exit;
}

// ── Comprobar si el usuario ya existe ─────────────────────────
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["ok" => false, "error" => "Ese nombre de usuario ya existe"]);
    exit;
}
$stmt->close();

// ── Crear usuario ─────────────────────────────────────────────
$hashed = password_hash($password, PASSWORD_DEFAULT);
$role   = 'player'; // 'player' | 'admin'

$stmt = $conn->prepare("INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("sss", $username, $hashed, $role);

if ($stmt->execute()) {
    $newId = $conn->insert_id;
    echo json_encode([
        "ok"       => true,
        "userId"   => $newId,
        "username" => $username,
        "message"  => "Cuenta creada correctamente"
    ]);
} else {
    echo json_encode(["ok" => false, "error" => "Error al crear la cuenta: " . $stmt->error]);
}

$conn->close();
?>