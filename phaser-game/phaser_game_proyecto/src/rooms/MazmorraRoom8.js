import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom8 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom8');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom8',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 8',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     { goTo: 'MazmorraRoom10', spawn: { x: 198, y: 36  } },  
                izquierda: { goTo: 'MazmorraRoom5', spawn: { x: 396, y: 162 } },
                derecha:   { goTo: 'MazmorraRoom9', spawn: { x: 36,  y: 162 } },
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