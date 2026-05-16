import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom1 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom1');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom1',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 1',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: null,
              derecha:   { goTo: 'MazmorraRoom2', spawn: { x: 36,  y: 162 } }
            }
        };
    }

    create(data) {
        super.create(data);

        // Fade in desde negro al entrar (encendiendo la pantalla)
        this.cameras.main.fadeIn(1500, 0, 0, 0);
    }

    getDialogueConfig() {
        return {};
    }
}