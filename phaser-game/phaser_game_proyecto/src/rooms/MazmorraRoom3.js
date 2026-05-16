import BaseGameScene from '../scenes/BaseGameScene.js';
import FireBar from '../entities/FireBar.js';

export default class MazmorraRoom3 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom3');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom3',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 3',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
               abajo:     { goTo: 'MazmorraRoom2', spawn: { x: 198, y: 36  } }, 
                izquierda: null,
               derecha:   { goTo: 'MazmorraRoom4', spawn: { x: 36,  y: 162 } }
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