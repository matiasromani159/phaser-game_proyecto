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
 *
 * Muerte por espada:
 *   - NO hay animación de hundirse (disappear solo ocurre por timeout/cantfindpath)
 *   - Al recibir golpe: parpadeo hurt+walk durante hurttimer, luego destroy()
 *   - Efecto de risa (spr___laugh) y candy spawnan al destruirse
 *
 * Knockback:
 *   - Usa setVelocity() para respetar colisiones con wallsLayer
 *   - Requiere: physics.add.collider(bossEnemies, wallsLayer) en BossScene
 */
export class ShadowMantleEnemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, moveType = 0) {
        super(scene, x, y, 'enemy_appear_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2.25);
        this.body.setSize(10, 10);
        this.body.setOffset(3, 3);
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

        this._imageIndex   = 0;
        this._hurtFlicker  = false;

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

        // ── Velocidad progresiva ──────────────────────────────
        this._spdtimer++;
        if (this._spdtimer > 120 && this._spdtimer < 360)
            this._spd = Phaser.Math.Linear(2.5, 1, (this._spdtimer - 120) / 240);
        if (this._spdtimer >= 360)
            this._spd = 1;

        // ── hurttimer ─────────────────────────────────────────
        // GML: hurttimer = 12 @ 30fps → 24 @ 60fps
        // Al llegar a 0 se destruye (muerte por espada)
        // El disappear por timeout/cantfindpath es independiente
        if (this._hurttimer > 0) {
            this._hurttimer--;

            // Parpadeo: alternar enemy_hurt / enemy_walk cada 2 frames
            if ((this._hurttimer % 2) === 0) {
                this._hurtFlicker = !this._hurtFlicker;
            }
            this.setTexture(this._hurtFlicker
                ? 'enemy_hurt'
                : `enemy_walk_${[1, 2, 3, 0][this._movedir]}`
            );

            // Knockback usando física para respetar paredes
            // GML: hurttimer > 6 @ 30fps → > 12 @ 60fps
            // En vez de mover x/y directamente usamos velocidad
            if (this._hurttimer === 23) {
                // Solo seteamos la velocidad una vez al inicio del knockback
                const pushDir = this._hitdir;
                const vx = [ 0, 300,  0, -300][pushDir] ?? 0;
                const vy = [300,  0, -300,  0][pushDir] ?? 0;
                this.setVelocity(vx, vy);
            }

            if (this._hurttimer === 12) {
                // Parar el knockback a mitad del hurttimer
                this.setVelocity(0, 0);
            }

            // Al terminar el hurttimer → muerte
            if (this._hurttimer === 0) {
                this.setVelocity(0, 0);
                this._die();
            }
            return;
        }

        // ─────────────────────────────────────────────────────
        // ESTADO: init — animación de surgir del suelo
        // ─────────────────────────────────────────────────────
        if (this._state === 'init') {
            this._imageIndex += 0.125;

            const frame = Math.min(Math.floor(this._imageIndex), 4);
            this.setTexture(`enemy_appear_${frame}`);

            if (this._imageIndex >= 5) {
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

            // Timeout (alivetimer >= 600 @ 60fps = 300 @ 30fps) o atascado
            if ((this._alivetimer >= 600 || this._cantFindPath) && this._state !== 'disappear')
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
        // ESTADO: disappear — solo por timeout o cantfindpath
        // (NO por muerte con espada — esa usa _die() directo)
        // ─────────────────────────────────────────────────────
        if (this._state === 'disappear') {
            this.activeHitbox = false;
            this._imageIndex -= 0.125;

            if (this._imageIndex > 0) {
                const frame = Math.min(Math.floor(this._imageIndex), 4);
                this.setTexture(`enemy_appear_${frame}`);
            } else {
                // Hundido por timeout — no spawna risa ni candy
                this.isDead = true;
                this.destroy();
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // MUERTE POR ESPADA
    // Spawna risa + candy y se destruye
    // ─────────────────────────────────────────────────────────
    _die() {
        if (this.isDead) return;
        this.isDead       = true;
        this.activeHitbox = false;
        this._spawnLaughEffect();
        this._spawnCandy();
        this.destroy();
    }

    // ─────────────────────────────────────────────────────────
    // EFECTO DE RISA
    // GML: scr_board_marker(x, y, spr___laugh, 0.4, depth, 2, 1)
    // 10 frames, velocidad 0.4 @ 30fps → 0.2 @ 60fps
    // ─────────────────────────────────────────────────────────
    _spawnLaughEffect() {
        const scene = this.scene;
        const x     = this.x;
        const y     = this.y;

        const laugh = scene.add.image(x, y, 'enemy_laugh_0')
            .setScale(2.25)
            .setOrigin(0, 0)
            .setDepth(this.depth + 1);

        let frameF  = 0;
        const TOTAL = 10;
        const SPEED = 0.2; // 0.4 GML × 0.5

        const timer = scene.time.addEvent({
            delay   : 16,
            repeat  : Math.ceil(TOTAL / SPEED) + 1,
            callback: () => {
                frameF += SPEED;
                const f = Math.floor(frameF);
                if (f >= TOTAL) {
                    laugh.destroy();
                    timer.remove();
                } else {
                    laugh.setTexture(`enemy_laugh_${f}`);
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // CANDY
    // Emite evento para que BossScene lo gestione:
    //   this.events.on('enemy-drop-candy', ({ x, y }) => { ... })
    // ─────────────────────────────────────────────────────────
    _spawnCandy() {
        this.scene.events.emit('enemy-drop-candy', { x: this.x, y: this.y });
    }

    // ── Recibir golpe de espada ───────────────────────────────
    takeHit(hitdir) {
        if (this._hurttimer > 0 || this._state === 'disappear') return;

        this._hurttimer   = 24; // 12 GML @ 30fps → 24 @ 60fps
        this.activeHitbox = false;
        this._hitdir      = hitdir;
        this._hit         = 1;
        this._hurtFlicker = false;
    }

    // ─────────────────────────────────────────────────────────
    // DISAPPEAR por timeout/cantfindpath (no por espada)
    // ─────────────────────────────────────────────────────────
    _enterDisappear() {
        this._state       = 'disappear';
        this.activeHitbox = false;
        this._imageIndex  = 5;
        this._movecon     = 0;
        this._movetimer   = 0;
        this.setVelocity(0, 0);
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