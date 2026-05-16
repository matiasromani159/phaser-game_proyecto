import BaseGameScene from '../scenes/BaseGameScene.js';
import GameState from '../GameState.js';
import MonsterCatSinging from '../entities/MonsterCatSinging.js';
import MonsterSilentCat from '../entities/MonsterSilentCat.js';

export default class MazmorraRoom5 extends BaseGameScene {
    constructor() {
        super('MazmorraRoom5');
    }

    getRoomConfig() {
        return {
            map: 'MazmorraRoom5',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'root_8bit',
            displayName: 'Mazmorra - Sala 5',
            playerSpawn: { x: 100, y: 100 },
            savepoints: [],
            monsters: [],
            doors: {
                arriba:    null,
                abajo:     { goTo: 'MazmorraRoom4', spawn: { x: 198, y: 36  } },
                izquierda: { goTo: 'MazmorraRoom6', spawn: { x: 396, y: 162 } },
                derecha:   { goTo: 'MazmorraRoom8', spawn: { x: 36,  y: 162 } }
            }
        };
    }

    create(data) {
        super.create(data);

        this.puertasCerradas     = false;
        this.singingCatMuerto    = false;
        this._doorsBlockedByGame = false;
        this._silentCatActivo    = -1;
        this._esperandoSiguiente = false;

        const catId = `${this.scene.key}_cat_0`;
        if (!GameState.estaMuerto(catId)) {
            this.singingCat = new MonsterCatSinging(this, 216, 162);
            this.singingCat.deadId = catId;
            this.cats.push(this.singingCat);
            this.monsters.add(this.singingCat);
        } else {
            this.singingCat = null;
            this.singingCatMuerto = true;
        }

        const silentPositions = [
            { x: 90,  y: 54  },
            { x: 342, y: 54  },
            { x: 90,  y: 234 },
            { x: 342, y: 234 },
        ];

        this.silentCats = [];
        silentPositions.forEach((pos, i) => {
            const scId = `${this.scene.key}_silentcat_${i}`;
            if (!GameState.estaMuerto(scId)) {
                const sc = new MonsterSilentCat(this, pos.x, pos.y);
                sc.deadId = scId;
                sc._silentIndex = i;
                sc.aggressive = false;
                sc.wake = false;
                this.silentCats.push(sc);
                this.monsters.add(sc);
            }
        });

        if (this.singingCatMuerto && this.silentCats.length > 0) {
            this._cerrarPuertas(false);
            this._despertarSiguiente();
        }
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.gameIsOver || this.cambiandoRoom) return;

        if (!this.singingCatMuerto && this.singingCat && this.singingCat.isDead) {
            this.singingCatMuerto = true;
            this._cerrarPuertas(true);
            this._despertarSiguiente();
        }

        if (this.puertasCerradas && !this._esperandoSiguiente && this._silentCatActivo >= 0) {
            const activo = this.silentCats[this._silentCatActivo];

            if (!activo) {
                this._silentCatActivo = -1;
                return;
            }

            if (activo.isDead) {
                this._esperandoSiguiente = true;

                this.time.delayedCall(800, () => {
                    this._esperandoSiguiente = false;

                    const todosMuertos = this.silentCats.every(sc => sc.isDead);
                    if (todosMuertos) {
                        this._silentCatActivo = -1;
                        this._abrirPuertas();
                    } else {
                        this._despertarSiguiente();
                    }
                });
            }
        }
    }

    _despertarSiguiente() {
        if (this._silentCatActivo !== -1) {
            const actual = this.silentCats[this._silentCatActivo];
            if (actual && !actual.isDead) return;
        }

        const siguienteIndex = this.silentCats.findIndex(sc => !sc.isDead && !sc.wake && !sc.aggressive);

        if (siguienteIndex !== -1) {
            this._silentCatActivo = siguienteIndex;
            this.silentCats[siguienteIndex].wakeUp();
        } else {
            this._silentCatActivo = -1;
            if (this.puertasCerradas) this._abrirPuertas();
        }
    }

    _cerrarPuertas(conSonido = true) {
        if (this.puertasCerradas) return;
        this.puertasCerradas     = true;
        this._doorsBlockedByGame = true;

        if (conSonido) this.sound.play('snd_board_door_close', { volume: 0.8 });

        // Puerta abajo
        this._ponerTile(5,  8, 498, 'walls');
        this._ponerTile(6,  8, 498, 'walls');

        // Puerta izquierda
        this._ponerTile(0,  3, 449, 'walls');
        this._ponerTile(0,  4, 449, 'walls');
        this._ponerTile(0,  5, 449, 'walls');

        // Puerta derecha
        this._ponerTile(11, 3, 454, 'walls');
        this._ponerTile(11, 4, 454, 'walls');
        this._ponerTile(11, 5, 454, 'walls');
    }

    _abrirPuertas() {
        if (!this.puertasCerradas) return;

        this.puertasCerradas     = false;
        this._doorsBlockedByGame = false;

        this.sound.play('snd_board_door_close', { volume: 0.5 });

        // Puerta abajo
        this._ponerTile(5,  8, 0, 'walls');
        this._ponerTile(6,  8, 0, 'walls');

        // Puerta izquierda
        this._ponerTile(0,  3, 0, 'walls');
        this._ponerTile(0,  4, 0, 'walls');
        this._ponerTile(0,  5, 0, 'walls');

        // Puerta derecha
        this._ponerTile(11, 3, 0, 'walls');
        this._ponerTile(11, 4, 0, 'walls');
        this._ponerTile(11, 5, 0, 'walls');
    }

    _ponerTile(col, fila, tileId, capa = 'walls') {
        const layer = capa === 'ground' ? this.groundLayer : this.wallsLayer;
        if (!layer || !this.map) return;
        if (col < 0 || col >= this.map.width || fila < 0 || fila >= this.map.height) return;

        if (tileId === 0) {
            layer.removeTileAt(col, fila);
            return;
        }

        const tile = layer.putTileAt(tileId, col, fila);
        if (tile) {
            tile.setCollision(tileId === 449 || tileId === 454 || tileId === 498);
        }
    }

    _checkBordes() {
        if (this._doorsBlockedByGame) return;
        super._checkBordes();
    }

    getDialogueConfig() {
        return {};
    }
}