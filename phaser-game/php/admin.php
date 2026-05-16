<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// Verificar autenticación y rol admin
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? 'player') !== 'admin') {
    echo json_encode(["ok" => false, "error" => "Acceso denegado"]);
    exit;
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) {
    echo json_encode(["ok" => false, "error" => "Error de DB"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Listar todos los usuarios con stats ──
if ($method === 'GET') {
    $result = $conn->query("
        SELECT 
            u.id,
            u.username,
            u.role,
            u.created_at,
            COUNT(p.id) as total_partidas,
            COALESCE(SUM(p.tiempo), 0) as tiempo_total,
            COALESCE(MAX(p.player_level), 1) as nivel_max
        FROM users u
        LEFT JOIN partidas p ON u.id = p.user_id
        GROUP BY u.id, u.username, u.role, u.created_at
        ORDER BY u.id DESC
    ");
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            "id"             => (int)$row['id'],
            "username"       => $row['username'],
            "role"           => $row['role'],
            "createdAt"      => $row['created_at'],
            "totalPartidas"  => (int)$row['total_partidas'],
            "tiempoTotal"    => (int)$row['tiempo_total'],
            "nivelMaximo"    => (int)$row['nivel_max']
        ];
    }
    
    echo json_encode(["ok" => true, "users" => $users]);
    exit;
}

// ── POST: Editar usuario (cambiar role o resetear stats) ──
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = intval($data['userId'] ?? 0);
    $action = $data['action'] ?? ''; // 'updateRole' | 'resetStats'
    
    if (!$userId) {
        echo json_encode(["ok" => false, "error" => "ID de usuario requerido"]);
        exit;
    }
    
    // No permitir editarse a sí mismo
    if ($userId === $_SESSION['user_id']) {
        echo json_encode(["ok" => false, "error" => "No puedes editarte a ti mismo"]);
        exit;
    }
    
    if ($action === 'updateRole') {
        $newRole = in_array($data['role'] ?? '', ['player', 'admin']) ? $data['role'] : 'player';
        $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->bind_param("si", $newRole, $userId);
        $stmt->execute();
        echo json_encode(["ok" => true, "message" => "Rol actualizado"]);
        
    } elseif ($action === 'resetStats') {
        $stmt = $conn->prepare("DELETE FROM partidas WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        echo json_encode(["ok" => true, "message" => "Estadísticas reseteadas"]);
        
    } else {
        echo json_encode(["ok" => false, "error" => "Acción no válida"]);
    }
    exit;
}

// ── DELETE: Borrar usuario y sus datos ──
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = intval($data['userId'] ?? 0);
    
    if (!$userId) {
        echo json_encode(["ok" => false, "error" => "ID de usuario requerido"]);
        exit;
    }
    
    if ($userId === $_SESSION['user_id']) {
        echo json_encode(["ok" => false, "error" => "No puedes borrarte a ti mismo"]);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("DELETE FROM partidas WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        
        $conn->commit();
        echo json_encode(["ok" => true, "message" => "Usuario eliminado"]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["ok" => false, "error" => "Error al eliminar"]);
    }
    exit;
}
?>