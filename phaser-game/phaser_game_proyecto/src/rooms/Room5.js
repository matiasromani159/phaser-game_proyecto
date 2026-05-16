import BaseGameScene from '../scenes/BaseGameScene.js';
import GameState from '../GameState.js';

export default class Room5 extends BaseGameScene {
    constructor() {
        super('Room5');
    }

    preload() {
        super.preload();
        this.load.image('npc_tenna_back', '/src/assets/sprites/spr_board_npc_tenna_back.png');
        this.load.image('npc_tenna_0', '/src/assets/sprites/spr_board_npc_tenna/spr_board_npc_tenna_0.png');
        this.load.image('npc_tenna_1', '/src/assets/sprites/spr_board_npc_tenna/spr_board_npc_tenna_1.png');
    }

    create(data) {
        super.create(data);

        if (!this.anims.exists('npc_tenna_idle')) {
            this.anims.create({
                key      : 'npc_tenna_idle',
                frames   : [{ key: 'npc_tenna_0' }, { key: 'npc_tenna_1' }],
                frameRate: 4,
                repeat   : -1
            });
        }

        this._npcHablado       = GameState.estaVisto('room5_tenna');
        this._npcFase2         = this._npcHablado;
        this._npcInteracciones = 0;

        if (!this._npcHablado) {
            this.npc = this.physics.add.staticSprite(340, 130, 'npc_tenna_back');
        } else {
            this.npc = this.physics.add.staticSprite(340, 130, 'npc_tenna_0');
        }

        this.npc.setScale(2.25);
        this.npc.refreshBody();
        this.physics.add.collider(this.player, this.npc);
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.npc) return;
        if (this.dialogue.isActive) return;

        const cerca = this.player.x >= 233;

        // ── Fase 1: diálogo automático por proximidad ─────────
        if (!this._npcHablado && cerca) {
            this._npcHablado = true;
            this.player.blocked = true;

            this.dialogue.show(["Dialogo 1./"], () => {
                this.npc.setTexture('npc_tenna_0');
                this.npc.play('npc_tenna_idle');
                this.npc.refreshBody();

                this.dialogue.showQueued(["Dialogo 2./"], () => {
                    this.npc.anims.stop();
                    this.npc.setTexture('npc_tenna_0');

                    this.dialogue.showQueued(["Dialogo 3./", "Dialogo 4.%%"], () => {
                        this.player.blocked = false;
                        GameState.verNpc('room5_tenna');
                        this._npcFase2 = true;
                    });
                });
            });
        }
    }

    // ── Override: Z cerca del NPC ─────────────────────────────
    _interactuarConNpc() {
        if (!this._npcFase2) return;
        if (this.dialogue.isActive) return;

        this.player.blocked = true;
        this._npcInteracciones++;

        const dialogos = [
            ["Dialogo unico 1.%%"],
            ["Dialogo unico 2.%%"],
            ["Dialogo unico 3.%%"],
        ];

        const idx = Math.min(this._npcInteracciones - 1, dialogos.length - 1);

        this.dialogue.show(dialogos[idx], () => {
            this.player.blocked = false;
        });
    }

    getRoomConfig() {
        return {
            map: 'room5',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 216, y: 162 },

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    null,
                abajo:     { goTo: 'Room6', spawn: { x: 198, y: 36  } },
                izquierda: { goTo: 'Room4', spawn: { x: 396, y: 162 } },
                derecha:   null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}