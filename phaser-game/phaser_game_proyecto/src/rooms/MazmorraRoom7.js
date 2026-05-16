import BaseGameScene from '../scenes/BaseGameScene.js';
import FireBar from '../entities/FireBar.js';

export default class MazmorraRoom7 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom7');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom7',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 7',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: { goTo: 'MazmorraRoom4', spawn: { x: 396, y: 162 } },
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
    
          // Cerca del bloque superior izquierdo (tile 468 en col 3, fila 2)
// Bloque superior izquierdo
this.fireBar1 = new FireBar(this, 126, 90, {
    pieces: 5, spacing: 20, speed: 1.5, clockwise: true
});

// Bloque inferior derecho
this.fireBar2 = new FireBar(this, 306, 234, {
    pieces: 5, spacing: 20, speed: 1.2, clockwise: false
});
        }

   update(time, delta) {
    super.update(time, delta);
    if (this.gameIsOver || this.cambiandoRoom) return;

    this.fireBar1.update();
    this.fireBar1.checkPlayerCollision(
        this.player,
        this.hitSound,
        this._applyKnockback.bind(this)
    );

    this.fireBar2.update();
    this.fireBar2.checkPlayerCollision(
        this.player,
        this.hitSound,
        this._applyKnockback.bind(this)
    );
}

    getDialogueConfig() {
        return {};
    }
}