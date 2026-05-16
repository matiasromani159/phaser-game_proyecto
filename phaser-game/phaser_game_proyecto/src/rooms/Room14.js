import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room14');
    }

    getRoomConfig() {
        return {
            map: 'room14',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
           
            ],
            monsters: [
                 { type: 'bluefish', x: 200, y: 200 },
            ],

            doors: {
              arriba:    { goTo: 'Room13', spawn: { x: 198, y: 288 } },
                abajo:   null,      
              izquierda: null,
               derecha:   { goTo: 'Room15', spawn: { x: 36,  y: 162 } },
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}