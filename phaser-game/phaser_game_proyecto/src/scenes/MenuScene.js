import GameState from '../GameState.js';

/**
 * MenuScene — Menú principal estilo Deltarune
 * Opciones: NUEVA PARTIDA / CONTINUAR (si hay save) / OPCIONES (futuro)
 */
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.audio('snd_select', '/src/assets/sounds/snd_select.wav');
        this.load.audio('menu',       '/src/assets/sounds/menu.ogg');
        this.load.image('spr_heart',  '/src/assets/sprites/spr_heart.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.closing = false;
        this.coord   = 0;   // índice de opción seleccionada

        // ── Música ────────────────────────────────
        this.music = this.sound.add('menu', { loop: true, volume: 0.5 });
        this.music.play();
        this.registry.set('currentMusic',    this.music);
        this.registry.set('currentMusicKey', 'menu');

        // ── Sonidos ───────────────────────────────
        this.sndSelect = this.sound.add('snd_select', { volume: 0.7 });

        // ── Fondo ─────────────────────────────────
        this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);

        // ── Título ────────────────────────────────
        this.add.text(W / 2, H * 0.22, 'DELTARUNE', {
            fontFamily: 'UndertaleFont',
            fontSize  : '36px',
            color     : '#ffffff'
        }).setOrigin(0.5).setResolution(10);

        this.add.text(W / 2, H * 0.36, '— Chapter ? —', {
            fontFamily: 'UndertaleFont',
            fontSize  : '14px',
            color     : '#888888'
        }).setOrigin(0.5).setResolution(10);

        // ── Opciones ──────────────────────────────
        const haySave = GameState.haySave();

        this.opciones = [
            { label: 'NUEVA PARTIDA', action: () => this._nuevaPartida() },
        ];

        if (haySave) {
            this.opciones.push({ label: 'CONTINUAR', action: () => this._continuar() });
        }

        // Si hay save, muestra sus datos como subtítulo de CONTINUAR
        this._saveInfo = null;
        if (haySave) {
            try {
                const raw  = localStorage.getItem('deltarune_save');
                this._saveInfo = JSON.parse(raw);
            } catch (_) {}
        }

        const startY  = H * 0.56;
        const stepY   = 32;
        this._btnTexts = [];

        this.opciones.forEach((op, i) => {
            const t = this.add.text(W / 2 + 14, startY + i * stepY, op.label, {
                fontFamily: 'UndertaleFont',
                fontSize  : '18px',
                color     : '#ffffff'
            }).setOrigin(0.5).setResolution(10);
            this._btnTexts.push(t);
        });

        // Subtítulo del save (room + tiempo)
        if (this._saveInfo) {
            const idx     = this.opciones.findIndex(o => o.label === 'CONTINUAR');
            const min     = Math.floor((this._saveInfo.segundos ?? 0) / 60);
            const sec     = (this._saveInfo.segundos ?? 0) % 60;
            const secStr  = sec < 10 ? '0' + sec : String(sec);
            const subtext = `${this._saveInfo.roomActual ?? '???'}  ${min}:${secStr}`;

            this.add.text(W / 2 + 14, startY + idx * stepY + 18, subtext, {
                fontFamily: 'UndertaleFont',
                fontSize  : '10px',
                color     : '#555577'
            }).setOrigin(0.5).setResolution(10);
        }

        // ── Cursor corazón ────────────────────────
        this.heartCursor = this.add.image(
            W / 2 - 50, startY, 'spr_heart'
        ).setOrigin(0.5).setScrollFactor(0);

        // ── Teclado ───────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyEnter= this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this._buffer = 10;
        this._actualizarCursor();

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {
        if (this.closing) return;
        if (this._buffer > 0) { this._buffer--; return; }

        const up    = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down  = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const z     = Phaser.Input.Keyboard.JustDown(this.keyZ);
        const enter = Phaser.Input.Keyboard.JustDown(this.keyEnter);

        if (up) {
            this.coord = (this.coord - 1 + this.opciones.length) % this.opciones.length;
            this.sndSelect.play();
            this._actualizarCursor();
            this._buffer = 6;
        }
        if (down) {
            this.coord = (this.coord + 1) % this.opciones.length;
            this.sndSelect.play();
            this._actualizarCursor();
            this._buffer = 6;
        }
        if (z || enter) {
            this._confirmar();
        }
    }

    _actualizarCursor() {
        const W      = this.scale.width;
        const startY = this.scale.height * 0.56;
        const stepY  = 32;

        this.heartCursor.setY(startY + this.coord * stepY);

        this._btnTexts.forEach((t, i) => {
            t.setColor(i === this.coord ? '#ffffff' : '#666666');
        });
    }

    _confirmar() {
        if (this.closing) return;
        this.closing = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.music.stop();
            this.opciones[this.coord].action();
        });
    }

    _nuevaPartida() {
        // Resetea el estado global
        GameState.playerName   = 'KRIS';
        GameState.playerLevel  = 1;
        GameState.playerHP     = 100;
        GameState.playerHPMax  = 100;
        GameState.segundos     = 0;
        GameState.roomActual   = 'Room1';
        GameState.playerSpawn  = { x: 200, y: 200 };
        GameState.monstersDead = [];

        this.scene.start('Room1', {
            segundos   : 0,
            playerSpawn: { x: 200, y: 200 }
        });
    }

    _continuar() {
        if (!GameState.cargar()) {
            // Si falla la carga, nueva partida
            this._nuevaPartida();
            return;
        }

        this.scene.start(GameState.roomActual, {
            segundos   : GameState.segundos,
            playerSpawn: GameState.playerSpawn
        });
    }
}