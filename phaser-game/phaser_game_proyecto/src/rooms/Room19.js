import BaseGameScene from '../scenes/BaseGameScene.js';
import GameState from '../GameState.js';

export default class Room19 extends BaseGameScene {
    constructor() {
        super('Room19');
    }

    getRoomConfig() {
        return {
            map: 'room19',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',

            playerSpawn: { x: 216, y: 108 },

            savepoints: [],
            monsters: [],

            doors: {
                arriba:    { goTo: 'Room18', spawn: { x: 198, y: 288 } },
                abajo:     null,
                izquierda: null,
                derecha:   null,
            },

            boat:       { x: 216, y: 108 },
            docks: [
                { x: 198, y: 522 },
            ],
        };
    }

    create(data) {
        super.create(data);

        this._puertaAbierta = GameState.puertaRoom19Abierta ?? false;
        this._transicionAMazmorraActiva = false;

        if (this._puertaAbierta) {
            this.groundLayer.putTileAt(120, 1, 15);
        } else {
            this._puertaX = 54;
            this._puertaY = 558;
        }
    }

    _interactuarConPuerta() {
    const debugBypass = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L).isDown;

    if (!GameState.tieneLlave && !debugBypass) {
        this.dialogue.show([
            'La puerta está cerrada.^2 Necesitas una llave./%%'
        ]);
        return;
    }

    this.dialogue.show([
        '\cY[ Usaste la LLAVE ]\c0/',
        'La puerta se ha abierto.^2../%%'
    ], () => {
        GameState.tieneLlave = false;
        GameState.puertaRoom19Abierta = true;
        this._puertaAbierta = true;

        const tile = this.groundLayer.putTileAt(120, 1, 15);
        
        // Sonido de puerta al mismo tiempo que el smoke puff
        this.sound.play('snd_board_door_close', { volume: 0.8 });
        this._spawnSmokePuff(1 * 36 + 18, 15 * 36 + 18);

        this.time.delayedCall(1000, () => {
            this._iniciarTransicionAMazmorra();
        });
    });
}

    _iniciarTransicionAMazmorra() {
        if (this._transicionAMazmorraActiva) return;
        this._transicionAMazmorraActiva = true;

        // Reproducir sonido de escape una sola vez
        this.sound.play('snd_escape', { volume: 0.8 });

        // Desvanecimiento MANUAL con overlay negro (más largo y visible)
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(9999);
        overlay.setAlpha(0);

        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 1500,  // Más lento para que se note
            ease: 'Power2',
            onComplete: () => {
                if (this.timerEvent) this.timerEvent.remove();
                this.scene.start('MazmorraRoom1', {
                    segundos: this.segundos,
                    playerSpawn: { x: 100, y: 100 }
                });
            }
        });
    }

    // Sobreescribimos _estaCercaDeNpc para detectar la puerta
    _estaCercaDeNpc() {
        if (this._puertaAbierta) return false;
        return Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this._puertaX, this._puertaY
        ) < 60;
    }

    _interactuarConNpc() {
        this._interactuarConPuerta();
    }

    getDialogueConfig() {
        return {};
    }
}