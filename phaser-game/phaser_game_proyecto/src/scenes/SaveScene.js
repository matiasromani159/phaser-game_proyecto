/**
 * SaveScene — UI fiel a Deltarune (escala d=2).
 *
 * data desde BaseGameScene:
 *   callerScene, segundos, playerHP, roomName, playerName, playerLevel
 */
export default class SaveScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SaveScene' });
    }

    preload() {
        if (!this.textures.exists('spr_heart'))
            this.load.image('spr_heart', '/src/assets/sprites/spr_heart.png');
        if (!this.cache.audio.exists('snd_save'))
            this.load.audio('snd_save', '/src/assets/sounds/snd_save.wav');
        if (!this.cache.audio.exists('snd_select'))
    this.load.audio('snd_select', '/src/assets/sounds/snd_select.wav');
    }

    create(data) {
        this.selectSound = this.sound.add('snd_select', { volume: 0.7 });
        this.callerScene = data?.callerScene ?? 'GameScene';
        this.segundos    = data?.segundos    ?? 0;
        this.playerHP    = data?.playerHP    ?? 100;
        this.roomName    = data?.roomName    ?? 'Unknown';
        this.playerName  = data?.playerName  ?? 'KRIS';
        this.playerLevel = data?.playerLevel ?? 1;

        this.coord   = 0;   // 0=SAVE  1=RETURN  2=post-guardado
        this.buffer  = 10;
        this.closing = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        this._buildUI();
        //this.cameras.main.fadeIn(250, 0, 0, 0);
    }

    update() {
        if (this.closing) return;
        if (this.buffer > 0) { this.buffer--; return; }

        const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
        const z     = Phaser.Input.Keyboard.JustDown(this.keyZ);
        const x     = Phaser.Input.Keyboard.JustDown(this.keyX);

        if (x) { this._cerrar(); return; }

        if (this.coord === 2) {
            if (z) this._cerrar();
            return;
        }

        if (left || right) {
            this.coord = this.coord === 0 ? 1 : 0;
            this._moverCursor();
            this.buffer = 5;
        }

        if (z) {
            if (this.coord === 0) this._guardar();
            else                  this._cerrar();
        }
    }

    // ─────────────────────────────────────────────
    // HELPER: crea texto con fuente y resolución correctas
    // ─────────────────────────────────────────────
    _addText(x, y, text, style) {
        return this.add.text(x, y, text, style)
            .setScrollFactor(0)
            .setResolution(10);
    }

    _buildUI() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const d = 2;

        // Caja GML: (54,49) -> (265,135)  →  con d=2: 422x172px
        const boxW = (265 - 54) * d;
        const boxH = (135 - 49) * d;
        const ox   = (W - boxW) / 2;
        const oy   = (H - boxH) / 2;

        // Convierte coords GML → canvas
        const px = n => ox + (n - 54) * d;
        const py = n => oy + (n - 49) * d;

        // Overlay oscuro
        this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.55).setScrollFactor(0);
        // Borde blanco
        this.add.rectangle(ox+boxW/2, oy+boxH/2, boxW+6, boxH+6, 0xffffff).setScrollFactor(0);
        // Relleno negro
        this.add.rectangle(ox+boxW/2, oy+boxH/2, boxW, boxH, 0x000000).setScrollFactor(0);
        // Borde interior (GML inner: 64,59 -> 255,125)
        const g = this.add.graphics().setScrollFactor(0);
        g.lineStyle(2, 0x000000, 1);
        g.strokeRect(px(64), py(59), (255-64)*d, (125-59)*d);

        const style = {
            fontFamily: 'UndertaleFont',
            fontSize  : `${14*d}px`,
            color     : '#ffffff'
        };

        const min    = Math.floor(this.segundos / 60);
        const sec    = this.segundos % 60;
        const secStr = sec < 10 ? '0' + sec : String(sec);

        // Posiciones sacadas directamente del Draw GML
        this.nameText = this._addText(px(70),  py(60), this.playerName,     style);
        this._addText(px(175), py(60), `LV ${this.playerLevel}`,            style);
        this._addText(px(210), py(60), `${min}:${secStr}`,                  style);
        this._addText(px(70),  py(80), this.roomName,                       style);

        this.btnSave   = this._addText(px(85),  py(110), 'SAVE',   style);
        this.btnReturn = this._addText(px(175), py(110), 'RETURN', style);

        this.savedText = this._addText(
            px(85), py(110), 'File saved.',
            { ...style, color: '#ffff00' }
        ).setVisible(false);

        // Cursor corazón: coord 0->(71,113)  coord 1->(161,113)
        this.heartPos = [
            { x: px(71),  y: py(113) },
            { x: px(161), y: py(113) }
        ];
        this.heartCursor = this.add.image(
            this.heartPos[0].x, this.heartPos[0].y, 'spr_heart'
        ).setOrigin(0, 0).setScrollFactor(0);

        this._actualizarEstado();
    }

    _actualizarEstado() {
        if (this.coord === 2) {
            this.nameText.setColor('#ffff00');
            this.btnSave.setVisible(false);
            this.btnReturn.setVisible(false);
            this.savedText.setVisible(true);
            this.heartCursor.setVisible(false);
        } else {
            this.nameText.setColor('#ffffff');
            this.btnSave.setVisible(true).setColor(this.coord === 0 ? '#ffffff' : '#888888');
            this.btnReturn.setVisible(true).setColor(this.coord === 1 ? '#ffffff' : '#888888');
            this.savedText.setVisible(false);
            this.heartCursor
                .setVisible(true)
                .setPosition(this.heartPos[this.coord].x, this.heartPos[this.coord].y);
        }
    }

   _moverCursor() {
    this.selectSound.play(); // ← aquí
    this.tweens.add({
        targets : this.heartCursor,
        x       : this.heartPos[this.coord].x,
        duration: 60,
        ease    : 'Power1'
    });
    this._actualizarEstado();
}
    _guardar() {
        if (this.cache.audio.exists('snd_save'))
            this.sound.play('snd_save', { volume: 0.7 });

        const saveData = {
            playerName : this.playerName,
            playerLevel: this.playerLevel,
            playerHP   : this.playerHP,
            roomName   : this.callerScene,
            roomDisplay: this.roomName,
            segundos   : this.segundos,
            timestamp  : new Date().toISOString()
        };

        localStorage.setItem('deltarune_save', JSON.stringify(saveData));

        fetch('/php/guardar.php', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(saveData)
        })
        .then(r => r.json())
        .then(d => console.log('Guardado en servidor:', d))
        .catch(e => console.warn('Servidor no disponible. Local OK:', e));

        this.coord  = 2;
        this.buffer = 8;
        this._actualizarEstado();
    }

    _cerrar() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop('SaveScene');
    this.scene.resume(this.callerScene);
}
}