import BaseGameScene from '../scenes/BaseGameScene.js';

export default class Room2 extends BaseGameScene {
    constructor() {
        super('Room2');
    }

    getRoomConfig() {
        return {
            map: 'room2',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 180, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            monsters: [
                { x: 300, y: 150 },
                { x: 200, y: 200 },
            ],

       doors: {
    arriba:    { goTo: 'Room1', spawn: { x: 180, y: 252 } },
    abajo:     null,
    izquierda: null,
    derecha:   null,
}
        };
    }
}