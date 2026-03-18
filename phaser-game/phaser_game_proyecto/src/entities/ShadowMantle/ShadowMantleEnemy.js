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
        this.setScale(0.1); // 360px * 0.1 = 36px
        // Reducir hitbox de física para que no se meta en las paredes
        this.body.setSize(36, 36);
this.body.setOffset(0, 0);
        this.setOrigin(0, 0); // origen top-left para alinearse al grid de tiles

        this.CELL_SIZE   = 36; // alineado al tamaño real del tile del mapa
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
        this._spd         = 2.5;
        this._imageIndex  = 0;

        // La posición viene del spawner ya alineada al grid (col*36+2, row*36+2)
        this._xprev2 = x;
        this._yprev2 = y;
        // Celda objetivo actual
        this._targetCellX = x;
        this._targetCellY = y;

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
        if (this._spdtimer > 60 && this._spdtimer < 180)
            this._spd = Phaser.Math.Linear(2.5, 1, (this._spdtimer - 60) / 120);
        if (this._spdtimer >= 180)
            this._spd = 1;

        // hurttimer
        if (this._hurttimer > 0) {
            this._hurttimer--;
            if (this._hurttimer > 6) {
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
                this._alivetimer = 600;
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

            if (this._hit === 0) {
                if (this.x === this._xprevious && this._xprevious === this._xprev2 &&
                    this.y === this._yprevious && this._yprevious === this._yprev2)
                    this._cantFindPath = true;
                this._xprev2 = this._xprevious;
                this._yprev2 = this._yprevious;
            }

            // Solo desaparecen al ser golpeados por el jugador, no por tiempo
            // (cantFindPath sigue activo para evitar enemigos completamente atascados)
            if (this._cantFindPath && this._state !== 'disappear')
                this._enterDisappear();

            this._xprevious = this.x;
            this._yprevious = this.y;

            if (this._movecon === 0) {
                if (this._moveType === 0) {
                    // Movimiento aleatorio — elegir dirección libre
                    this._movedir = Phaser.Math.Between(0, 3);
                    for (let i = 0; i < 4; i++) {
                        const off = this.DIRS[this._movedir];
                        const nx  = this.x + off.x * this.CELL_SIZE;
                        const ny  = this.y + off.y * this.CELL_SIZE;
                        if (!this._wouldCollide(nx, ny)) break;
                        this._movedir = (this._movedir + 1) % 4;
                    }
                    // Snapear al grid antes de calcular destino
                    const sx0 = Math.round(this.x / this.CELL_SIZE) * this.CELL_SIZE;
                    const sy0 = Math.round(this.y / this.CELL_SIZE) * this.CELL_SIZE;
                    const off = this.DIRS[this._movedir];
                    this._targetCellX = sx0 + off.x * this.CELL_SIZE;
                    this._targetCellY = sy0 + off.y * this.CELL_SIZE;
                    this._movecon = 1;
                }

                if (this._moveType === 1) {
                    // Persecución — elegir la dirección que más acerca al jugador
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
                        const nx  = this.x + off.x * this.CELL_SIZE;
                        const ny  = this.y + off.y * this.CELL_SIZE;
                        if (!this._wouldCollide(nx, ny)) break;
                        this._movedir = (this._movedir + 1) % 4;
                    }
                    // Snapear al grid antes de calcular destino
                    const sx1 = Math.round(this.x / this.CELL_SIZE) * this.CELL_SIZE;
                    const sy1 = Math.round(this.y / this.CELL_SIZE) * this.CELL_SIZE;
                    const off1 = this.DIRS[this._movedir];
                    this._targetCellX = sx1 + off1.x * this.CELL_SIZE;
                    this._targetCellY = sy1 + off1.y * this.CELL_SIZE;
                    this._movecon = 1;
                }
            }

            if (this._movecon === 1) {
                this._movetimer++;

                // Animar según dirección
                const frameMap = [1, 2, 3, 0];
                this._imageIndex = frameMap[this._movedir];
                this.setTexture(`enemy_walk_${this._imageIndex}`);

                // Mover suavemente hacia la celda objetivo
                const spd = this._spd * 0.8;
                const dx  = this._targetCellX - this.x;
                const dy  = this._targetCellY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= spd) {
                    // Llegó a la celda — snapear exacto y elegir siguiente
                    this.x = this._targetCellX;
                    this.y = this._targetCellY;
                    this._movecon   = 0;
                    this._movetimer = 0;

                    const boss = this.scene.boss;
                    if (boss && boss.hp < 5) this._moveType = 1;
                } else {
                    this.x += (dx / dist) * spd;
                    this.y += (dy / dist) * spd;
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

        this._hurttimer   = 12;
        this.activeHitbox = false;
        this._hitdir      = hitdir;
        this._hit         = 1;

        this._alivetimer = 600;
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
        const TILE = this.CELL_SIZE;
        // Convertir posición mundo a celda del tilemap
        const col = Math.floor(nx / TILE);
        const row = Math.floor(ny / TILE);
        const layer = this.scene.wallsLayer.layer;
        // Fuera del mapa = colisión
        if (row < 0 || row >= layer.data.length) return true;
        if (col < 0 || col >= layer.data[0].length) return true;
        // index <= 0 = libre, cualquier otro = pared
        const tile = layer.data[row][col];
        return tile && tile.index > 0;
    }
}