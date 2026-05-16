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
    monstersDead  : [],
    npcsVistos    : [],

    // ── Inventario / Puertas ──────────────────────
    tieneLlave          : false,
    puertaRoom19Abierta : false,

    // ── Barco ─────────────────────────────────────
    enBarco       : false,

    guardar() {
        const data = {
            playerName          : this.playerName,
            playerLevel         : this.playerLevel,
            playerHP            : this.playerHP,
            playerHPMax         : this.playerHPMax,
            segundos            : this.segundos,
            roomActual          : this.roomActual,
            playerSpawn         : this.playerSpawn,
            monstersDead        : this.monstersDead,
            npcsVistos          : this.npcsVistos,
            enBarco             : this.enBarco,
            tieneLlave          : this.tieneLlave,
            puertaRoom19Abierta : this.puertaRoom19Abierta,
            timestamp           : new Date().toISOString()
        };

        localStorage.setItem('deltarune_save', JSON.stringify(data));

        fetch('/php/guardar.php', {
            method : 'POST',
             credentials: 'include', 
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => console.log('[Save] Servidor OK:', d))
        .catch(e => console.warn('[Save] Servidor no disponible, guardado local OK:', e));

        return data;
    },

    cargar() {
        const raw = localStorage.getItem('deltarune_save');
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);
            this.playerName          = data.playerName          ?? 'KRIS';
            this.playerLevel         = data.playerLevel         ?? 1;
            this.playerHP            = data.playerHP            ?? 100;
            this.playerHPMax         = data.playerHPMax         ?? 100;
            this.segundos            = data.segundos            ?? 0;
            this.roomActual          = data.roomActual          ?? 'Room1';
            this.playerSpawn         = data.playerSpawn         ?? { x: 200, y: 200 };
            this.monstersDead        = data.monstersDead        ?? [];
            this.npcsVistos          = data.npcsVistos          ?? [];
            this.enBarco             = data.enBarco             ?? false;
            this.tieneLlave          = data.tieneLlave          ?? false;
            this.puertaRoom19Abierta = data.puertaRoom19Abierta ?? false;
            return true;
        } catch (e) {
            console.warn('[Save] Error al cargar save:', e);
            return false;
        }
    },

    haySave() {
        return !!localStorage.getItem('deltarune_save');
    },

    borrarSave() {
        localStorage.removeItem('deltarune_save');
        fetch('/php/borrar.php', { method: 'POST' }).catch(() => {});
    },

    matarMonstruo(id) {
        if (!this.monstersDead.includes(id)) this.monstersDead.push(id);
    },

    estaMuerto(id) {
        return this.monstersDead.includes(id);
    },

    verNpc(id) {
        if (!this.npcsVistos.includes(id)) this.npcsVistos.push(id);
    },

    estaVisto(id) {
        return this.npcsVistos.includes(id);
    }
};

export default GameState;