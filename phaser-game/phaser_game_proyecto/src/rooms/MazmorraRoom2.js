import BaseGameScene from '../scenes/BaseGameScene.js';
import FireBar from '../entities/FireBar.js';

export default class MazmorraRoom2 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom2');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom2',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 2',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    { goTo: 'MazmorraRoom3', spawn: { x: 198, y: 288 } },
                abajo:     null,
                izquierda: { goTo: 'MazmorraRoom1', spawn: { x: 396, y: 162 } },
                derecha:   null
            }
        };
    }

    preload() {
        super.preload();
        // Cargar los 3 frames del sprite de fuego
        for (let i = 0; i < 3; i++) {
            this.load.image(
                `firebar_${i}`,
                `/src/assets/sprites/spr_boss/spr_shadow_mantle_fire/spr_shadow_mantle_fire_${i}.png`
            );
        }
    }

    create(data) {
        super.create(data);

        // Cambia x: 200, y: 200 por donde quieras el centro de la barra
        this.fireBar = new FireBar(this, 216, 162, {
            pieces: 5,      // número de bolas
            spacing: 20,    // separación entre bolas
            speed: 1.5,     // velocidad de giro (grados por frame)
            clockwise: true
        });
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.gameIsOver || this.cambiandoRoom) return;

        this.fireBar.update();
        this.fireBar.checkPlayerCollision(
            this.player,
            this.hitSound,
            this._applyKnockback.bind(this)
        );
    }

    getDialogueConfig() {
        return {};
    }
}