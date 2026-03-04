/**
 * DialogueSystem — Board estilo Deltarune Chapter 3.
 *
 * La caja aparece arriba o abajo según la posición del jugador.
 * Z solo avanza cuando el texto ha terminado de escribirse.
 *
 * USO:
 *   this.dialogue.show([
 *     "Hola, soy un NPC./",
 *     "Texto \cRrojo\c0 y normal./",
 *     "Lento...^3 rápido."
 *   ]);
 *
 * TAGS:
 *   &  \n   → nueva línea
 *   /       → pausa, espera Z
 *   %%      → fin total
 *   ^1-9    → delay extra
 *   \cR \cB \cY \cG \cW \cP \c0  → colores
 */

export default class DialogueSystem {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} [opts]
     * @param {string}  opts.textSound  - sonido por letra       (default 'snd_board_text_main')
     * @param {string}  opts.endSound   - sonido al terminar      (default 'snd_board_text_main_end')
     * @param {string}  opts.liftSound  - sonido de apertura      (default 'snd_board_lift')
     * @param {number}  opts.rate       - frames entre letras     (default 2)
     * @param {string}  opts.fontFamily - fuente                  (default 'UndertaleFont')
     * @param {number}  opts.fontSize   - tamaño fuente px        (default 16)
     * @param {number}  opts.boxColor   - color fondo caja hex    (default 0x000000)
     * @param {string}  opts.textColor  - color texto             (default '#ffffff')
     */
    constructor(scene, opts = {}) {
        this.scene      = scene;
        this.textSound  = opts.textSound  ?? 'snd_board_text_main';
        this.endSound   = opts.endSound   ?? 'snd_board_text_main_end';
        this.liftSound  = opts.liftSound  ?? 'snd_board_lift';
        this.rate       = opts.rate       ?? 2;
        this.fontFamily = opts.fontFamily ?? 'UndertaleFont';
        this.fontSize   = opts.fontSize   ?? 16;
        this.boxColor   = opts.boxColor   ?? 0x000000;
        this.textColor  = opts.textColor  ?? '#ffffff';

        this._active    = false;
        this._messages  = [];
        this._msgIndex  = 0;
        this._container = null;
        this._writer    = null;
        this._onDone    = null;

        // Dimensiones fieles al original
        this.BOX_W = 383;
        this.BOX_H = 85;

        // Writer empieza en x+18, y+14
        this.WRITER_OFFSET_X = 18;
        this.WRITER_OFFSET_Y = 14;

        // Triángulo en x+362, y+74 relativo al container
        this.TRIANGLE_X = 362;
        this.TRIANGLE_Y = 74;

        this._keyZ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    }

    // ─────────────────────────────────────────────
    // API PÚBLICA
    // ─────────────────────────────────────────────

    show(messages, callback = null) {
        if (this._active) return;
        this._messages = Array.isArray(messages) ? messages : [messages];
        this._msgIndex = 0;
        this._onDone   = callback;
        this._active   = true;
        this._build();
    }

    get isActive() { return this._active; }

    update() {
        if (!this._active || !this._writer) return false;

        // Z solo avanza cuando el texto ha terminado completamente
        const zDown = Phaser.Input.Keyboard.JustDown(this._keyZ);
        if (zDown && !this._writer.typing && this._writer.reachedEnd && this._writer.halted) {
            this._nextMessage();
        }

        this._writer.tick();
        return true;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCCIÓN DEL BOARD
    // ─────────────────────────────────────────────

    _build() {
        const scene = this.scene;
        const cam   = scene.cameras.main;
        const W     = cam.width;
        const H     = cam.height;

        // Side según posición del jugador
        // side 0 = caja arriba, side 1 = caja abajo
        let side = 0;
        if (scene.player && scene.player.y < H / 2) {
            side = 1;
        }
        this._side = side;

        const boxX = (W - this.BOX_W) / 2;

        let startY, endY;
        if (side === 0) {
            startY = -this.BOX_H - 20;
            endY   = 8;
        } else {
            startY = H + this.BOX_H + 20;
            endY   = H - this.BOX_H - 8;
        }

        this._container = scene.add.container(boxX, startY)
            .setScrollFactor(0)
            .setDepth(200);

        // Fondo sin borde, solo fill
        this._bg = scene.add.rectangle(
            this.BOX_W / 2, this.BOX_H / 2,
            this.BOX_W, this.BOX_H,
            this.boxColor, 1
        );
        this._container.add(this._bg);

        // Sonido de apertura con pitch +1.2
        if (scene.cache.audio.exists(this.liftSound))
            scene.sound.play(this.liftSound, { volume: 0.5, detune: 200 });

        // Entrada a velocidad constante (movespeed=16 a 60fps)
        const duration = Math.round((Math.abs(endY - startY) / 16) * (1000 / 60));
        scene.tweens.add({
            targets  : this._container,
            y        : endY,
            duration : duration,
            ease     : 'Linear',
            onComplete: () => this._startWriter()
        });
    }

    _startWriter() {
        if (this._writer) {
            this._writer.destroy();
            this._writer = null;
        }

        const msg = this._messages[this._msgIndex];
        if (!msg) { this._close(); return; }

        this._writer = new BoardWriter(this.scene, this._container, msg, {
            x         : this.WRITER_OFFSET_X,
            y         : this.WRITER_OFFSET_Y,
            maxWidth  : this.BOX_W - this.WRITER_OFFSET_X - 8,
            fontFamily: this.fontFamily,
            fontSize  : this.fontSize,
            textColor : this.textColor,
            rate      : this.rate,
            textSound : this.textSound,
            endSound  : this.endSound,
            boxW      : this.BOX_W,
            boxH      : this.BOX_H,
            triangleX : this.TRIANGLE_X,
            triangleY : this.TRIANGLE_Y,
        });
    }

    _nextMessage() {
        this._msgIndex++;
        if (this._msgIndex >= this._messages.length) {
            this._close();
        } else {
            this._startWriter();
        }
    }

    _close() {
        const scene = this.scene;
        const H     = scene.cameras.main.height;

        const exitY = this._side === 0
            ? -this.BOX_H - 20
            : H + this.BOX_H + 20;

        scene.tweens.add({
            targets  : this._container,
            y        : exitY,
            duration : 200,
            ease     : 'Linear',
            onComplete: () => {
                this._container.destroy();
                this._container = null;
                this._writer    = null;
                this._active    = false;
                if (this._onDone) this._onDone();
            }
        });
    }
}

