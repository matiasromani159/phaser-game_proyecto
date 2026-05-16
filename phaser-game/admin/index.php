<?php
session_start();

// ── LOGIN ────────────────────────────────────────────────────
if (!isset($_SESSION['user_id'])) {
    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Iniciar sesión</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                background: #f8f9fa;
                color: #343a40;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-card {
                background: #fff;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                width: 100%;
                max-width: 360px;
                overflow: hidden;
            }
            .login-header {
                background: #2b3e50;
                padding: 1.5rem;
                text-align: center;
            }
            .login-header h1 {
             font-family: 'Times New Roman', Times, serif;
                color: #fff;
                font-size: 1.1rem;
                font-weight: 600;
            }
            .login-body { padding: 1.5rem; }
            label {
                 font-family: 'Times New Roman', Times, serif;
                display: block;
                font-size: 0.8rem;
                font-weight: 600;
                color: #495057;
                margin-bottom: 0.3rem;
            }
            input {
                 font-family: 'Times New Roman', Times, serif;
                width: 100%;
                padding: 0.45rem 0.75rem;
                font-size: 0.875rem;
                border: 1px solid #ced4da;
                border-radius: 3px;
                color: #343a40;
                margin-bottom: 1rem;
                outline: none;
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            input:focus { border-color: #2b3e50; box-shadow: 0 0 0 3px rgba(43,62,80,0.12); }
            button {
                width: 100%;
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: #fff;
                background: #2b3e50;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                transition: background 0.15s;
            }
            button:hover { background: #1e2e3d; }
            .error {
                margin-top: 0.75rem;
                font-size: 0.8rem;
                color: #842029;
                background: #f8d7da;
                border: 1px solid #f5c2c7;
                border-radius: 3px;
                padding: 0.4rem 0.75rem;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="login-card">
            <div class="login-header"><h1>Panel de Control</h1></div>
            <div class="login-body">
                <label>Usuario</label>
                <input type="text" id="username" placeholder="Nombre de usuario" autocomplete="username">
                <label>Contraseña</label>
                <input type="password" id="password" placeholder="Contraseña" autocomplete="current-password">
                <button onclick="login()">Iniciar sesión</button>
                <div class="error" id="error"></div>
            </div>
        </div>
        <script>
            async function login() {
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const err = document.getElementById('error');
                if (!username || !password) { err.textContent = 'Introduce usuario y contraseña.'; err.style.display = 'block'; return; }
                try {
                    const res = await fetch('login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                    const data = await res.json();
                    if (data.ok && data.role === 'admin') { window.location.reload(); }
                    else if (data.ok) { err.textContent = 'Sin permisos de administrador.'; err.style.display = 'block'; }
                    else { err.textContent = data.error || 'Credenciales incorrectas.'; err.style.display = 'block'; }
                } catch { err.textContent = 'Error de conexión.'; err.style.display = 'block'; }
            }
            document.addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
        </script>
    </body>
    </html>
    <?php
    exit;
}

if ($_SESSION['role'] !== 'admin') {
    header('HTTP/1.1 403 Forbidden');
    die('Acceso denegado.');
}

$conn = new mysqli("localhost", "root", "1234", "juego");
if ($conn->connect_error) die("Error: " . $conn->connect_error);

// ── DATOS COMUNES ───────────────────────────────────────────
$totalUsers    = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$totalPartidas = $conn->query("SELECT COUNT(*) as c FROM partidas")->fetch_assoc()['c'];
$totalTime     = $conn->query("SELECT COALESCE(SUM(tiempo), 0) as c FROM partidas")->fetch_assoc()['c'];

// ── DATOS PARA ESTADÍSTICAS ─────────────────────────────────
// Promedio de tiempo por partida
$avgTimeResult = $conn->query("SELECT COALESCE(AVG(tiempo), 0) as avg_tiempo FROM partidas")->fetch_assoc();
$avgTimePerGame = round($avgTimeResult['avg_tiempo'], 1);

// Usuario más activo (por tiempo total)
$mostActiveResult = $conn->query("
    SELECT u.username, COALESCE(SUM(p.tiempo), 0) as total_tiempo, COUNT(p.id) as total_partidas
    FROM users u
    LEFT JOIN partidas p ON u.id = p.user_id
    GROUP BY u.id, u.username
    ORDER BY total_tiempo DESC
    LIMIT 1
")->fetch_assoc();

// Distribución de roles
$rolesResult = $conn->query("SELECT role, COUNT(*) as cantidad FROM users GROUP BY role");
$rolesData = [];
while ($r = $rolesResult->fetch_assoc()) {
    $rolesData[$r['role']] = $r['cantidad'];
}

// Top 5 usuarios por tiempo
$topUsersResult = $conn->query("
    SELECT u.username, COALESCE(SUM(p.tiempo), 0) as total_tiempo, COUNT(p.id) as total_partidas
    FROM users u
    LEFT JOIN partidas p ON u.id = p.user_id
    GROUP BY u.id, u.username
    ORDER BY total_tiempo DESC
    LIMIT 5
");

// Datos para gráfico de actividad por día (últimos 7 días)
$activityResult = $conn->query("
    SELECT DATE(created_at) as fecha, COUNT(*) as partidas
    FROM partidas
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY fecha
");
$activityData = [];
while ($a = $activityResult->fetch_assoc()) {
    $activityData[$a['fecha']] = $a['partidas'];
}

// ── DATOS PARA TABLA DE USUARIOS ────────────────────────────
// JOIN con users para obtener el username real en vez de player_name
$result = $conn->query("
    SELECT u.id, u.username, u.role, u.created_at,
        COUNT(p.id) as total_partidas,
        COALESCE(SUM(p.tiempo), 0) as tiempo_total,
        COALESCE(MAX(p.player_level), 1) as nivel_max
    FROM users u
    LEFT JOIN partidas p ON u.id = p.user_id
    GROUP BY u.id, u.username, u.role, u.created_at
    ORDER BY u.id DESC
");

// Determinar vista activa
$vista = isset($_GET['vista']) ? $_GET['vista'] : 'usuarios';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            background: #f8f9fa;
            color: #343a40;
            min-height: 100vh;
            display: flex;
        }

        /* SIDEBAR */
        .sidebar {
            width: 220px;
            min-height: 100vh;
            background: #2b3e50;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }
        .sidebar-brand {
            padding: 1.1rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .sidebar-brand .name { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .sidebar-brand .sub  { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 0.1rem; }
        .sidebar-section {
            padding: 1.1rem 1rem 0.4rem;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255,255,255,0.28);
        }
        .sidebar-link {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            padding: 0.55rem 1rem;
            color: rgba(255,255,255,0.6);
            font-size: 0.85rem;
            text-decoration: none;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: background 0.12s, color 0.12s;
        }
        .sidebar-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .sidebar-link.active { background: rgba(255,255,255,0.09); color: #fff; border-left-color: #5bc0de; }
        .sidebar-link svg { width: 15px; height: 15px; flex-shrink: 0; }
        .sidebar-footer {
            margin-top: auto;
            padding: 0.9rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.07);
        }
        .sidebar-user { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-bottom: 0.5rem; }
        .sidebar-user strong { display: block; color: rgba(255,255,255,0.8); margin-top: 0.1rem; }
        .btn-logout {
            display: block;
            width: 100%;
            padding: 0.35rem 0.75rem;
            font-size: 0.78rem;
            color: rgba(255,255,255,0.5);
            background: transparent;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 3px;
            text-align: center;
            text-decoration: none;
            transition: all 0.12s;
        }
        .btn-logout:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .topbar {
            background: #fff;
            border-bottom: 1px solid #dee2e6;
            padding: 0.7rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .topbar h1 { font-size: 0.95rem; font-weight: 600; }
        .topbar .crumb { font-size: 0.78rem; color: #6c757d; }
        .topbar .crumb span { color: #343a40; }
        .content { padding: 1.25rem 1.5rem; }

        /* STATS */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 1.25rem;
        }
        .stat-card {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 1rem 1.1rem;
            display: flex;
            align-items: center;
            gap: 0.85rem;
        }
        .stat-icon {
            width: 40px; height: 40px;
            border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .stat-icon svg { width: 18px; height: 18px; }
        .stat-icon.blue  { background: #dbeafe; color: #1d4ed8; }
        .stat-icon.green { background: #dcfce7; color: #166534; }
        .stat-icon.amber { background: #fef9c3; color: #854d0e; }
        .stat-icon.slate { background: #f1f5f9; color: #475569; }
        .stat-icon.purple { background: #f3e8ff; color: #7c3aed; }
        .stat-icon.rose { background: #ffe4e6; color: #be123c; }
        .stat-val  { font-size: 1.4rem; font-weight: 700; color: #1e293b; line-height: 1.1; }
        .stat-lbl  { font-size: 0.73rem; color: #6c757d; margin-top: 0.1rem; }

        /* PANEL */
        .panel { background: #fff; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 1.25rem; }
        .panel-head {
            padding: 0.7rem 1rem;
            border-bottom: 1px solid #dee2e6;
            display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .panel-head h2 { font-size: 0.88rem; font-weight: 600; }
        .panel-head-r  { display: flex; align-items: center; gap: 0.5rem; }
        .form-control {
            padding: 0.32rem 0.6rem;
            font-size: 0.82rem;
            border: 1px solid #ced4da;
            border-radius: 3px;
            color: #343a40;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-control:focus { border-color: #2b3e50; box-shadow: 0 0 0 3px rgba(43,62,80,0.12); }

        /* BUTTONS */
        .btn {
            display: inline-flex; align-items: center; gap: 0.25rem;
            padding: 0.32rem 0.7rem;
            font-size: 0.8rem; font-weight: 500;
            border-radius: 3px; border: 1px solid transparent;
            cursor: pointer; transition: all 0.12s; white-space: nowrap;
        }
        .btn-primary  { background:#2b3e50; color:#fff; border-color:#2b3e50; }
        .btn-primary:hover { background:#1e2e3d; border-color:#1e2e3d; }
        .btn-success  { background:#198754; color:#fff; border-color:#198754; }
        .btn-success:hover { background:#157347; }
        .btn-warning  { background:#ffc107; color:#212529; border-color:#ffc107; }
        .btn-warning:hover { background:#e0a800; }
        .btn-danger   { background:#dc3545; color:#fff; border-color:#dc3545; }
        .btn-danger:hover { background:#bb2d3b; }
        .btn-secondary{ background:#6c757d; color:#fff; border-color:#6c757d; }
        .btn-secondary:hover { background:#5c636a; }
        .btn-sm { padding: 0.22rem 0.5rem; font-size: 0.75rem; }

        /* TABLE */
        table { width: 100%; border-collapse: collapse; }
        thead th {
            padding: 0.55rem 1rem;
            font-size: 0.72rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.05em;
            color: #6c757d;
            background: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            text-align: left; white-space: nowrap;
        }
        tbody td {
            padding: 0.6rem 1rem;
            border-bottom: 1px solid #f1f3f5;
            font-size: 0.84rem;
            vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover td { background: #f8f9fa; }

        .badge {
            display: inline-block;
            padding: 0.18rem 0.5rem;
            font-size: 0.7rem; font-weight: 600;
            border-radius: 3px;
        }
        .badge-admin  { background: #dc3545; color: #fff; }
        .badge-player { background: #0d6efd; color: #fff; }

        .actions { display: flex; gap: 0.3rem; }

        /* ESTADÍSTICAS */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.25rem;
        }
        .stat-detail-card {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 1.2rem;
            text-align: center;
        }
        .stat-detail-card .number {
            font-size: 2rem;
            font-weight: 700;
            color: #2b3e50;
            margin-bottom: 0.3rem;
        }
        .stat-detail-card .label {
            font-size: 0.8rem;
            color: #6c757d;
            margin-bottom: 0.5rem;
        }
        .stat-detail-card .sub {
            font-size: 0.75rem;
            color: #adb5bd;
        }
        
        .chart-container {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 1.2rem;
            margin-bottom: 1.25rem;
        }
        .chart-title {
            font-size: 0.88rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #343a40;
        }
        .bar-chart {
            display: flex;
            align-items: flex-end;
            gap: 0.5rem;
            height: 200px;
            padding-bottom: 2rem;
            border-bottom: 1px solid #dee2e6;
            position: relative;
        }
        .bar-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
        }
        .bar {
            width: 100%;
            background: #2b3e50;
            border-radius: 3px 3px 0 0;
            min-height: 4px;
            transition: opacity 0.2s;
            position: relative;
        }
        .bar:hover { opacity: 0.8; }
        .bar-label {
            font-size: 0.7rem;
            color: #6c757d;
            text-align: center;
            white-space: nowrap;
            position: absolute;
            bottom: -1.8rem;
            width: 100%;
            transform: rotate(-30deg);
            transform-origin: top left;
        }
        .bar-value {
            font-size: 0.75rem;
            font-weight: 600;
            color: #2b3e50;
            margin-bottom: 0.2rem;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .progress-fill.admin { background: #dc3545; }
        .progress-fill.player { background: #0d6efd; }
        
        .role-distribution {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }
        .role-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .role-color {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            flex-shrink: 0;
        }
        .role-info {
            flex: 1;
        }
        .role-name {
            font-size: 0.82rem;
            font-weight: 600;
            color: #343a40;
        }
        .role-count {
            font-size: 0.75rem;
            color: #6c757d;
        }
        
        .top-users-list {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }
        .top-user-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .top-user-rank {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #2b3e50;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
        }
        .top-user-rank.gold { background: #f59e0b; }
        .top-user-rank.silver { background: #6b7280; }
        .top-user-rank.bronze { background: #92400e; }
        .top-user-info { flex: 1; }
        .top-user-name { font-size: 0.85rem; font-weight: 600; color: #343a40; }
        .top-user-stats { font-size: 0.75rem; color: #6c757d; }
        .top-user-time { font-size: 0.85rem; font-weight: 700; color: #2b3e50; }

        /* MODALS */
        .modal {
            display: none; position: fixed; inset: 0;
            background: rgba(0,0,0,0.4);
            align-items: center; justify-content: center; z-index: 1000;
        }
        .modal.active { display: flex; }
        .modal-dialog {
            background: #fff; border: 1px solid #dee2e6; border-radius: 4px;
            width: min(420px, 95vw);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .modal-header {
            padding: 0.8rem 1.1rem; border-bottom: 1px solid #dee2e6;
            display: flex; align-items: center; justify-content: space-between;
        }
        .modal-header h3 { font-size: 0.92rem; font-weight: 600; }
        .modal-close {
            background: none; border: none; cursor: pointer;
            color: #6c757d; font-size: 1.15rem; padding: 0 0.15rem; line-height: 1;
        }
        .modal-close:hover { color: #343a40; }
        .modal-body { padding: 1.1rem; }
        .modal-footer {
            padding: 0.7rem 1.1rem; border-top: 1px solid #dee2e6;
            display: flex; justify-content: flex-end; gap: 0.5rem;
        }
        .form-group { margin-bottom: 0.9rem; }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label {
            display: block; font-size: 0.8rem; font-weight: 600;
            color: #495057; margin-bottom: 0.3rem;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 0.42rem 0.7rem;
            font-size: 0.875rem;
            border: 1px solid #ced4da; border-radius: 3px;
            color: #343a40; outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-group input:focus, .form-group select:focus {
            border-color: #2b3e50; box-shadow: 0 0 0 3px rgba(43,62,80,0.12);
        }

        /* TOAST */
        .toast {
            position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 2000;
            padding: 0.6rem 1rem;
            border-radius: 4px; font-size: 0.82rem; font-weight: 500; color: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(130%); opacity: 0;
            transition: transform 0.22s ease, opacity 0.22s;
        }
        .toast.show { transform: translateX(0); opacity: 1; }
        .toast-success { background: #198754; }
        .toast-error   { background: #dc3545; }
        
        /* UTILS */
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .hidden { display: none !important; }
    </style>
</head>
<body>

<<aside class="sidebar">
    <div class="sidebar-brand">
        <div class="name">Dashboard</div>
        <div class="sub">Panel de administración</div>
    </div>

    <div class="sidebar-section">Menú</div>
    <a class="sidebar-link <?= $vista === 'usuarios' ? 'active' : '' ?>" href="?vista=usuarios">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Usuarios
    </a>
    <a class="sidebar-link <?= $vista === 'estadisticas' ? 'active' : '' ?>" href="?vista=estadisticas">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Estadísticas
    </a>

    <div class="sidebar-footer">
        <div class="sidebar-user">
            Conectado como<strong><?= htmlspecialchars($_SESSION['username']) ?></strong>
        </div>
        <a href="logout.php" class="btn-logout">Cerrar sesión</a>
    </div>
</aside>

<div class="main">
    <div class="topbar">
        <h1>Dashboard</h1>
        <div class="crumb">Inicio / <span><?= $vista === 'usuarios' ? 'Usuarios' : 'Estadísticas' ?></span></div>
    </div>

    <div class="content">

        <!-- STATS ROW (siempre visible) -->
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div><div class="stat-val"><?= $totalUsers ?></div><div class="stat-lbl">Usuarios registrados</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div><div class="stat-val"><?= $totalPartidas ?></div><div class="stat-lbl">Partidas guardadas</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon amber">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div><div class="stat-val"><?= floor($totalTime/3600) ?>h <?= floor(($totalTime%3600)/60) ?>m</div><div class="stat-lbl">Tiempo total jugado</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon slate">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <div><div class="stat-val"><?= $totalUsers > 0 ? round($totalPartidas/$totalUsers,1) : 0 ?></div><div class="stat-lbl">Promedio por usuario</div></div>
            </div>
        </div>

        <?php if ($vista === 'usuarios'): ?>
        <!-- VISTA USUARIOS -->
        <div class="panel">
            <div class="panel-head">
                <h2>Usuarios</h2>
                <div class="panel-head-r">
                    <input type="text" class="form-control" id="searchInput" placeholder="Buscar usuario..." onkeyup="filtrarTabla()" style="width:190px;">
                    <button class="btn btn-success" onclick="mostrarModalAdd()">+ Añadir usuario</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th><th>Usuario</th><th>Rol</th><th>Registro</th>
                        <th>Partidas</th><th>Tiempo</th><th>Nivel máx.</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaUsuarios">
                    <?php while ($row = $result->fetch_assoc()): ?>
                    <tr data-id="<?= $row['id'] ?>" data-username="<?= htmlspecialchars($row['username']) ?>">
                        <td style="color:#6c757d;font-size:0.78rem;"><?= $row['id'] ?></td>
                        <td style="font-weight:600;"><?= htmlspecialchars($row['username']) ?></td>
                        <td><span class="badge badge-<?= $row['role'] ?>"><?= ucfirst($row['role']) ?></span></td>
                        <td><?= date('d/m/Y', strtotime($row['created_at'])) ?></td>
                        <td><?= $row['total_partidas'] ?></td>
                        <td><?= floor($row['tiempo_total']/60) ?>m <?= $row['tiempo_total']%60 ?>s</td>
                        <td><?= $row['nivel_max'] ?></td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-primary btn-sm" onclick="editarRol(<?= $row['id'] ?>, '<?= $row['role'] ?>')">Editar rol</button>
                                <button class="btn btn-warning btn-sm" onclick="resetStats(<?= $row['id'] ?>)">Reset</button>
                                <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(<?= $row['id'] ?>, '<?= htmlspecialchars($row['username']) ?>')">Eliminar</button>
                            </div>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>

        <?php else: ?>
        <!-- VISTA ESTADÍSTICAS -->
        <div class="stats-grid">
            <div class="stat-detail-card">
                <div class="number"><?= $avgTimePerGame ?>s</div>
                <div class="label">Tiempo promedio por partida</div>
                <div class="sub">Media de duración de todas las partidas</div>
            </div>
            <div class="stat-detail-card">
                <div class="number"><?= $mostActiveResult ? htmlspecialchars($mostActiveResult['username']) : '—' ?></div>
                <div class="label">Usuario más activo</div>
                <div class="sub">
                    <?= $mostActiveResult ? floor($mostActiveResult['total_tiempo']/60) . 'm jugados · ' . $mostActiveResult['total_partidas'] . ' partidas' : 'Sin actividad registrada' ?>
                </div>
            </div>
            <div class="stat-detail-card">
                <div class="number"><?= $totalPartidas > 0 ? round($totalTime / $totalPartidas, 1) : 0 ?>s</div>
                <div class="label">Media global de tiempo</div>
                <div class="sub">Tiempo total ÷ número de partidas</div>
            </div>
        </div>

        <div class="two-columns">
            <div class="panel">
                <div class="panel-head">
                    <h2>Distribución de roles</h2>
                </div>
                <div style="padding: 1.1rem;">
                    <div class="role-distribution">
                        <?php 
                        $totalRoles = array_sum($rolesData);
                        foreach ($rolesData as $role => $count): 
                            $percentage = $totalRoles > 0 ? round(($count / $totalRoles) * 100, 1) : 0;
                        ?>
                        <div class="role-item">
                            <div class="role-color" style="background: <?= $role === 'admin' ? '#dc3545' : '#0d6efd' ?>;"></div>
                            <div class="role-info">
                                <div class="role-name"><?= ucfirst($role) ?>s</div>
                                <div class="role-count"><?= $count ?> usuarios (<?= $percentage ?>%)</div>
                                <div class="progress-bar">
                                    <div class="progress-fill <?= $role ?>" style="width: <?= $percentage ?>%"></div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-head">
                    <h2>Top 5 usuarios más activos</h2>
                </div>
                <div style="padding: 1.1rem;">
                    <div class="top-users-list">
                        <?php 
                        $rank = 0;
                        while ($user = $topUsersResult->fetch_assoc()): 
                            $rank++;
                            $rankClass = $rank === 1 ? 'gold' : ($rank === 2 ? 'silver' : ($rank === 3 ? 'bronze' : ''));
                        ?>
                        <div class="top-user-item">
                            <div class="top-user-rank <?= $rankClass ?>"><?= $rank ?></div>
                            <div class="top-user-info">
                                <div class="top-user-name"><?= htmlspecialchars($user['username']) ?></div>
                                <div class="top-user-stats"><?= $user['total_partidas'] ?> partidas</div>
                            </div>
                            <div class="top-user-time"><?= floor($user['total_tiempo']/60) ?>m</div>
                        </div>
                        <?php endwhile; ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart-title">Actividad de partidas (últimos 7 días)</div>
            <div class="bar-chart">
                <?php
                $maxVal = max(array_values($activityData) + [1]);
                for ($i = 6; $i >= 0; $i--) {
                    $date = date('Y-m-d', strtotime("-$i days"));
                    $count = isset($activityData[$date]) ? $activityData[$date] : 0;
                    $height = $maxVal > 0 ? ($count / $maxVal) * 100 : 0;
                    $label = date('d/m', strtotime($date));
                ?>
                <div class="bar-wrapper">
                    <div class="bar-value"><?= $count ?></div>
                    <div class="bar" style="height: <?= max($height, 4) ?>%;">
                        <div class="bar-label"><?= $label ?></div>
                    </div>
                </div>
                <?php } ?>
            </div>
        </div>
        <?php endif; ?>

    </div>
</div>

<!-- Modal editar rol -->
<div class="modal" id="modalRol">
    <div class="modal-dialog">
        <div class="modal-header">
            <h3>Editar rol — <span id="modalUsername"></span></h3>
            <button class="modal-close" onclick="cerrarModal('modalRol')">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Rol</label>
                <select id="selectRol">
                    <option value="player">Jugador</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="cerrarModal('modalRol')">Cancelar</button>
            <button class="btn btn-primary" onclick="guardarRol()">Guardar cambios</button>
        </div>
    </div>
</div>

<!-- Modal añadir usuario -->
<div class="modal" id="modalAdd">
    <div class="modal-dialog">
        <div class="modal-header">
            <h3>Añadir usuario</h3>
            <button class="modal-close" onclick="cerrarModal('modalAdd')">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Nombre de usuario</label>
                <input type="text" id="newUsername" placeholder="Nombre de usuario">
            </div>
            <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="newPassword" placeholder="Contraseña">
            </div>
            <div class="form-group">
                <label>Rol</label>
                <select id="newRole">
                    <option value="player">Jugador</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="cerrarModal('modalAdd')">Cancelar</button>
            <button class="btn btn-success" onclick="guardarUsuario()">Crear usuario</button>
        </div>
    </div>
</div>

<div class="toast" id="toast"></div>

<script>
    let userIdEditando = null;

    function filtrarTabla() {
        const f = document.getElementById('searchInput').value.toLowerCase();
        document.querySelectorAll('#tablaUsuarios tr').forEach(r => {
            r.style.display = r.dataset.username.toLowerCase().includes(f) ? '' : 'none';
        });
    }

    function mostrarModalAdd() {
        ['newUsername','newPassword'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('newRole').value = 'player';
        document.getElementById('modalAdd').classList.add('active');
    }

    function editarRol(id, rol) {
        userIdEditando = id;
        document.getElementById('modalUsername').textContent =
            document.querySelector(`tr[data-id="${id}"] td:nth-child(2)`).textContent;
        document.getElementById('selectRol').value = rol;
        document.getElementById('modalRol').classList.add('active');
    }

    function cerrarModal(id) {
        document.getElementById(id).classList.remove('active');
        if (id === 'modalRol') userIdEditando = null;
    }

    async function guardarUsuario() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;
        if (!username || !password) { toast('Introduce usuario y contraseña.', 'error'); return; }
        if (username.length < 3 || password.length < 4) { toast('Usuario: mín. 3 chars · Contraseña: mín. 4.', 'error'); return; }
        try {
            const r = await fetch('../php/register.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password,role}) });
            const d = await r.json();
            if (d.ok) { toast('Usuario creado.', 'success'); cerrarModal('modalAdd'); setTimeout(() => location.reload(), 1000); }
            else toast(d.error || 'Error al crear usuario.', 'error');
        } catch { toast('Error de conexión.', 'error'); }
    }

    async function guardarRol() {
        if (!userIdEditando) return;
        const role = document.getElementById('selectRol').value;
        try {
            const r = await fetch('../php/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:userIdEditando,action:'updateRole',role}) });
            const d = await r.json();
            if (d.ok) { toast('Rol actualizado.', 'success'); location.reload(); }
            else toast(d.error || 'Error.', 'error');
        } catch { toast('Error de conexión.', 'error'); }
        cerrarModal('modalRol');
    }

    async function resetStats(id) {
        if (!confirm('¿Resetear estadísticas de este usuario?')) return;
        try {
            const r = await fetch('../php/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:id,action:'resetStats'}) });
            const d = await r.json();
            if (d.ok) { toast('Estadísticas reseteadas.', 'success'); location.reload(); }
            else toast(d.error || 'Error.', 'error');
        } catch { toast('Error de conexión.', 'error'); }
    }

    async function eliminarUsuario(id, username) {
        if (!confirm(`¿Eliminar a "${username}" permanentemente?`)) return;
        try {
            const r = await fetch('../php/admin.php', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:id}) });
            const d = await r.json();
            if (d.ok) { toast('Usuario eliminado.', 'success'); document.querySelector(`tr[data-id="${id}"]`).remove(); }
            else toast(d.error || 'Error.', 'error');
        } catch { toast('Error de conexión.', 'error'); }
    }

    function toast(msg, tipo) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = `toast toast-${tipo}`;
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => el.classList.remove('show'), 3200);
    }

    ['modalRol','modalAdd'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => { if (e.target.id === id) cerrarModal(id); });
    });
</script>
</body>
</html>