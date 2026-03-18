/**
 * ShadowMantleEnemy — El enemigo que spawnea Shadow Mantle durante la wave.
 * Conocido como "obj___" en el código original de Deltarune (Toby lo ocultó a propósito).
 *
 * move_type 0 → movimiento celda a celda aleatorio
 * move_type 1 → persecución simple hacia el jugador (navmesh simplificado)
 *
 * Animaciones ajustadas a 60fps (GML corría a 30fps, todos los incrementos x0.5):
 *   GML: image_index += 0.25 por frame a 30fps
 *   Aquí: _imageIndex  += 0.125 por frame a 60fps
 *   → misma duración real: 5 / 0.25 = 20 frames GML = 40 frames Phaser
 */
export class ShadowMantleEnemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, moveType = 0) {
        super(scene, x, y, 'enemy_appear_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(0.1);
        this.body.setSize(36, 36);
        this.body.setOffset(0, 0);
        this.setOrigin(0, 0);

        this.CELL_SIZE    = 36;
        this.isDead       = false;
        this.damage       = 2;
        this.activeHitbox = false;

        this._state        = 'init';
        this._moveType     = moveType;
        this._movecon      = 0;
        this._movetimer    = 0;
        this._movedir      = 1;
        this._alivetimer   = 0;
        this._hurttimer    = 0;
        this._hit          = 0;
        this._hitdir       = -1;
        this._cantFindPath = false;
        this._spdtimer     = 0;
        this._spd          = 2.5;

        // _imageIndex es un float que avanza 0.125/frame (= 0.25/frame a 30fps)
        // Se usa para seleccionar el frame correcto del sprite de aparición/desaparición
        this._imageIndex   = 0;

        this._xprev2      = x;
        this._yprev2      = y;
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

        // ── Velocidad progresiva (igual que GML, ajustada a 60fps) ──
        // GML: spdtimer > 60 && < 180 a 30fps → > 120 && < 360 a 60fps
        this._spdtimer++;
        if (this._spdtimer > 120 && this._spdtimer < 360)
            this._spd = Phaser.Math.Linear(2.5, 1, (this._spdtimer - 120) / 240);
        if (this._spdtimer >= 360)
            this._spd = 1;

        // ── hurttimer ────────────────────────────────────────
        // GML: hurttimer = 12 a 30fps → 24 a 60fps (ya se setea en takeHit)
        if (this._hurttimer > 0) {
            this._hurttimer--;
            if (this._hurttimer > 12) { // GML > 6 → > 12 a 60fps
                const pushDir = this._hitdir;
                const dx = [0, 1, 0, -1][pushDir] ?? 0;
                const dy = [1, 0, -1,  0][pushDir] ?? 0;
                for (let i = 0; i < 10; i++) {
                    if (!this._wouldCollide(this.x + dx, this.y + dy))
                        { this.x += dx; this.y += dy; }
                    else break;
                }
            }
            if (this._hurttimer === 0) {
                this._alivetimer  = 600;
                this.activeHitbox = false;
            }
            return;
        }

        // ─────────────────────────────────────────────────────
        // ESTADO: init — animación de surgir del suelo
        // GML: image_index += 0.25 @ 30fps → 0.125 @ 60fps
        //      frames enemy_appear_0..4 (índices 0-4)
        //      al llegar a 5 → cambiar a sprite de caminar
        // ─────────────────────────────────────────────────────
        if (this._state === 'init') {
            this._imageIndex += 0.125; // 0.25 GML × 0.5 = 0.125 Phaser

            // Mostrar el frame correcto de la animación de aparición
            const frame = Math.min(Math.floor(this._imageIndex), 4);
            this.setTexture(`enemy_appear_${frame}`);

            if (this._imageIndex >= 5) {
                // Aparición completa — pasar a estado de movimiento
                this._imageIndex  = 0;
                this._state       = 'move';
                this.activeHitbox = true;
                this.setTexture('enemy_walk_0');
            }
            return;
        }

        // ─────────────────────────────────────────────────────
        // ESTADO: move
        // ─────────────────────────────────────────────────────
        if (this._state === 'move') {
            this._alivetimer++;

            if (this._hit === 0) {
                if (this.x === this._xprevious && this._xprevious === this._xprev2 &&
                    this.y === this._yprevious && this._yprevious === this._yprev2)
                    this._cantFindPath = true;
                this._xprev2 = this._xprevious;
                this._yprev2 = this._yprevious;
            }

            if (this._cantFindPath && this._state !== 'disappear')
                this._enterDisappear();

            this._xprevious = this.x;
            this._yprevious = this.y;

            if (this._movecon === 0) {
                if (this._moveType === 0) {
                    this._movedir = Phaser.Math.Between(0, 3);
                    for (let i = 0; i < 4; i++) {
                        const off = this.DIRS[this._movedir];
                        const nx  = this.x + off.x * this.CELL_SIZE;
                        const ny  = this.y + off.y * this.CELL_SIZE;
                        if (!this._wouldCollide(nx, ny)) break;
                        this._movedir = (this._movedir + 1) % 4;
                    }
                    const sx0 = Math.round(this.x / this.CELL_SIZE) * this.CELL_SIZE;
                    const sy0 = Math.round(this.y / this.CELL_SIZE) * this.CELL_SIZE;
                    const off = this.DIRS[this._movedir];
                    this._targetCellX = sx0 + off.x * this.CELL_SIZE;
                    this._targetCellY = sy0 + off.y * this.CELL_SIZE;
                    this._movecon = 1;
                }

                if (this._moveType === 1) {
                    const player = this.scene.player;
                    const dx     = player.x - this.x;
                    const dy     = player.y - this.y;
                    if (Math.abs(dx) >= Math.abs(dy))
                        this._movedir = dx > 0 ? 0 : 2;
                    else
                        this._movedir = dy > 0 ? 3 : 1;

                    for (let i = 0; i < 4; i++) {
                        const off = this.DIRS[this._movedir];
                        const nx  = this.x + off.x * this.CELL_SIZE;
                        const ny  = this.y + off.y * this.CELL_SIZE;
                        if (!this._wouldCollide(nx, ny)) break;
                        this._movedir = (this._movedir + 1) % 4;
                    }
                    const sx1  = Math.round(this.x / this.CELL_SIZE) * this.CELL_SIZE;
                    const sy1  = Math.round(this.y / this.CELL_SIZE) * this.CELL_SIZE;
                    const off1 = this.DIRS[this._movedir];
                    this._targetCellX = sx1 + off1.x * this.CELL_SIZE;
                    this._targetCellY = sy1 + off1.y * this.CELL_SIZE;
                    this._movecon = 1;
                }
            }

            if (this._movecon === 1) {
                this._movetimer++;

                const frameMap = [1, 2, 3, 0];
                this.setTexture(`enemy_walk_${frameMap[this._movedir]}`);

                const spd  = this._spd * 0.8;
                const dx   = this._targetCellX - this.x;
                const dy   = this._targetCellY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= spd) {
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

        // ─────────────────────────────────────────────────────
        // ESTADO: disappear — animación de hundirse en el suelo
        // GML: empieza en image_index = 5, resta 0.25 @ 30fps
        //      → resta 0.125 @ 60fps
        //      frames enemy_appear_4..0 (al revés)
        // ─────────────────────────────────────────────────────
        if (this._state === 'disappear') {
            this.activeHitbox = false;
            this._imageIndex -= 0.125; // 0.25 GML × 0.5 = 0.125 Phaser

            if (this._imageIndex > 0) {
                // Mostrar frame de desaparición en orden inverso
                const frame = Math.min(Math.floor(this._imageIndex), 4);
                this.setTexture(`enemy_appear_${frame}`);
            } else {
                // Desaparición completa
                this.isDead = true;
                this.destroy();
            }
        }
    }

    // ── Recibir golpe de espada ───────────────────────────────
    takeHit(hitdir) {
        if (this._hurttimer > 0 || this._state === 'disappear') return;

        // GML: hurttimer = 12 @ 30fps → 24 @ 60fps
        this._hurttimer   = 24;
        this.activeHitbox = false;
        this._hitdir      = hitdir;
        this._hit         = 1;

        this._alivetimer = 600;
        this._enterDisappear();
    }

    _enterDisappear() {
        this._state       = 'disappear';
        this.activeHitbox = false;
        // GML empieza disappear en image_index = 5 → aquí igual,
        // el loop de disappear irá bajando de 5 a 0
        this._imageIndex  = 5;
        this._movecon     = 0;
        this._movetimer   = 0;
    }

    _wouldCollide(nx, ny) {
        if (!this.scene.wallsLayer) return false;
        const TILE = this.CELL_SIZE;
        const col  = Math.floor(nx / TILE);
        const row  = Math.floor(ny / TILE);
        const layer = this.scene.wallsLayer.layer;
        if (row < 0 || row >= layer.data.length)    return true;
        if (col < 0 || col >= layer.data[0].length) return true;
        const tile = layer.data[row][col];
        return tile && tile.index > 0;
    }
}