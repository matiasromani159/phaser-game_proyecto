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
                derecha:   null
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}