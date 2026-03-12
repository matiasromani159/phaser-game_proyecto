/**
 * ShadowMantleEnemy — El enemigo que spawnea Shadow Mantle durante la wave.
 * Conocido como "obj___" en el código original de Deltarune (Toby lo ocultó a propósito).
 *
 * move_type 0 → movimiento celda a celda aleatorio
 * move_type 1 → persecución simple hacia el jugador (navmesh simplificado)
 */
export class ShadowMantleEnemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, moveType = 0) {
        super(scene, x, y, 'enemy_appear_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this.CELL_SIZE   = 32;
        this.isDead      = false;
        this.damage      = 2;
        this.activeHitbox= false;

        this._state       = 'init';
        this._moveType    = moveType;
        this._movecon     = 0;
        this._movetimer   = 0;
        this._movedir     = 1; // 0=der 1=arr 2=izq 3=abj
        this._alivetimer  = 0;
        this._hurttimer   = 0;
        this._hit         = 0;
        this._hitdir      = -1;
        this._cantFindPath= false;
        this._spdtimer    = 0;
        this._spd         = 5;
        this._imageIndex  = 0;

        this._xprev2 = x;
        this._yprev2 = y;

        this.DIRS = [
            { x:  1, y:  0 }, // 0 der
            { x:  0, y: -1 }, // 1 arr
            { x: -1, y:  0 }, // 2 izq
            { x:  0, y:  1 }, // 3 abj
        ];
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._spdtimer++;
        if (this._spdtimer > 120 && this._spdtimer < 360)  // 60*2, 180*2
            this._spd = Math.round(Phaser.Math.Linear(5, 2, (this._spdtimer - 120) / 240));
        if (this._spdtimer >= 360)
            this._spd = 2;

        // hurttimer
        if (this._hurttimer > 0) {
            this._hurttimer--;
            // Retroceder en dirección de golpe
            if (this._hurttimer > 12) {
                const pushDir = this._hitdir;
                const dx = [0,1,0,-1][pushDir] ?? 0;
                const dy = [1,0,-1,0][pushDir] ?? 0;
                for (let i = 0; i < 10; i++) {
                    if (!this._wouldCollide(this.x + dx, this.y + dy))
                        { this.x += dx; this.y += dy; }
                    else break;
                }
            }
            if (this._hurttimer === 0) {
                this._alivetimer = 1200;
                this.activeHitbox = false;
            }
            return;
        }

        // ── Estado init: animación de aparición ───────────────
        if (this._state === 'init') {
            this._imageIndex += 0.25;
            if (this._imageIndex >= 5) {
                this._imageIndex = 0;
                this.setTexture('enemy_walk_0');
                this._state       = 'move';
                this.activeHitbox = true;
            }
            return;
        }

        // ── Estado move ───────────────────────────────────────
        if (this._state === 'move') {
            this._alivetimer++;

            // Comprobar si está atascado
            if (this._hit === 0) {
                if (this.x === this._xprevious && this._xprevious === this._xprev2 &&
                    this.y === this._yprevious && this._yprevious === this._yprev2)
                    this._cantFindPath = true;
                this._xprev2 = this._xprevious;
                this._yprev2 = this._yprevious;
            }

            // Tiempo de vida agotado o no puede encontrar camino
            if ((this._alivetimer >= 600 || this._cantFindPath) && this._state !== 'disappear')
                this._enterDisappear();

            this._xprevious = this.x;
            this._yprevious = this.y;

            if (this._movecon === 0) {
                if (this._moveType === 0) {
                    // Movimiento aleatorio celda a celda
                    this._movedir = Phaser.Math.Between(0, 3);
                    for (let i = 0; i < 4; i++) {
                        const off = this.DIRS[this._movedir];
                        if (this._wouldCollide(this.x + off.x * this.CELL_SIZE, this.y + off.y * this.CELL_SIZE))
                            this._movedir = (this._movedir + 1) % 4;
                        else break;
                    }
                    this._movecon = 1;
                }

                if (this._moveType === 1) {
                    // Persecución simple: elegir la dirección que más se acerca al jugador
                    const player = this.scene.player;
                    const dx     = player.x - this.x;
                    const dy     = player.y - this.y;
                    if (Math.abs(dx) >= Math.abs(dy))
                        this._movedir = dx > 0 ? 0 : 2;
                    else
                        this._movedir = dy > 0 ? 3 : 1;

                    // Si esa dirección choca, intentar las otras
                    for (let i = 0; i < 4; i++) {
                        const off = this.DIRS[this._movedir];
                        if (this._wouldCollide(this.x + off.x * this.CELL_SIZE, this.y + off.y * this.CELL_SIZE))
                            this._movedir = (this._movedir + 1) % 4;
                        else break;
                    }
                    this._movecon = 1;
                }
            }

            if (this._movecon === 1) {
                this._movetimer++;
                const dir  = this.DIRS[this._movedir];
                let   stop = 0;

                for (let i = 0; i < this._spd; i++) {
                    if (stop) break;

                    this.x += dir.x;
                    this.y += dir.y;

                    // Actualizar frame de animación según dirección
                    const frameMap = [1, 2, 3, 0]; // der, arr, izq, abj
                    this._imageIndex = frameMap[this._movedir];
                    this.setTexture(`enemy_walk_${this._imageIndex}`);

                    if (this._wouldCollide(this.x, this.y)) {
                        this.x -= dir.x;
                        this.y -= dir.y;
                        this._movecon   = 0;
                        this._movetimer = 0;
                        stop = 1;
                        break;
                    }

                    const completaCelda =
                        ((this._movedir === 0 || this._movedir === 2) && (Math.round(this.x) % this.CELL_SIZE) === 0) ||
                        ((this._movedir === 1 || this._movedir === 3) && (Math.round(this.y) % this.CELL_SIZE) === 0);

                    if (completaCelda) {
                        this._movecon   = 0;
                        this._movetimer = 0;
                        stop = 1;

                        // Cambiar a move_type 1 si el boss está en dash
                        const boss = this.scene.boss;
                        if (boss && boss.dashcon === 0 && boss.hp >= 5) {
                            // move_type 0, no cambiar
                        } else if (boss && boss.hp < 5) {
                            this._moveType = 1;
                        }
                    }
                }
            }
        }

        // ── Estado disappear ──────────────────────────────────
        if (this._state === 'disappear') {
            this.activeHitbox = false;
            this._imageIndex -= 0.25;

            if (this._imageIndex < 0) {
                this.isDead = true;
                this.destroy();
            }
        }
    }

    // ── Recibir golpe de espada ───────────────────────────────
    takeHit(hitdir) {
        if (this._hurttimer > 0 || this._state === 'disappear') return;

        this._hurttimer   = 24;
        this.activeHitbox = false;
        this._hitdir      = hitdir;
        this._hit         = 1;

        // Tras recibir golpe → disappear
        this._alivetimer = 1200;
        this._enterDisappear();
    }

    _enterDisappear() {
        this._state        = 'disappear';
        this.activeHitbox  = false;
        this._imageIndex   = 5;
        this._movecon      = 0;
        this._movetimer    = 0;
    }

    _wouldCollide(nx, ny) {
        if (!this.scene.wallsLayer) return false;
        const tile = this.scene.wallsLayer.getTileAtWorldXY(nx, ny);
        return tile && tile.collides;
    }
}