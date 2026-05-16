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
        <title>Login — Admin</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --ink: #0a0a0a;
                --paper: #f2efe8;
                --accent: #c8391a;
                --muted: #7a7570;
                --border: #c8c4bc;
                --surface: #e8e4dc;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Syne', sans-serif;
                background: var(--paper);
                color: var(--ink);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: '';
                position: fixed;
                inset: 0;
                background-image:
                    repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px),
                    repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px);
                opacity: 0.35;
                pointer-events: none;
            }
            .watermark {
                position: fixed;
                bottom: -2rem;
                right: -1rem;
                font-family: 'Syne', sans-serif;
                font-size: 14rem;
                font-weight: 800;
                color: var(--ink);
                opacity: 0.04;
                line-height: 1;
                pointer-events: none;
                user-select: none;
            }
            .login-wrap {
                position: relative;
                z-index: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
                width: min(800px, 95vw);
                border: 2px solid var(--ink);
                background: var(--paper);
                box-shadow: 8px 8px 0 var(--ink);
            }
            .login-left {
                background: var(--ink);
                padding: 3rem;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .login-left .eyebrow {
                font-family: 'DM Mono', monospace;
                font-size: 0.7rem;
                color: var(--muted);
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #6b6560;
            }
            .login-left h1 {
                font-size: 3rem;
                font-weight: 800;
                color: var(--paper);
                line-height: 0.95;
                letter-spacing: -0.02em;
                margin-top: 2rem;
            }
            .login-left h1 span {
                color: var(--accent);
            }
            .login-left .desc {
                font-family: 'DM Mono', monospace;
                font-size: 0.75rem;
                color: #6b6560;
                line-height: 1.6;
            }
            .login-right {
                padding: 3rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 1rem;
            }
            .login-right h2 {
                font-size: 1.1rem;
                font-weight: 700;
                letter-spacing: -0.01em;
                margin-bottom: 0.5rem;
            }
            .field-label {
                font-family: 'DM Mono', monospace;
                font-size: 0.65rem;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--muted);
                margin-bottom: 0.35rem;
                display: block;
            }
            input {
                width: 100%;
                padding: 0.75rem 0.875rem;
                background: var(--surface);
                border: 1.5px solid var(--border);
                color: var(--ink);
                font-family: 'DM Mono', monospace;
                font-size: 0.85rem;
                outline: none;
                transition: border-color 0.15s;
                margin-bottom: 1rem;
            }
            input:focus {
                border-color: var(--ink);
                background: #fff;
            }
            button {
                width: 100%;
                padding: 0.875rem;
                background: var(--ink);
                color: var(--paper);
                border: none;
                font-family: 'Syne', sans-serif;
                font-size: 0.85rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                cursor: pointer;
                transition: background 0.15s, transform 0.1s;
            }
            button:hover { background: #1f1f1f; }
            button:active { transform: translateY(1px); }
            .error {
                font-family: 'DM Mono', monospace;
                font-size: 0.75rem;
                color: var(--accent);
                padding: 0.625rem 0.75rem;
                border-left: 3px solid var(--accent);
                background: rgba(200, 57, 26, 0.07);
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="watermark">ADM</div>
        <div class="login-wrap">
            <div class="login-left">
                <div class="eyebrow">Sistema de acceso</div>
                <div>
                    <h1>DELTA<span>RUNE</span><br>TFG.</h1>
                </div>
                <p class="desc">Panel restringido.<br>Solo administradores.</p>
            </div>
            <div class="login-right">
                <h2>Iniciar sesión</h2>
                <div>
                    <label class="field-label">Usuario</label>
                    <input type="text" id="username" placeholder="nombre_usuario" autocomplete="username">
                </div>
                <div>
                    <label class="field-label">Contraseña</label>
                    <input type="password" id="password" placeholder="••••••••" autocomplete="current-password">
                </div>
                <button onclick="login()">Entrar →</button>
                <div class="error" id="error"></div>
            </div>
        </div>

        <script>
            async function login() {
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error');
                if (!username || !password) {
                    errorDiv.textContent = 'Introduce usuario y contraseña';
                    errorDiv.style.display = 'block';
                    return;
                }
                try {
                    const res = await fetch('login.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (data.ok && data.role === 'admin') {
                        window.location.reload();
                    } else if (data.ok && data.role !== 'admin') {
                        errorDiv.textContent = 'Sin permisos de administrador.';
                        errorDiv.style.display = 'block';
                    } else {
                        errorDiv.textContent = data.error || 'Credenciales incorrectas.';
                        errorDiv.style.display = 'block';
                    }
                } catch (e) {
                    errorDiv.textContent = 'Error de conexión.';
                    errorDiv.style.display = 'block';
                }
            }
            document.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
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

$totalUsers   = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$totalPartidas = $conn->query("SELECT COUNT(*) as c FROM partidas")->fetch_assoc()['c'];
$totalTime    = $conn->query("SELECT COALESCE(SUM(tiempo), 0) as c FROM partidas")->fetch_assoc()['c'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — Deltarune TFG</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #0a0a0a;
            --paper: #f2efe8;
            --accent: #c8391a;
            --accent2: #1a6fc8;
            --muted: #7a7570;
            --border: #c8c4bc;
            --surface: #e8e4dc;
            --surface2: #dedad2;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Syne', sans-serif;
            background: var(--paper);
            color: var(--ink);
            min-height: 100vh;
        }

        /* Grid background */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
                repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px),
                repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px);
            opacity: 0.25;
            pointer-events: none;
            z-index: 0;
        }

        /* ── HEADER ── */
        .header {
            position: relative;
            z-index: 10;
            background: var(--ink);
            color: var(--paper);
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 0 2.5rem;
            border-bottom: 3px solid var(--accent);
        }
        .header-left {
            display: flex;
            align-items: baseline;
            gap: 1.5rem;
            padding: 1.25rem 0;
        }
        .header-left .logo {
            font-size: 1.4rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .header-left .logo span { color: var(--accent); }
        .header-left .version {
            font-family: 'DM Mono', monospace;
            font-size: 0.65rem;
            color: #6b6560;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 0.2rem 0.5rem;
            border: 1px solid #2a2a2a;
        }
        .header-right {
            display: flex;
            align-items: center;
            gap: 1.25rem;
        }
        .header-right .who {
            font-family: 'DM Mono', monospace;
            font-size: 0.75rem;
            color: #6b6560;
        }
        .header-right .who strong { color: var(--paper); }
        .chip-admin {
            font-family: 'DM Mono', monospace;
            font-size: 0.65rem;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 0.2rem 0.6rem;
            background: var(--accent);
            color: #fff;
        }
        .btn-logout {
            font-family: 'DM Mono', monospace;
            font-size: 0.7rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6b6560;
            text-decoration: none;
            padding: 0.4rem 0.75rem;
            border: 1px solid #2a2a2a;
            transition: color 0.15s, border-color 0.15s;
        }
        .btn-logout:hover { color: var(--paper); border-color: #555; }

        /* ── LAYOUT ── */
        .page {
            position: relative;
            z-index: 1;
            max-width: 1280px;
            margin: 0 auto;
            padding: 2.5rem 2.5rem;
        }

        /* ── SECTION TITLE ── */
        .section-label {
            font-family: 'DM Mono', monospace;
            font-size: 0.65rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        /* ── STATS ROW ── */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            border: 2px solid var(--ink);
            margin-bottom: 2.5rem;
            box-shadow: 5px 5px 0 var(--ink);
        }
        .stat-cell {
            padding: 1.75rem 1.5rem;
            border-right: 1px solid var(--border);
            position: relative;
        }
        .stat-cell:last-child { border-right: none; }
        .stat-cell .stat-label {
            font-family: 'DM Mono', monospace;
            font-size: 0.65rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 0.625rem;
        }
        .stat-cell .stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1;
        }
        .stat-cell:first-child .stat-value { color: var(--ink); }
        .stat-cell:nth-child(2) .stat-value { color: var(--accent2); }
        .stat-cell:nth-child(3) .stat-value { color: var(--accent); }
        .stat-cell:nth-child(4) .stat-value { color: var(--ink); }
        .stat-cell .stat-unit {
            font-family: 'DM Mono', monospace;
            font-size: 0.7rem;
            color: var(--muted);
            margin-top: 0.25rem;
        }
        .stat-cell::before {
            content: attr(data-num);
            position: absolute;
            top: 0.75rem;
            right: 1rem;
            font-family: 'DM Mono', monospace;
            font-size: 0.6rem;
            color: var(--border);
        }

        /* ── TABLE PANEL ── */
        .panel {
            border: 2px solid var(--ink);
            box-shadow: 5px 5px 0 var(--ink);
            background: var(--paper);
        }
        .panel-head {
            background: var(--ink);
            color: var(--paper);
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .panel-head h2 {
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .panel-head-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .search-box {
            background: #1a1a1a;
            border: 1px solid #333;
            color: var(--paper);
            padding: 0.5rem 0.875rem;
            font-family: 'DM Mono', monospace;
            font-size: 0.78rem;
            outline: none;
            width: 220px;
            transition: border-color 0.15s;
        }
        .search-box::placeholder { color: #555; }
        .search-box:focus { border-color: #555; }
        .btn-add {
            font-family: 'Syne', sans-serif;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 0.5rem 1rem;
            background: var(--accent);
            color: #fff;
            border: none;
            cursor: pointer;
            transition: background 0.15s;
        }
        .btn-add:hover { background: #a82e14; }

        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead tr {
            background: var(--surface);
            border-bottom: 2px solid var(--ink);
        }
        th {
            padding: 0.75rem 1.25rem;
            text-align: left;
            font-family: 'DM Mono', monospace;
            font-size: 0.62rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 500;
            white-space: nowrap;
        }
        td {
            padding: 0.9rem 1.25rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover td { background: var(--surface); }
        .col-id {
            font-family: 'DM Mono', monospace;
            font-size: 0.75rem;
            color: var(--muted);
        }
        .col-user {
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        .col-mono {
            font-family: 'DM Mono', monospace;
            font-size: 0.8rem;
            color: #444;
        }

        /* Badges */
        .badge {
            font-family: 'DM Mono', monospace;
            font-size: 0.62rem;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 0.2rem 0.6rem;
            display: inline-block;
        }
        .badge-admin { background: var(--accent); color: #fff; }
        .badge-player { background: var(--ink); color: var(--paper); }

        /* Action buttons */
        .actions { display: flex; gap: 0.375rem; }
        .btn {
            font-family: 'DM Mono', monospace;
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            padding: 0.35rem 0.7rem;
            border: 1.5px solid transparent;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.12s;
        }
        .btn-edit {
            background: transparent;
            border-color: var(--accent2);
            color: var(--accent2);
        }
        .btn-edit:hover { background: var(--accent2); color: #fff; }
        .btn-reset {
            background: transparent;
            border-color: var(--ink);
            color: var(--ink);
        }
        .btn-reset:hover { background: var(--ink); color: var(--paper); }
        .btn-delete {
            background: transparent;
            border-color: var(--accent);
            color: var(--accent);
        }
        .btn-delete:hover { background: var(--accent); color: #fff; }

        /* ── MODALS ── */
        .modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(10, 10, 10, 0.75);
            align-items: center;
            justify-content: center;
            z-index: 100;
        }
        .modal.active { display: flex; }
        .modal-box {
            background: var(--paper);
            border: 2px solid var(--ink);
            box-shadow: 8px 8px 0 var(--ink);
            padding: 2rem;
            width: min(420px, 95vw);
        }
        .modal-box h3 {
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--border);
        }
        .modal-field { margin-bottom: 1rem; }
        .modal-field label {
            display: block;
            font-family: 'DM Mono', monospace;
            font-size: 0.62rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 0.35rem;
        }
        .modal-field input,
        .modal-field select {
            width: 100%;
            padding: 0.7rem 0.875rem;
            background: var(--surface);
            border: 1.5px solid var(--border);
            color: var(--ink);
            font-family: 'DM Mono', monospace;
            font-size: 0.83rem;
            outline: none;
            transition: border-color 0.15s;
        }
        .modal-field input:focus,
        .modal-field select:focus { border-color: var(--ink); background: #fff; }
        .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }
        .btn-modal-cancel {
            font-family: 'DM Mono', monospace;
            font-size: 0.72rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.6rem 1rem;
            background: transparent;
            border: 1.5px solid var(--border);
            color: var(--muted);
            cursor: pointer;
            transition: all 0.12s;
        }
        .btn-modal-cancel:hover { border-color: var(--ink); color: var(--ink); }
        .btn-modal-ok {
            font-family: 'Syne', sans-serif;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 0.6rem 1.25rem;
            background: var(--ink);
            color: var(--paper);
            border: none;
            cursor: pointer;
            transition: background 0.12s;
        }
        .btn-modal-ok:hover { background: #1f1f1f; }
        .btn-modal-ok.danger { background: var(--accent); }
        .btn-modal-ok.danger:hover { background: #a82e14; }

        /* ── TOAST ── */
        .toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 200;
            font-family: 'DM Mono', monospace;
            font-size: 0.78rem;
            padding: 0.875rem 1.25rem;
            border-left: 4px solid transparent;
            background: var(--ink);
            color: var(--paper);
            transform: translateY(150%);
            opacity: 0;
            transition: transform 0.25s cubic-bezier(.22,1,.36,1), opacity 0.25s;
            max-width: 320px;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
        }
        .toast.show { transform: translateY(0); opacity: 1; }
        .toast-success { border-left-color: #22c55e; }
        .toast-error { border-left-color: var(--accent); }
    </style>
</head>
<body>

<header class="header">
    <div class="header-left">
        <div class="logo">DELTA<span>RUNE</span> TFG</div>
        <div class="version">v1.0 · Admin</div>
    </div>
    <div class="header-right">
        <span class="who">Sesión: <strong><?= htmlspecialchars($_SESSION['username']) ?></strong></span>
        <span class="chip-admin">Admin</span>
        <a href="logout.php" class="btn-logout">Salir →</a>
    </div>
</header>

<div class="page">

    <div class="section-label">Estadísticas globales</div>

    <div class="stats-row">
        <div class="stat-cell" data-num="01">
            <div class="stat-label">Usuarios</div>
            <div class="stat-value"><?= $totalUsers ?></div>
            <div class="stat-unit">registrados</div>
        </div>
        <div class="stat-cell" data-num="02">
            <div class="stat-label">Partidas</div>
            <div class="stat-value"><?= $totalPartidas ?></div>
            <div class="stat-unit">guardadas</div>
        </div>
        <div class="stat-cell" data-num="03">
            <div class="stat-label">Tiempo jugado</div>
            <div class="stat-value"><?= floor($totalTime / 3600) ?>h <?= floor(($totalTime % 3600) / 60) ?>m</div>
            <div class="stat-unit">total acumulado</div>
        </div>
        <div class="stat-cell" data-num="04">
            <div class="stat-label">Promedio</div>
            <div class="stat-value"><?= $totalUsers > 0 ? round($totalPartidas / $totalUsers, 1) : 0 ?></div>
            <div class="stat-unit">partidas/usuario</div>
        </div>
    </div>

    <div class="section-label">Gestión de usuarios</div>

    <div class="panel">
        <div class="panel-head">
            <h2>Usuarios registrados</h2>
            <div class="panel-head-right">
                <input type="text" class="search-box" id="searchInput" placeholder="Buscar..." onkeyup="filtrarTabla()">
                <button class="btn-add" onclick="mostrarModalAdd()">+ Añadir</button>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th>Partidas</th>
                    <th>Tiempo</th>
                    <th>Niv. máx</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="tablaUsuarios">
                <?php while ($row = $result->fetch_assoc()): ?>
                <tr data-id="<?= $row['id'] ?>" data-username="<?= htmlspecialchars($row['username']) ?>">
                    <td class="col-id">#<?= str_pad($row['id'], 3, '0', STR_PAD_LEFT) ?></td>
                    <td class="col-user"><?= htmlspecialchars($row['username']) ?></td>
                    <td><span class="badge badge-<?= $row['role'] ?>"><?= ucfirst($row['role']) ?></span></td>
                    <td class="col-mono"><?= date('d/m/Y', strtotime($row['created_at'])) ?></td>
                    <td class="col-mono"><?= $row['total_partidas'] ?></td>
                    <td class="col-mono"><?= floor($row['tiempo_total'] / 60) ?>m <?= $row['tiempo_total'] % 60 ?>s</td>
                    <td class="col-mono">Lv.<?= $row['nivel_max'] ?></td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-edit" onclick="editarRol(<?= $row['id'] ?>, '<?= $row['role'] ?>')">Rol</button>
                            <button class="btn btn-reset" onclick="resetStats(<?= $row['id'] ?>)">Reset</button>
                            <button class="btn btn-delete" onclick="eliminarUsuario(<?= $row['id'] ?>, '<?= htmlspecialchars($row['username']) ?>')">Borrar</button>
                        </div>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

</div>

<!-- Modal rol -->
<div class="modal" id="modalRol">
    <div class="modal-box">
        <h3>Editar rol — <span id="modalUsername"></span></h3>
        <div class="modal-field">
            <label>Nuevo rol</label>
            <select id="selectRol">
                <option value="player">Jugador</option>
                <option value="admin">Administrador</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" onclick="cerrarModal('modalRol')">Cancelar</button>
            <button class="btn-modal-ok" onclick="guardarRol()">Guardar cambios</button>
        </div>
    </div>
</div>

<!-- Modal añadir -->
<div class="modal" id="modalAdd">
    <div class="modal-box">
        <h3>Añadir nuevo usuario</h3>
        <div class="modal-field">
            <label>Nombre de usuario</label>
            <input type="text" id="newUsername" placeholder="usuario_nuevo">
        </div>
        <div class="modal-field">
            <label>Contraseña</label>
            <input type="password" id="newPassword" placeholder="••••••••">
        </div>
        <div class="modal-field">
            <label>Rol</label>
            <select id="newRole">
                <option value="player">Jugador</option>
                <option value="admin">Administrador</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn-modal-cancel" onclick="cerrarModal('modalAdd')">Cancelar</button>
            <button class="btn-modal-ok" onclick="guardarUsuario()">Crear usuario</button>
        </div>
    </div>
</div>

<div class="toast" id="toast"></div>

<script>
    let userIdEditando = null;

    function filtrarTabla() {
        const filtro = document.getElementById('searchInput').value.toLowerCase();
        document.querySelectorAll('#tablaUsuarios tr').forEach(fila => {
            fila.style.display = fila.dataset.username.toLowerCase().includes(filtro) ? '' : 'none';
        });
    }

    function mostrarModalAdd() {
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newRole').value = 'player';
        document.getElementById('modalAdd').classList.add('active');
    }

    function editarRol(id, rolActual) {
        userIdEditando = id;
        document.getElementById('modalUsername').textContent =
            document.querySelector(`tr[data-id="${id}"] td:nth-child(2)`).textContent;
        document.getElementById('selectRol').value = rolActual;
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
        if (!username || !password) { toast('Introduce usuario y contraseña', 'error'); return; }
        if (username.length < 3 || password.length < 4) { toast('Usuario: mín. 3 chars · Contraseña: mín. 4 chars', 'error'); return; }
        try {
            const res = await fetch('../php/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const data = await res.json();
            if (data.ok) { toast('Usuario creado correctamente', 'success'); cerrarModal('modalAdd'); setTimeout(() => location.reload(), 1000); }
            else toast(data.error || 'Error al crear usuario', 'error');
        } catch { toast('Error de conexión', 'error'); }
    }

    async function guardarRol() {
        if (!userIdEditando) return;
        const nuevoRol = document.getElementById('selectRol').value;
        try {
            const res = await fetch('../php/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userIdEditando, action: 'updateRole', role: nuevoRol })
            });
            const data = await res.json();
            if (data.ok) { toast('Rol actualizado', 'success'); location.reload(); }
            else toast(data.error || 'Error', 'error');
        } catch { toast('Error de conexión', 'error'); }
        cerrarModal('modalRol');
    }

    async function resetStats(id) {
        if (!confirm('¿Resetear estadísticas de este usuario?')) return;
        try {
            const res = await fetch('../php/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, action: 'resetStats' })
            });
            const data = await res.json();
            if (data.ok) { toast('Estadísticas reseteadas', 'success'); location.reload(); }
            else toast(data.error || 'Error', 'error');
        } catch { toast('Error de conexión', 'error'); }
    }

    async function eliminarUsuario(id, username) {
        if (!confirm(`¿Eliminar a "${username}" permanentemente?`)) return;
        try {
            const res = await fetch('../php/admin.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });
            const data = await res.json();
            if (data.ok) { toast('Usuario eliminado', 'success'); document.querySelector(`tr[data-id="${id}"]`).remove(); }
            else toast(data.error || 'Error', 'error');
        } catch { toast('Error de conexión', 'error'); }
    }

    function toast(msg, tipo) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = `toast toast-${tipo}`;
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => el.classList.remove('show'), 3200);
    }

    ['modalRol', 'modalAdd'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
            if (e.target.id === id) cerrarModal(id);
        });
    });
</script>
</body>
</html>