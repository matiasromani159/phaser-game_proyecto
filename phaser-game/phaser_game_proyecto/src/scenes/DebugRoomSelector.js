const IS_DEBUG = true;

export default class DebugRoomSelector extends Phaser.Scene {

    getRooms() {
        return [
            { key: 'Room1',         label: 'Room 1',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'MazmorraRoom1', label: 'Mazmorra - Sala 1', category: 'Mazmorras',  spawn: { x: 100, y: 100 } },
            { key: 'Room2',         label: 'Room 2',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room3',         label: 'Room 3',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room4',         label: 'Room 4',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room5',         label: 'Room 5',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room6',         label: 'Room 6',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room7',         label: 'Room 7',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room8',         label: 'Room 8',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'Room9',         label: 'Room 9',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'BossScene',     label: 'Boss — Shadow Mantle', category: 'Jefes',   spawn: { x: 216, y: 270 } },
        ];
    }

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
        this.add.text(W / 2, 28, '[ DEBUG ] SELECTOR DE ROOMS', {
            fontFamily   : 'UndertaleFont, monospace',
            fontSize     : '14px',
            fill         : '#ff4444',
            letterSpacing: 2,
        }).setOrigin(0.5).setResolution(10);

        this.add.text(W / 2, 50, 'Z / ENTER para entrar  ·  ↑↓ para navegar  ·  rueda para hacer scroll', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize  : '10px',
            fill      : '#555577',
        }).setOrigin(0.5).setResolution(10);

        this.add.rectangle(W / 2, 64, W - 40, 1, 0x333355).setOrigin(0.5, 0);

        // ── Zona de clip (máscara para el scroll) ─
        const LIST_TOP  = 72;
        const LIST_BOT  = H - 16;
        const LIST_H    = LIST_BOT - LIST_TOP;

        // Contenedor scrolleable
        this._listContainer = this.add.container(0, LIST_TOP);

        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillRect(0, LIST_TOP, W, LIST_H);
        this._listContainer.setMask(maskShape.createGeometryMask());

        // ── Lista de rooms ────────────────────────
        const rooms    = this.getRooms();
        this.selectedIdx = 0;
        this.roomItems   = [];

        const itemH  = 26;
        let offsetY  = 8; // relativo al container
        let lastCat  = null;

        rooms.forEach((room, i) => {
            if (room.category !== lastCat) {
                lastCat = room.category;
                const catLabel = this.add.text(30, offsetY, `— ${room.category} —`, {
                    fontFamily: 'UndertaleFont, monospace',
                    fontSize  : '9px',
                    fill      : '#4444aa',
                }).setResolution(10);
                this._listContainer.add(catLabel);
                offsetY += 16;
            }

            const cursor = this.add.text(22, offsetY + itemH / 2, '♥', {
                fontFamily: 'UndertaleFont, monospace',
                fontSize  : '12px',
                fill      : '#ff4444',
            }).setOrigin(0, 0.5).setResolution(10).setAlpha(0);

            const label = this.add.text(42, offsetY + itemH / 2, room.label, {
                fontFamily: 'UndertaleFont, monospace',
                fontSize  : '13px',
                fill      : '#ccccdd',
            }).setOrigin(0, 0.5).setResolution(10);

            const keyText = this.add.text(W - 30, offsetY + itemH / 2, room.key, {
                fontFamily: 'UndertaleFont, monospace',
                fontSize  : '9px',
                fill      : '#333355',
            }).setOrigin(1, 0.5).setResolution(10);

            // Zona interactiva — en coordenadas de pantalla, se recalcula con scroll
            const zone = this.add.zone(0, LIST_TOP + offsetY, W, itemH).setOrigin(0);
            zone.setInteractive();
            zone.on('pointerover', () => { this.selectedIdx = i; this._updateCursors(); });
            zone.on('pointerdown', () => { this.selectedIdx = i; this._launchRoom(); });

            this._listContainer.add([cursor, label, keyText]);
            this.roomItems.push({ cursor, label, zone, room, localY: offsetY, itemH });
            offsetY += itemH;
        });

        // ── Scroll ────────────────────────────────
        this._scrollY    = 0;
        this._totalH     = offsetY;
        this._listTop    = LIST_TOP;
        this._listH      = LIST_H;
        this._maxScroll  = Math.max(0, this._totalH - LIST_H);

        this.input.on('wheel', (_p, _go, _dx, deltaY) => {
            this._doScroll(deltaY * 0.5);
        });

        // Scrollbar visual
        this._scrollbarBg   = this.add.rectangle(W - 6, LIST_TOP, 3, LIST_H, 0x222244).setOrigin(0.5, 0);
        this._scrollbarThumb = this.add.rectangle(W - 6, LIST_TOP, 3, 20,    0x4444aa).setOrigin(0.5, 0);
        this._updateScrollbar();

        // ── Teclado ───────────────────────────────
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keyZ     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this._updateCursors();
    }

    // ── Scroll helpers ────────────────────────────
    _doScroll(delta) {
        this._scrollY = Phaser.Math.Clamp(this._scrollY + delta, 0, this._maxScroll);
        this._listContainer.y = this._listTop - this._scrollY;

        // Recolocar zonas interactivas (están fuera del container)
        this.roomItems.forEach(item => {
            item.zone.y = this._listTop + item.localY - this._scrollY;
        });

        this._updateScrollbar();
    }

    _updateScrollbar() {
        if (this._maxScroll <= 0) {
            this._scrollbarBg.setVisible(false);
            this._scrollbarThumb.setVisible(false);
            return;
        }
        const ratio      = this._listH / this._totalH;
        const thumbH     = Math.max(20, this._listH * ratio);
        const thumbRange = this._listH - thumbH;
        const thumbY     = this._listTop + (this._scrollY / this._maxScroll) * thumbRange;

        this._scrollbarThumb.setSize(3, thumbH).setY(thumbY);
    }

    // ── Selección y navegación ────────────────────
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIdx = (this.selectedIdx - 1 + this.roomItems.length) % this.roomItems.length;
            this._updateCursors();
            this._scrollToSelected();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIdx = (this.selectedIdx + 1) % this.roomItems.length;
            this._updateCursors();
            this._scrollToSelected();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyZ) ||
            Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
            this._launchRoom();
        }
    }

    // Asegura que el item seleccionado esté visible al navegar con teclado
    _scrollToSelected() {
        const item    = this.roomItems[this.selectedIdx];
        if (!item) return;
        const itemTop = item.localY;
        const itemBot = item.localY + item.itemH;
        const margin  = 10;

        if (itemTop - this._scrollY < margin)
            this._doScroll(itemTop - this._scrollY - margin);
        else if (itemBot - this._scrollY > this._listH - margin)
            this._doScroll(itemBot - this._scrollY - this._listH + margin);
    }

    _updateCursors() {
        this.roomItems.forEach((item, i) => {
            const sel = i === this.selectedIdx;
            item.cursor.setAlpha(sel ? 1 : 0);
            item.label.setFill(sel ? '#ffffff' : '#ccccdd');
        });
    }

    _launchRoom() {
        const item = this.roomItems[this.selectedIdx];
        if (!item) return;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(item.room.key, {
                segundos    : 0,
                playerSpawn : item.room.spawn,
                fromDebug   : true,
            });
        });
    }
}