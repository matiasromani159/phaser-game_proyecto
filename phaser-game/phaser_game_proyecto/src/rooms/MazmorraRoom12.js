import BaseGameScene from '../scenes/BaseGameScene.js';

export default class MazmorraRoom12 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom12');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom12',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 12',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba: null,
                abajo: null,
                izquierda: { goTo: 'MazmorraRoom11', spawn: { x: 396, y: 234 } },
                derecha: { goTo: 'MazmorraRoom13', spawn: { x: 36, y: 234 } }
            }
        };
    }

    create(data) {
        super.create(data);

    }

    getDialogueConfig() {
        return {};
    }
}