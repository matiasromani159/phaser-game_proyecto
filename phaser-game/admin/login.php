<?php
session_start();
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(["ok" => false, "error" => "Faltan credenciales"]);
    exit;
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de DB"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$u = $stmt->get_result()->fetch_assoc();

if ($u && password_verify($password, $u['password'])) {
    $_SESSION['user_id'] = $u['id'];
    $_SESSION['username'] = $u['username'];
    $_SESSION['role'] = $u['role'];
    
    echo json_encode([
        "ok" => true,
        "username" => $u['username'],
        "role" => $u['role']
    ]);
} else {
    echo json_encode(["ok" => false, "error" => "Usuario o contraseña incorrectos"]);
}
?>