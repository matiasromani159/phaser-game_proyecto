<?php
session_start();

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

// conectar a DB
$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["logged" => false, "error" => "Error de DB"]);
    exit;
}

// 1️⃣ Verificar si ya hay sesión
if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "logged" => true,
        "scene" => $_SESSION['scene'] ?? "GameScene",
        "x" => $_SESSION['x'] ?? 200,
        "y" => $_SESSION['y'] ?? 200,
        "tiempo" => $_SESSION['tiempo'] ?? 0
    ]);
    exit;
}

// 2️⃣ Si vienen credenciales -> login
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if ($username && $password) {
    // buscar usuario en DB
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $u = $result->fetch_assoc();

    // validar password (aquí simple, luego usar password_hash)
    if ($u && $u['password'] === $password) {
        // guardar sesión
        $_SESSION['user_id'] = $u['id'];
        $_SESSION['scene']   = $u['scene'] ?? 'GameScene';
        $_SESSION['x']       = $u['pos_x'] ?? 200;
        $_SESSION['y']       = $u['pos_y'] ?? 200;
        $_SESSION['tiempo']  = $u['tiempo'] ?? 0;

        echo json_encode([
            "logged" => true,
            "scene" => $_SESSION['scene'],
            "x" => $_SESSION['x'],
            "y" => $_SESSION['y'],
            "tiempo" => $_SESSION['tiempo']
        ]);
        exit;
    } else {
        echo json_encode(["logged" => false, "error" => "Usuario o contraseña incorrectos"]);
        exit;
    }
}

// 3️⃣ No hay sesión ni login
echo json_encode(["logged" => false]);
