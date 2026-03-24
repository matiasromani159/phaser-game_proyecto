/**
 * DebugRoomSelector.js
 * Escena de depuración — selector visual de rooms
 * Añádela SOLO en desarrollo. Elimínala o desactívala en producción.
 *
 * USO:
 *   1. Importa y añade "DebugRoomSelector" a tu lista de escenas en Phaser config.
 *   2. Cambia la escena de inicio a 'DebugRoomSelector' mientras depuras.
 *   3. Cuando termines, vuelve a tu escena de inicio normal.
 *
 * EJEMPLO de config:
 *   scene: [DebugRoomSelector, Room1, MazmorraRoom1, SaveScene, GameOverScene, ...]
 */

const IS_DEBUG = true; // ← ponlo en false para deshabilitar sin borrar el archivo

export default class DebugRoomSelector extends Phaser.Scene {

    // ─────────────────────────────────────────────
    // REGISTRA AQUÍ TUS ROOMS
    // ─────────────────────────────────────────────
    getRooms() {
        return [
            // { key: 'NombreEscena', label: 'Texto visible', category: 'Categoría', spawn: {x, y} }
            { key: 'Room1',         label: 'Room 1',            category: 'Superficie', spawn: { x: 200, y: 200 } },
            { key: 'MazmorraRoom1', label: 'Mazmorra - Sala 1', category: 'Mazmorras', spawn: { x: 100, y: 100 } },
            // Añade más rooms aquí...
        ];
    }

    // ─────────────────────────────────────────────
    constructor() {
        super({ key: 'DebugRoomSelector' });
    }

    preload() {
        // Fuente pixel (opcional, usa la tuya si ya la tienes cargada globalmente)
        // Si no tienes UndertaleFont disponible aquí, cambia a 'monospace' abajo
    }

    create() {
        if (!IS_DEBUG) {
            // En producción salta directo a tu primera room real
            this.scene.start('Room1');
            return;
        }

        const W = this.scale.width;
        const H = this.scale.height;

        // ── Fondo ─────────────────────────────────
        this.add.rectangle(0, 0, W, H, 0x0a0a0f).setOrigin(0);

        // Líneas de scanline sutiles
        for (let y = 0; y < H; y += 4) {
            this.add.rectangle(0, y, W, 1, 0x000000, 0.25).setOrigin(0);
        }

        // ── Título ────────────────────────────────
        this.add.text(W / 2, 28, '[ DEBUG ] SELECTOR DE ROOMS', {
            fontFamily : 'UndertaleFont, monospace',
            fontSize   : '14px',
            fill       : '#ff4444',
            letterSpacing: 2,
        }).setOrigin(0.5).setResolution(10);

        this.add.text(W / 2, 50, 'Z / ENTER para entrar  ·  ↑↓ para navegar', {
            fontFamily : 'UndertaleFont, monospace',
            fontSize   : '10px',
            fill       : '#555577',
        }).setOrigin(0.5).setResolution(10);

        // Línea separadora
        this.add.rectangle(W / 2, 64, W - 40, 1, 0x333355).setOrigin(0.5, 0);

        // ── Lista de rooms ────────────────────────
        const rooms      = this.getRooms();
        this.selectedIdx = 0;
        this.roomItems   = [];

        const startY   = 90;
        const itemH    = 28;

        // Agrupa por categoría para el display visual
        let lastCat = null;
        let offsetY = startY;

        rooms.forEach((room, i) => {
            // Cabecera de categoría
            if (room.category !== lastCat) {
                lastCat = room.category;
                this.add.text(30, offsetY, `— ${room.category} —`, {
                    fontFamily : 'UndertaleFont, monospace',
                    fontSize   : '9px',
                    fill       : '#4444aa',
                }).setResolution(10);
                offsetY += 16;
            }

            // Cursor ♥
            const cursor = this.add.text(22, offsetY + itemH / 2, '♥', {
                fontFamily : 'UndertaleFont, monospace',
                fontSize   : '12px',
                fill       : '#ff4444',
            }).setOrigin(0, 0.5).setResolution(10).setAlpha(0);

            // Nombre de la room
            const label = this.add.text(42, offsetY + itemH / 2, room.label, {
                fontFamily : 'UndertaleFont, monospace',
                fontSize   : '13px',
                fill       : '#ccccdd',
            }).setOrigin(0, 0.5).setResolution(10);

            // Key técnica (a la derecha, tenue)
            this.add.text(W - 30, offsetY + itemH / 2, room.key, {
                fontFamily : 'UndertaleFont, monospace',
                fontSize   : '9px',
                fill       : '#333355',
            }).setOrigin(1, 0.5).setResolution(10);

            // Zona interactiva
            const zone = this.add.zone(0, offsetY, W, itemH).setOrigin(0);
            zone.setInteractive();
            zone.on('pointerover',  () => { this.selectedIdx = i; this._updateCursors(); });
            zone.on('pointerdown',  () => { this.selectedIdx = i; this._launchRoom(); });

            this.roomItems.push({ cursor, label, room, y: offsetY });
            offsetY += itemH;
        });

        // ── Teclado ───────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyEnter= this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this._updateCursors();
    }

    update() {
        const rooms = this.roomItems;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIdx = (this.selectedIdx - 1 + rooms.length) % rooms.length;
            this._updateCursors();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIdx = (this.selectedIdx + 1) % rooms.length;
            this._updateCursors();
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.keyZ) ||
            Phaser.Input.Keyboard.JustDown(this.keyEnter)
        ) {
            this._launchRoom();
        }
    }

    _updateCursors() {
        this.roomItems.forEach((item, i) => {
            const selected = i === this.selectedIdx;
            item.cursor.setAlpha(selected ? 1 : 0);
            item.label.setFill(selected ? '#ffffff' : '#ccccdd');
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