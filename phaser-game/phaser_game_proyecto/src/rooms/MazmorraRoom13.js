import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom13 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom13');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom13',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 13',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: { goTo: 'MazmorraRoom12', spawn: { x: 396, y: 162 } },
                derecha:   { goTo: 'MazmorraRoom13', spawn: { x: 36,  y: 162 } }
            }
        };
    }

    preload() {
        super.preload();
        this.load.image('spr_board_b3s_sewer', '/src/assets/sprites/spr_board_b3s_sewer.png');
    }

    create(data) {
        super.create(data);

        this.alcantarilla = this.add.image(324, 198, 'spr_board_b3s_sewer');
        this.alcantarilla.setDisplaySize(72, 36);
        this.alcantarilla.setDepth(1);

        // Zona de trigger invisible sobre la alcantarilla
        this._alcantarillaZone = this.add.zone(324, 198, 60, 36);
        this.physics.world.enable(this._alcantarillaZone);
        this._alcantarillaZone.body.allowGravity = false;
        this._alcantarillaZone.body.immovable = true;
        this._alcantarillaTriggered = false;

        this.physics.add.overlap(this.player, this._alcantarillaZone, () => {
            if (this._alcantarillaTriggered || this.cambiandoRoom) return;
            this._alcantarillaTriggered = true;
            this.cambiandoRoom = true;

            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('BossScene', {
                    segundos:    this.segundos,
                    playerSpawn: { x: 216, y: 270 },
                    introOscura: true   // <-- flag para la intro oscura
                });
            });
        });
    }

    getDialogueConfig() {
        return {};
    }
}