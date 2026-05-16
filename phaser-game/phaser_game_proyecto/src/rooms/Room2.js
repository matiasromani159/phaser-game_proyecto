import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room2');
    }

    getRoomConfig() {
        return {
            map: 'room2',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
                { x: 167, y: 200 }
            ],
            monsters: [
                { type: 'monster', x: 300, y: 150 },
                { type: 'monster', x: 200, y: 200 },
            ],

            doors: {
                arriba:    { goTo: 'Room1', spawn: { x: 180, y: 252 } },
                abajo:     null,
                izquierda: null,
                derecha:   { goTo: 'Room3', spawn: { x: 36, y: 162 } }, // entra por el borde izq de Room3
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}