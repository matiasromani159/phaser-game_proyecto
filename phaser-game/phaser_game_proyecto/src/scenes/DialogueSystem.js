/**
 * DialogueSystem — Board estilo Deltarune Chapter 3.
 *
 * La caja aparece arriba o abajo según la posición del jugador.
 * Z solo avanza cuando el texto ha terminado de escribirse.
 * Wrap automático de texto según el ancho de la caja.
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
        this._closing   = false;
        this._messages  = [];
        this._msgIndex  = 0;
        this._container = null;
        this._writer    = null;
        this._onDone    = null;

        const camW           = scene.cameras.main.width;
        this.BOX_W           = camW - 16;
        this.BOX_H           = Math.max(70, this.fontSize * 4);
        this.WRITER_OFFSET_X = 18;
        this.WRITER_OFFSET_Y = Math.round(this.BOX_H * 0.15);
        this.TRIANGLE_X      = this.BOX_W - 20;
        this.TRIANGLE_Y      = this.BOX_H - 12;

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
        this._closing  = false;
        this._build();
    }

    get isActive() { return this._active; }

    update() {
        if (!this._active) return false;
        if (this._closing) return true;
        if (!this._writer) return false;

        const zDown = Phaser.Input.Keyboard.JustDown(this._keyZ);
        if (zDown && !this._writer.typing && this._writer.reachedEnd && this._writer.halted) {
            this._nextMessage();
            return true;
        }

        if (this._writer) this._writer.tick();
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

        let side = 0;
        if (scene.player && scene.player.y < H / 2) side = 1;
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

        this._bg = scene.add.rectangle(
            this.BOX_W / 2, this.BOX_H / 2,
            this.BOX_W, this.BOX_H,
            this.boxColor, 1
        );
        this._container.add(this._bg);

        if (scene.cache.audio.exists(this.liftSound))
            scene.sound.play(this.liftSound, { volume: 0.5, detune: 200 });

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

        const maxWidth = this.BOX_W - this.WRITER_OFFSET_X - 18;

        this._writer = new BoardWriter(this.scene, this._container, msg, {
            x         : this.WRITER_OFFSET_X,
            y         : this.WRITER_OFFSET_Y,
            maxWidth  : maxWidth,
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
        if (this._writer) {
            this._writer.destroy();
            this._writer = null;
        }

        this._closing = true;

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
                this._closing   = false;
                this._active    = false;
                if (this._onDone) this._onDone();
            }
        });
    }
}

// ═══════════════════════════════════════════════════════
// BoardWriter — tipeo letra a letra con tags y word wrap
// ═══════════════════════════════════════════════════════

const COLOR_MAP = {
    R: '#ff4040',
    B: '#4080ff',
    Y: '#ffff00',
    G: '#40ff40',
    W: '#ffffff',
    P: '#cc44ff',
    '0': null
};

// Cache global de anchos medidos
const _charWidthCache = {};

/**
 * Mide el ancho del carácter MÁS ANCHO de la fuente usando Phaser.
 * Usar el máximo en vez del promedio garantiza que ningún carácter
 * desborde el borde de la caja.
 */
