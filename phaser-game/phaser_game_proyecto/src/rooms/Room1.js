import BaseGameScene from '../scenes/BaseGameScene.js';

export default class Room1 extends BaseGameScene {
    constructor() {
        super('Room1');
    }

    getRoomConfig() {
        return {
            map: 'room1',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 200, y: 200 },

            monsters: [
                { x: 100, y:100 },              // Monster normal (sin type)
                { type: 'flower', x: 300, y: 200 }, // Flor
            ],

            doors: {
                arriba:    null,
                abajo:     { goTo: 'Room2', spawn: { x: 180, y: 36 } },
                izquierda: null,
                derecha:   null,
            }
        };
    }
}