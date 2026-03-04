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
            displayName: 'Room 1',
            playerSpawn: { x: 200, y: 200 },
            savepoints: [
                { x: 150, y: 150 }
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

    create(data) {
        super.create(data); // ← importante, inicializa todo lo del padre

        // Diálogo de prueba al entrar a la room
        this.dialogue.show([
            "Bienvenido a la Room 1./",
            "Este es un \cRmensaje de prueba\c0./",
            "Texto lento...^3 y ya está."
        ]);
    }
}