function _medirCharWidth(scene, fontFamily, fontSize) {
    const key = `${fontFamily}_${fontSize}`;
    if (_charWidthCache[key]) return _charWidthCache[key];

    const chars = 'WMQABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const probe = scene.add.text(-9999, -9999, ' ', {
        fontFamily, fontSize: `${fontSize}px`, resolution: 10
    });

    let maxW = 0;
    for (const c of chars) {
        probe.setText(c);
        if (probe.width > maxW) maxW = probe.width;
    }
    probe.destroy();

    _charWidthCache[key] = maxW;
    return maxW;
}

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

        // ── Usar medición real con objeto Phaser temporal ─────
        this._charWidth = _medirCharWidth(scene, opts.fontFamily, opts.fontSize);

        this._tokens  = this._parseWithWrap(rawText);
        this._pos     = 0;
        this._delay   = 0;

        this._lineH     = opts.fontSize + 6;
        this._lineTexts = [{ x: opts.x, y: opts.y, segments: [] }];
        this._lineObjs  = [[]];

        this._timer = scene.time.addEvent({
            delay        : this._frameToMs(opts.rate),
            loop         : true,
            callback     : this._step,
            callbackScope: this
        });
    }

    tick() {
        if (!this._triangle) return;
        this._sinerTimer = (this._sinerTimer + 1) % 30;
        this._triangle.setVisible(this._sinerTimer < 20);
    }

    destroy() {
        if (this._timer) { this._timer.remove(); this._timer = null; }
        this._lineObjs.forEach(line => line.forEach(o => o.destroy()));
        this._lineObjs = [];
        if (this._triangle) { this._triangle.destroy(); this._triangle = null; }
    }

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

    _parseWithWrap(raw) {
        const words  = this._splitWords(raw);
        const tokens = [];
        const maxW   = this.opts.maxWidth;
        const cw     = this._charWidth;

        let lineWidth = 0;

        words.forEach(word => {
            if (word.type === 'control') {
                tokens.push(word.token);
                if (word.token.type === 'newline' || word.token.type === 'halt') {
                    lineWidth = 0;
                }
                return;
            }

            // Medir palabra completa carácter a carácter con el ancho máximo medido
            const wordWidth = word.chars.reduce((acc, c) => {
                return acc + (c.char === ' ' ? cw * 0.4 : cw);
            }, 0);

            if (lineWidth > 0 && lineWidth + wordWidth > maxW) {
                tokens.push({ type: 'newline' });
                lineWidth = 0;
            }

            word.chars.forEach(c => {
                tokens.push(c);
                lineWidth += c.char === ' ' ? cw * 0.4 : cw;
            });
        });

        const last = tokens[tokens.length - 1];
        if (!last || (last.type !== 'halt' && last.type !== 'end')) {
            tokens.push({ type: 'halt' });
        }

        return tokens;
    }

    _splitWords(raw) {
        const result    = [];
        let i           = 0;
        let color       = null;
        let currentWord = null;

        const flushWord = () => {
            if (currentWord && currentWord.chars.length > 0) {
                result.push(currentWord);
                currentWord = null;
            }
        };

        const addChar = (char, col, silent = false) => {
            if (!currentWord) currentWord = { type: 'text', chars: [] };
            currentWord.chars.push({ type: 'char', char, color: col, silent });
            if (char === ' ') flushWord();
        };

        while (i < raw.length) {
            const ch = raw[i];

            if (ch === '`') {
                i++;
                addChar(raw[i] ?? '', color);
                i++;
                continue;
            }

            if (ch === '&' || ch === '\n') {
                flushWord();
                result.push({ type: 'control', token: { type: 'newline' } });
                i++;
                continue;
            }

            if (ch === '/') {
                flushWord();
                result.push({ type: 'control', token: { type: 'halt' } });
                i++;
                if (raw[i] === '%') {
                    result.push({ type: 'control', token: { type: 'end' } });
                    i++;
                }
                continue;
            }

            if (ch === '%' && raw[i + 1] === '%') {
                flushWord();
                result.push({ type: 'control', token: { type: 'end' } });
                i += 2;
                continue;
            }

            if (ch === '^') {
                const num = parseInt(raw[i + 1], 10);
                if (!isNaN(num)) {
                    const delayMap = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 30, 6: 40, 7: 60, 8: 90, 9: 150 };
                    flushWord();
                    result.push({ type: 'control', token: { type: 'delay', amount: delayMap[num] ?? 5 } });
                    i += 2;
                    continue;
                }
            }

            if (ch === ' ') {
                addChar(' ', color, true);
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

            addChar(ch, color);
            i++;
        }

        flushWord();
        return result;
    }
}