// ═══════════════════════════════════════════════════════
// BoardWriter — tipeo letra a letra con tags
// ═══════════════════════════════════════════════════════

const COLOR_MAP = {
    R: '#ff4040',
    B: '#4080ff',
    Y: '#ffff00',
    G: '#40ff40',
    W: '#ffffff',
    P: '#cc44ff',
    '0': null   // null = usar textColor por defecto
};

class BoardWriter {
    constructor(scene, container, rawText, opts) {
        this.scene     = scene;
        this.container = container;
        this.opts      = opts;

        this.reachedEnd = false;
        this.halted     = false;
        this.typing     = true;

        this._triangle   = null;
        this._sinerTimer = 0;

        this._tokens  = this._parse(rawText);
        this._pos     = 0;
        this._delay   = 0;

        this._lineH     = opts.fontSize + 4;
        this._lineTexts = [{ x: opts.x, y: opts.y, segments: [] }];
        this._lineObjs  = [[]];

        this._timer = scene.time.addEvent({
            delay        : this._frameToMs(opts.rate),
            loop         : true,
            callback     : this._step,
            callbackScope: this
        });
    }

    // ── Tick desde update() ───────────────────────────────
    tick() {
        if (!this._triangle) return;
        // siner 0-29, visible solo si < 20
        this._sinerTimer = (this._sinerTimer + 1) % 30;
        this._triangle.setVisible(this._sinerTimer < 20);
    }

    destroy() {
        if (this._timer) { this._timer.remove(); this._timer = null; }
        this._lineObjs.forEach(line => line.forEach(o => o.destroy()));
        this._lineObjs = [];
        if (this._triangle) { this._triangle.destroy(); this._triangle = null; }
    }

    // ── Un paso del tipeo ─────────────────────────────────
    _step() {
        if (this._delay > 0) { this._delay--; return; }
        if (this._pos >= this._tokens.length) { this._finish(); return; }

        const tok = this._tokens[this._pos++];

        switch (tok.type) {
            case 'char':
                this._renderChar(tok.char, tok.color);
                if (!tok.silent) this._playSound();
                break;
            case 'newline':
                this._newLine();
                break;
            case 'delay':
                this._delay = tok.amount;
                break;
            case 'halt':
                this.halted     = true;
                this.reachedEnd = true;
                this.typing     = false;
                if (this._timer) { this._timer.remove(); this._timer = null; }
                this._playEndSound();
                this._showTriangle();
                break;
            case 'end':
                this._finish();
                break;
        }
    }

