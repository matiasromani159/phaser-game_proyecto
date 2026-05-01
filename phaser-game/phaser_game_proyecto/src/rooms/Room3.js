import BaseGameScene from '../scenes/BaseGameScene.js';
import GameState from '../GameState.js';

export default class Room3 extends BaseGameScene {

    constructor() {
        super('Room3');
    }

    preload() {
        super.preload();
        this.load.image('npc_tenna', '/src/assets/sprites/spr_board_npc_tenna_back.png');
    }

    create(data) {
        super.create(data);

        this._npcHablado = GameState.estaVisto('room3_tenna');

        if (!this._npcHablado) {
            this.npc = this.physics.add.staticImage(340, 130, 'npc_tenna');
          this.npc.setScale(2.25);
            this.npc.refreshBody();
            this.physics.add.collider(this.player, this.npc);
        }
    }

    update(time, delta) {
        super.update(time, delta);

        if (!this.npc || this._npcHablado) return;
        if (this.dialogue.isActive) return;

        if (this.player.x >= 233) {
            this._npcHablado = true;
            this.player.blocked = true;
            this.dialogue.show([
                "Dialogo 1./",
                "Dialogo2.%%"
            ], () => {
                this.player.blocked = false;
                GameState.verNpc('room3_tenna');
                this.npc.destroy();
                this.npc = null;
            });
        }
    }

    getRoomConfig() {
        return {
            map: 'room3',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 216, y: 162 },

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: { goTo: 'Room2', spawn: { x: 396, y: 162 } },
                derecha:   { goTo: 'Room4', spawn: { x: 36,  y: 162 } },
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}