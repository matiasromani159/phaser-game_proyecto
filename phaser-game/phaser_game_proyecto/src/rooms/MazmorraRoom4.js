import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom4 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom4');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom4',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 4',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
              arriba:    { goTo: 'MazmorraRoom5', spawn: { x: 198, y: 288 } },
                abajo:     null,   
                
izquierda: { goTo: 'MazmorraRoom3', spawn: { x: 396, y: 162 } },

                 derecha:   { goTo: 'MazmorraRoom7', spawn: { x: 36,  y: 162 } }
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