    _finish() {
        if (this._timer) { this._timer.remove(); this._timer = null; }
        this.reachedEnd = true;
        this.typing     = false;
        this.halted     = true;
        this._playEndSound();
        this._showTriangle();
    }

    // ── Render ────────────────────────────────────────────
    _renderChar(char, color) {
        const lastLine = this._lineTexts[this._lineTexts.length - 1];
        const lastSeg  = lastLine.segments[lastLine.segments.length - 1];
        const useColor = color ?? this.opts.textColor;

        if (lastSeg && lastSeg.color === useColor) {
            lastSeg.text += char;
        } else {
            lastLine.segments.push({ text: char, color: useColor });
        }

        this._rebuildLine(this._lineTexts.length - 1);
    }

    _newLine() {
        this._lineTexts.push({
            x       : this.opts.x,
            y       : this.opts.y + this._lineTexts.length * this._lineH,
            segments: []
        });
        this._lineObjs.push([]);
    }

    _rebuildLine(lineIdx) {
        const line = this._lineTexts[lineIdx];

        this._lineObjs[lineIdx].forEach(o => o.destroy());
        this._lineObjs[lineIdx] = [];

        let curX = line.x;
        line.segments.forEach(seg => {
            const txt = this.scene.add.text(curX, line.y, seg.text, {
                fontFamily : this.opts.fontFamily,
                fontSize   : `${this.opts.fontSize}px`,
                color      : seg.color,
                resolution : 10
            }).setScrollFactor(0);

            this.container.add(txt);
            this._lineObjs[lineIdx].push(txt);
            curX += txt.width;
        });
    }

    _showTriangle() {
        if (this._triangle) return;
        this._triangle = this.scene.add.text(
            this.opts.triangleX,
            this.opts.triangleY,
            '▼', {
                fontFamily: this.opts.fontFamily,
                fontSize  : '12px',
                color     : this.opts.textColor,
                resolution: 10
            }
        ).setScrollFactor(0);
        this.container.add(this._triangle);
    }

    _playSound() {
        const key = this.opts.textSound;
        if (this.scene.cache.audio.exists(key))
            this.scene.sound.play(key, { volume: 0.5 });
    }

    _playEndSound() {
        const key = this.opts.endSound;
        if (key && this.scene.cache.audio.exists(key))
            this.scene.sound.play(key, { volume: 0.5 });
    }

    _frameToMs(frames) { return Math.max(1, frames) * (1000 / 60); }

    // ── Parser ────────────────────────────────────────────
    _parse(raw) {
        const tokens = [];
        let i        = 0;
        let color    = null;

        while (i < raw.length) {
            const ch = raw[i];

            if (ch === '`') {
                i++;
                tokens.push({ type: 'char', char: raw[i] ?? '', color });
                i++;
                continue;
            }

            if (ch === '&' || ch === '\n') {
                tokens.push({ type: 'newline' });
                i++;
                continue;
            }

            if (ch === '/') {
                tokens.push({ type: 'halt' });
                i++;
                if (raw[i] === '%') { tokens.push({ type: 'end' }); i++; }
                continue;
            }

            if (ch === '%' && raw[i + 1] === '%') {
                tokens.push({ type: 'end' });
                i += 2;
                continue;
            }

            if (ch === '^') {
                const num = parseInt(raw[i + 1], 10);
                if (!isNaN(num)) {
                    const delayMap = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 30, 6: 40, 7: 60, 8: 90, 9: 150 };
                    tokens.push({ type: 'delay', amount: delayMap[num] ?? 5 });
                    i += 2;
                    continue;
                }
            }

            if (ch === ' ') {
                tokens.push({ type: 'char', char: ' ', color, silent: true });
                i++;
                continue;
            }

            if (ch === '\\' && raw[i + 1] === 'c') {
                const code = raw[i + 2];
                color = COLOR_MAP[code] !== undefined ? COLOR_MAP[code] : null;
                i += 3;
                continue;
            }

            if (ch === '\\') {
                i += 3;
                continue;
            }

            tokens.push({ type: 'char', char: ch, color });
            i++;
        }

        const last = tokens[tokens.length - 1];
        if (!last || (last.type !== 'halt' && last.type !== 'end')) {
            tokens.push({ type: 'halt' });
        }

        return tokens;
    }
}