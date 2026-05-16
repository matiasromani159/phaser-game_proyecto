import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom9 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom9');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom9',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 9',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,  // empieza cerrada, se abre tras el diálogo
                izquierda: { goTo: 'Room8', spawn: { x: 396, y: 162 } },
                derecha:   null
            }
        };
    }

    preload() {
        super.preload();
        this.load.image('spr_board_deer', '/src/assets/sprites/spr_board_deer.png');
    }

    create(data) {
        super.create(data);

        this._puertaAbajoAbierta = false;
        this._npcHablado = false;

        // ── NPC ciervo ──────────────────────────────────────────────
        this.npc = this.physics.add.sprite(346, 162, 'spr_board_deer');
        this.npc.setImmovable(true);
        this.npc.body.allowGravity = false;
        this.npc.setDepth(5);

        const scale = 36 / this.npc.height;
        this.npc.setScale(scale);

        this.physics.add.collider(this.player, this.npc);
    }

    getDialogueConfig() {
        return {};
    }

    _interactuarConNpc() {
        if (this._npcHablado) return;

        this.dialogue.show(
            [
                "..../",
                "Ves como extiende las manos^2 y...^5/",
                "*CLONK*/%%"
            ],
            () => {
                this._abrirPuertaAbajo();
                this._cerrarPuertaIzquierda();
                this._desaparecerNpc();
            }
        );

        this._npcHablado = true;
    }

    // ── Abre la puerta de abajo (fila 8, cols 5-6) ─────────────────
    _abrirPuertaAbajo() {
    this._ponerTile(5, 8, 450, 'ground'); // reemplaza en capa ground
    this._ponerTile(6, 8, 450, 'ground');
    this._ponerTile(5, 8, 0,   'walls');  // quita el tile de pared
    this._ponerTile(6, 8, 0,   'walls');

    this.sound.play('snd_board_door_close', { volume: 0.5 });
    this._spawnSmokePuff(5 * 36 + 18, 8 * 36 + 18);
    this._spawnSmokePuff(6 * 36 + 18, 8 * 36 + 18);

    this._puertaAbajoAbierta = true;
}

    // ── Cierra la puerta izquierda (col 0, filas 3-5) ──────────────
    _cerrarPuertaIzquierda() {
        this._ponerTile(0, 3, 449, 'walls');
        this._ponerTile(0, 4, 449, 'walls');
        this._ponerTile(0, 5, 449, 'walls');

        this._spawnSmokePuff(18, 3 * 36 + 18);
        this._spawnSmokePuff(18, 4 * 36 + 18);
        this._spawnSmokePuff(18, 5 * 36 + 18);
    }

    // ── NPC desaparece con smoke puff ──────────────────────────────
    _desaparecerNpc() {
        if (!this.npc) return;
        this._spawnSmokePuff(this.npc.x, this.npc.y);
        this.time.delayedCall(300, () => {
            if (this.npc) { this.npc.destroy(); this.npc = null; }
        });
    }

    // ── Utility: igual que Room5 ────────────────────────────────────
    _ponerTile(col, fila, tileId, capa = 'walls') {
        const layer = capa === 'ground' ? this.groundLayer : this.wallsLayer;
        if (!layer || !this.map) return;
        if (col < 0 || col >= this.map.width || fila < 0 || fila >= this.map.height) return;

        if (tileId === 0) {
            layer.removeTileAt(col, fila);
            return;
        }

        const tile = layer.putTileAt(tileId, col, fila);
        if (tile) tile.setCollision(true);
    }

    // ── Bordes: puerta abajo solo si fue desbloqueada ───────────────
    _checkBordes() {
        const p      = this.player;
        const mapH   = this.map.heightInPixels;
        const margen = 36;

        if (this._puertaAbajoAbierta && p.y > mapH - margen) {
            this._activarPuerta({ goTo: 'MazmorraRoom10', spawn: { x: 198, y: 36 } });
        }

        if (p.x < margen) {
            // Solo puede pasar si la puerta izquierda no fue cerrada
            if (!this._npcHablado) {
                this._activarPuerta({ goTo: 'Room8', spawn: { x: 396, y: 162 } });
            }
        }
    }
}