import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room16');
    }

    getRoomConfig() {
        return {
            map: 'room16',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
           
            ],
            monsters: [
                
            ],

            doors: {
              arriba:    null,
               abajo:    null,      
             izquierda: { goTo: 'Room15', spawn: { x: 396, y: 162 } },
               derecha:  null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}