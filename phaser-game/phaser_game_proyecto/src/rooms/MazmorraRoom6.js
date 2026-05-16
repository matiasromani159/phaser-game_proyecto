import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom6 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom6');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom6',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 6',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: null,
                derecha:   { goTo: 'MazmorraRoom5', spawn: { x: 36,  y: 162 } }
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