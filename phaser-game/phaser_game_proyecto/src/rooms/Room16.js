import BaseGameScene from '../scenes/BaseGameScene.js';
import GameState from '../GameState.js';

export default class Room16 extends BaseGameScene {
    constructor() {
        super('Room16');
    }

    getRoomConfig() {
        return {
            map: 'room16',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 234, y: 200 },

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: { goTo: 'Room15', spawn: { x: 396, y: 162 } },
                derecha:   null,
            }
        };
    }

   preload() {
    super.preload();
    this.load.image('spr_lanino_glasses', '/src/assets/sprites/snd_board_lanino_glasses.png');
    this.load.audio('snd_board_shine_get', '/src/assets/sounds/snd_board_shine_get.wav');
    this.load.image('spr_key', '/src/assets/sprites/spr_key.png');
}

create(data) {
    super.create(data);

    if (GameState.tieneLlave) return;

  this.npc = this.physics.add.staticImage(360, 180, 'spr_lanino_glasses');
this.npc.setFlipX(true);
this.npc.setDepth(5);
this.npc.setScale(2);
this.npc.setSize(this.npc.width, this.npc.height); // fuerza el tamaño del body
this.npc.refreshBody();

this.physics.add.collider(this.player, this.npc);
}

_interactuarConNpc() {
    if (GameState.tieneLlave) {
        this.dialogue.show(['Ya tienes la llave.^2 Ve al norte./%%']);
        return;
    }

    if (!this._yaHablo) {
        this._yaHablo = true;
        this.dialogue.show([
            'Ah, por fin alguien.^2 Llevaba mucho tiempo aquí esperando./',
            'Hay una puerta al norte que nadie ha podido abrir./',
            'Yo tenía la llave... pero ya no tengo fuerzas para llegar./',
            'Tómala tú.^3 Seguro que sabes qué hacer con ella./%%'
        ], () => {
            this._animarEntregaLlave();
        });
    }
}

_animarEntregaLlave() {
    const keySprite = this.add.image(this.npc.x, this.npc.y - 20, 'spr_key');
    keySprite.setDepth(10);
    keySprite.setDisplaySize(36, 36);

    // Flota hacia arriba y vuelve, 2 veces
    this.tweens.add({
        targets: keySprite,
        y: this.npc.y - 60,
        duration: 1200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
            this.sound.play('snd_board_shine_get', { volume: 0.7 });

            // Humo donde está la llave y desaparece
            this._spawnSmokePuff(keySprite.x, keySprite.y);
            keySprite.destroy();

            // Diálogo de obtención, el NPC sigue ahí
            this.dialogue.show([
                '\cY[ Conseguiste una LLAVE ]\c0/%%'
            ], () => {
                GameState.tieneLlave = true;
            });
        }
    });
}
    getDialogueConfig() {
        return {};
    }
}