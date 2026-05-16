const IS_DEBUG = true;

export default class DebugRoomSelector extends Phaser.Scene {

    constructor() {
        super({ key: 'DebugRoomSelector' });
    }

    preload() {}

    create() {
        if (!IS_DEBUG) {
            this.scene.start('Room1');
            return;
        }

        const W = this.scale.width;
        const H = this.scale.height;

        // ── Fondo ─────────────────────────────────
        this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0);
        for (let y = 0; y < H; y += 4)
            this.add.rectangle(0, y, W, 1, 0x000000, 0.25).setOrigin(0);

        // ── Título ────────────────────────────────
        this.add.text(W / 2, 40, '[ DEBUG ] TELEPORT A ROOM', {
            fontFamily   : 'UndertaleFont, monospace',
            fontSize     : '14px',
            fill         : '#ff4444',
            letterSpacing: 2,
        }).setOrigin(0.5).setResolution(10);

        this.add.text(W / 2, 65, 'Escribe la key de la room y pulsa ENTER', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '10px',
            fill      : '#555577',
        }).setOrigin(0.5).setResolution(10);

        this.add.rectangle(W / 2, 80, W - 40, 1, 0x333355).setOrigin(0.5, 0);

        // ── Campo de texto visual ─────────────────
        const inputBg = this.add.rectangle(W / 2, 120, 200, 28, 0x1a1a2e)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x4444aa);

        this._inputText = this.add.text(W / 2, 120, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '14px',
            fill      : '#ffffff',
        }).setOrigin(0.5).setResolution(10);

        // Cursor parpadeante
        this._cursor = this.add.text(W / 2 + this._inputText.width / 2 + 2, 120, '_', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '14px',
            fill      : '#ff4444',
        }).setOrigin(0, 0.5).setResolution(10);

        // ── Historial / sugerencias ────────────────
        this._history = this.registry.get('debug_room_history') || [];
        this._historyIndex = -1;
        this._suggestions = [];

        this._suggestionText = this.add.text(W / 2, 155, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '10px',
            fill      : '#666688',
        }).setOrigin(0.5).setResolution(10);

        // ── Lista de rooms conocidas (para autocompletar) ─
        this._knownRooms = [
            'MenuScene',
            'Room1', 'Room2', 'Room3', 'Room4', 'Room5',
            'Room6', 'Room7', 'Room8', 'Room9', 'Room13',
            'Room14', 'Room15', 'Room18',
            'MazmorraRoom1', 'MazmorraRoom5', 'MazmorraRoom9', 'MazmorraRoom13',
            'BossScene',
        ];

        // ── Mensaje de estado ─────────────────────
        this._statusText = this.add.text(W / 2, 190, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '10px',
            fill      : '#ff4444',
        }).setOrigin(0.5).setResolution(10);

        // ── Controles ───────────────────────────────
        this.add.text(W / 2, H - 50, [
            'ENTER      →  Teletransportar',
            '↑ / ↓      →  Historial / Sugerencias',
            'ESC        →  Borrar todo',
            'BACKSPACE  →  Borrar último carácter',
        ].join('\n'), {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '9px',
            fill      : '#444466',
            align     : 'center',
            lineSpacing: 4,
        }).setOrigin(0.5).setResolution(10);

        // ── Input de teclado ────────────────────────
        this._buffer = '';
        this._cursorVisible = true;
        this._cursorTimer = 0;

        this.input.keyboard.on('keydown', (event) => this._onKeyDown(event));

        this._updateSuggestions();
    }

    update(time) {
        // Cursor parpadeante
        this._cursorTimer += 1;
        if (this._cursorTimer > 30) {
            this._cursorTimer = 0;
            this._cursorVisible = !this._cursorVisible;
            this._cursor.setAlpha(this._cursorVisible ? 1 : 0);
        }
    }

    _onKeyDown(event) {
        const key = event.key;

        // ── Confirmar teleport ─────────────────────
        // SOLO ENTER confirma. La Z ya no interfiere con la escritura.
        if (key === 'Enter') {
            this._launchRoom(this._buffer.trim());
            return;
        }

        // ── Navegar historial / sugerencias ────────
        if (key === 'ArrowUp') {
            if (this._suggestions.length > 0 && this._historyIndex === -1) {
                this._historyIndex = 0;
                this._buffer = this._suggestions[0];
            } else if (this._historyIndex < this._suggestions.length - 1) {
                this._historyIndex++;
                this._buffer = this._suggestions[this._historyIndex];
            } else if (this._history.length > 0) {
                const idx = Math.min(this._historyIndex + 1, this._history.length - 1);
                if (idx !== this._historyIndex) {
                    this._historyIndex = idx;
                    this._buffer = this._history[this._history.length - 1 - idx];
                }
            }
            this._updateDisplay();
            return;
        }

        if (key === 'ArrowDown') {
            if (this._historyIndex > -1) {
                this._historyIndex--;
                if (this._historyIndex === -1) {
                    this._buffer = '';
                } else if (this._historyIndex < this._suggestions.length) {
                    this._buffer = this._suggestions[this._historyIndex];
                } else {
                    this._buffer = this._history[this._history.length - 1 - this._historyIndex];
                }
                this._updateDisplay();
            }
            return;
        }

        // ── Borrar todo ────────────────────────────
        if (key === 'Escape') {
            this._buffer = '';
            this._historyIndex = -1;
            this._updateDisplay();
            return;
        }

        // ── Borrar carácter ────────────────────────
        if (key === 'Backspace') {
            this._buffer = this._buffer.slice(0, -1);
            this._historyIndex = -1;
            this._updateDisplay();
            return;
        }

        // Ignorar teclas de control (Shift, Ctrl, Alt, etc.)
        if (key.length > 1 || event.ctrlKey || event.altKey || event.metaKey) return;

        // ── Añadir carácter al buffer ──────────────
        // Ahora la Z se escribe normalmente junto con cualquier letra/número
        if (/^[a-zA-Z0-9_-]$/.test(key)) {
            this._buffer += key;
            this._historyIndex = -1;
            this._updateDisplay();
        }
    }

    _updateDisplay() {
        this._inputText.setText(this._buffer);
        this._cursor.setPosition(
            this._inputText.x + this._inputText.width / 2 + 2,
            this._cursor.y
        );
        this._updateSuggestions();
        this._statusText.setText('');
    }

    _updateSuggestions() {
        const query = this._buffer.toLowerCase();
        
        if (query.length === 0) {
            this._suggestions = [];
            this._suggestionText.setText('');
            return;
        }

        // Filtrar rooms conocidas que coincidan
        this._suggestions = this._knownRooms
            .filter(room => room.toLowerCase().includes(query))
            .slice(0, 5);

        if (this._suggestions.length > 0) {
            const text = this._suggestions.map((r, i) => 
                i === 0 ? `\cY${r}\c0` : r
            ).join('  ·  ');
            this._suggestionText.setText(`Sugerencias: ${text}`);
        } else {
            this._suggestionText.setText('Sin coincidencias en rooms conocidas');
        }
    }

    _launchRoom(roomKey) {
        if (!roomKey) {
            this._statusText.setText('Escribe una room primero');
            return;
        }

        // Guardar en historial
        if (!this._history.includes(roomKey)) {
            this._history.unshift(roomKey);
            if (this._history.length > 10) this._history.pop();
            this.registry.set('debug_room_history', this._history);
        }

        // Fade out y teleport
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(roomKey, {
                segundos    : 0,
                playerSpawn : { x: 200, y: 200 },
                fromDebug   : true,
            });
        });
    }
}