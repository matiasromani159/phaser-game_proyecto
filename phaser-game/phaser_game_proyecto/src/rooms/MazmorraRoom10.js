import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom10 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom10');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom10',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 10',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: null,
                derecha:   { goTo: 'MazmorraRoom11', spawn: { x: 36,  y: 162 } }
            }
        };
    }

    create(data) {
        super.create(data);
       
    }

    getDialogueConfig() {
        return {};
    }
}