import BaseGameScene from '../scenes/BaseGameScene.js';

export default class Room18 extends BaseGameScene {
    constructor() {
        super('Room18');
    }

    getRoomConfig() {
        return {
            map: 'room18',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 100, y: 100 },

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    null,
                abajo:     { goTo: 'Room19', spawn: { x: 198, y: 36  } },  
                izquierda: null,
                derecha:   null,
            },

            // Barco en el agua (columna 5, fila 6 → x:198, y:216)
            boat: { x: 234, y: 198 },

        boatBounds: { x: 180, y: 216, w: 72, h: 108 }, // área del agua en píxele

            // Muelles justo en el borde del agua
            docks: [
               { x: 198, y: 198 },// muelle izquierdo (columna 4, fila 5)
               
            ],
        };
    }

    getDialogueConfig() {
        return {};
    }
}