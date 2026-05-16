import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room8');
    }

    getRoomConfig() {
        return {
            map: 'room8',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
                { x: 167, y: 200 }
            ],
            monsters: [
                
            ],

            doors: {
                 arriba:    { goTo: 'Room7', spawn: { x: 198, y: 288 } },
                abajo:     { goTo: 'Room9', spawn: { x: 198, y: 36  } },
                izquierda: null,
                derecha:   null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}