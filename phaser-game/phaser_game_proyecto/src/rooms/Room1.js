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
                { type: 'monster', x: 100, y: 100 },
                //{ type: 'flower',  x: 300, y: 200 },
                //{ type: 'spear',   x: 300, y: 100 },

             //    { type: 'lizard', x: 200, y: 200 },                // type 0 — camina + dispara pellets
    { type: 'lizard', x: 300, y: 200, lizardType: 1 }, // type 1 — salta + rayos en 8 dirs
   // { type: 'lizard', x: 400, y: 200, lizardType: 2 }, // type 2 — salta cerca del jugador
            ],
            doors: {
                arriba:    null,
               abajo: { goTo: 'BossScene', spawn: { x: 200, y: 150 } },
                izquierda: null,
                derecha:   null,
            }
        };
    }

    create(data) {
        super.create(data);

        // Diálogo al entrar por primera vez
      /*  if (!this.registry.get('room1_intro')) {
            this.registry.set('room1_intro', true);
            this.dialogue.show(["Bienvenido a la Room 1./"]);
        }*/
    }

    abrirSaveMenu() {
        if (!this.registry.get('savepoint_room1_seen')) {
            this.registry.set('savepoint_room1_seen', true);
            this.dialogue.show([
                "Una luz cálida te rodea./",
                "Sientes que podrías \cYdescansar\c0 aquí.^2 O no quien sabe, continua.  O no quien sabe, continua./"
            ], () => super.abrirSaveMenu());
            return;
        }

        super.abrirSaveMenu();
    }
}