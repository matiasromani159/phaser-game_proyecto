import BaseGameScene from '../scenes/BaseGameScene.js';

export default class RoomX extends BaseGameScene {
    constructor() {
        super('Room18');
    }

    getRoomConfig() {
        return {
            map: 'room18',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 }, // spawn cerca del hueco de arriba (viene de Room1)

            savepoints: [
           
            ],
            monsters: [
                
            ],

            doors: {
              arriba:    { goTo: 'Room15', spawn: { x: 198, y: 288 } },
               abajo:     { goTo: 'Room18', spawn: { x: 198, y: 36  } },      
              izquierda: null,
               derecha:   null,
            }
        };
    }

    getDialogueConfig() {
        return {};
    }
}