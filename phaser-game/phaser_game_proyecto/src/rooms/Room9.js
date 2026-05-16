import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room9');
    }

    getRoomConfig() {
        return {
            map: 'room9',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
           
            ],
            monsters: [
                { type: 'flower',  x: 300, y: 200 },
                { type: 'lizard', x: 300, y: 200, lizardType: 1 }, 
            ],

            doors: {
                arriba:    { goTo: 'Room8', spawn: { x: 198, y: 288 } },
                abajo:     null,
                izquierda: { goTo: 'Room11', spawn: { x: 396, y: 162 } },
                derecha:   { goTo: 'Room10', spawn: { x: 36,  y: 162 } },
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}