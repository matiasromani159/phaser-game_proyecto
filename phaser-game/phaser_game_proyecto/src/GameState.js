// ─────────────────────────────────────────────────────────────
// GameState.js — Estado global compartido entre todas las escenas
// ─────────────────────────────────────────────────────────────

const GameState = {
    // ── Jugador ──────────────────────────────────
    playerName  : 'KRIS',
    playerLevel : 1,
    playerHP    : 100,
    playerHPMax : 100,

    // ── Progreso ─────────────────────────────────
    segundos      : 0,
    roomActual    : 'Room1',
    playerSpawn   : { x: 200, y: 200 },
    monstersDead  : [],   // array de strings: 'Room1_cat_0', 'MazmorraRoom1_lizard_1', etc.

    // ─────────────────────────────────────────────
    // GUARDAR en localStorage + servidor PHP
    // ─────────────────────────────────────────────
    guardar() {
        const data = {
            playerName  : this.playerName,
            playerLevel : this.playerLevel,
            playerHP    : this.playerHP,
            playerHPMax : this.playerHPMax,
            segundos    : this.segundos,
            roomActual  : this.roomActual,
            playerSpawn : this.playerSpawn,
            monstersDead: this.monstersDead,
            timestamp   : new Date().toISOString()
        };

        // 1. Local (siempre)
        localStorage.setItem('deltarune_save', JSON.stringify(data));

        // 2. Servidor PHP (si está disponible)
        fetch('/php/guardar.php', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => console.log('[Save] Servidor OK:', d))
        .catch(e => console.warn('[Save] Servidor no disponible, guardado local OK:', e));

        return data;
    },

    // ─────────────────────────────────────────────
    // CARGAR desde localStorage
    // ─────────────────────────────────────────────
    cargar() {
        const raw = localStorage.getItem('deltarune_save');
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);
            this.playerName   = data.playerName   ?? 'KRIS';
            this.playerLevel  = data.playerLevel  ?? 1;
            this.playerHP     = data.playerHP     ?? 100;
            this.playerHPMax  = data.playerHPMax  ?? 100;
            this.segundos     = data.segundos     ?? 0;
            this.roomActual   = data.roomActual   ?? 'Room1';
            this.playerSpawn  = data.playerSpawn  ?? { x: 200, y: 200 };
            this.monstersDead = data.monstersDead ?? [];
            return true;
        } catch (e) {
            console.warn('[Save] Error al cargar save:', e);
            return false;
        }
    },

    // ─────────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────────
    haySave() {
        return !!localStorage.getItem('deltarune_save');
    },

    borrarSave() {
        localStorage.removeItem('deltarune_save');
        fetch('/php/borrar.php', { method: 'POST' }).catch(() => {});
    },

    // Registra un monstruo como derrotado
    // id: string único, ej. 'Room1_cat_0'
    matarMonstruo(id) {
        if (!this.monstersDead.includes(id)) {
            this.monstersDead.push(id);
        }
    },

    estaMuerto(id) {
        return this.monstersDead.includes(id);
    }
};

export default GameState;