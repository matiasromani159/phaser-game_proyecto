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

            displayName: 'Room 1',              // ← nombre que aparece en el menú de guardado

            playerSpawn: { x: 200, y: 200 },

            savepoints: [
                { x: 150, y: 150 }              // ← posición del savepoint en el mapa (puedes poner varios)
            ],

            monsters: [
                { x: 100, y: 100 },
                { type: 'flower', x: 300, y: 200 },
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