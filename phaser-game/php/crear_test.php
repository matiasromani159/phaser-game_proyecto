<?php
$conn = new mysqli("localhost", "root", "1234", "juego");
$hash = password_hash('1234', PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hash);
$username = 'test';
$stmt->execute();
echo "Usuario test creado. Contraseña: 1234";
?>