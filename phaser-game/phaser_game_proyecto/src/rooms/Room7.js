import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room7');
    }

    getRoomConfig() {
        return {
            map: 'room7',
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
                arriba:    null,
                abajo:     { goTo: 'Room8', spawn: { x: 198, y: 36  } },
                izquierda: null,
                derecha:   null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}