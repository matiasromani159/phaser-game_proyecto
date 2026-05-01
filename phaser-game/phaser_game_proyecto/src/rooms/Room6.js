import BaseGameScene from '../scenes/BaseGameScene.js';

export default class Room6 extends BaseGameScene {
    constructor() {
        super('Room6');
    }

    getRoomConfig() {
        return {
            map: 'room6',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 198, y: 162 }, // centro, alineado con el hueco vertical

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    { goTo: 'Room5', spawn: { x: 198, y: 288 } }, // borde inferior de Room5
                abajo:     { goTo: 'Room7', spawn: { x: 198, y: 36  } }, // borde superior de Room7
                izquierda: null,
                derecha:   null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}