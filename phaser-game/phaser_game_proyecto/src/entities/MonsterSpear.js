import MonsterBase from './MonsterBase.js';

/**
 * MonsterSpear — Enemigo que patrulla celda a celda,
 * se vuelve agresivo al detectar al jugador y dispara lanzas en dirección cardinal.
 *
 * Estados:
 *   patrol   → movimiento celda a celda aleatorio
 *   shooting → se detiene, parpadea sprite angry, dispara lanza cardinal
 *   cooldown → pausa breve tras disparar antes de volver a patrol
 */
export default class MonsterSpear extends MonsterBase {

    constructor(scene, x, y) {
        super(scene, x, y, 'monster_right_0');

        this.hp = 30;

        // ── Ajusta estos valores ──────────────────────────────
        this.CELL_SIZE       = 64;
        this.spd             = 1;
        this.UPDATE_INTERVAL = 2;
        this.WAIT_BETWEEN    = 0;
        this.AGGRO_RANGE     = 160;
        // ─────────────────────────────────────────────────────

        this.movedir     = Phaser.Math.Between(0, 3);
        this.movecon     = 0;
        this.movetimer   = 0;
        this.updatetimer = 0;
        this.waittimer   = 0;

        this.DIRS = [
            {  x:  1, y:  0 },
            {  x:  0, y: -1 },
            {  x: -1, y:  0 },
            {  x:  0, y:  1 },
        ];

        this.SHOOT_COOLDOWN  = 1800;
        this.SHOOT_WARN_TIME = 400;
        this.shootTimer      = 0;
        this.warnTimer       = 0;
        this._cooldownLeft   = 0;

        this.state = 'patrol';

        this.play('monster-walk');
    }

    actualizar() {
        if (this.isDead) return;

        const delta  = this.scene.game.loop.delta;
        const player = this.scene.player;
        if (!player) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (this.state === 'shooting') {
            this._updateShooting(delta, player);
            return;
        }

        if (this.state === 'cooldown') {
            this._updateCooldown(delta);
            return;
        }

        this.shootTimer += delta;
        if (this.shootTimer >= this.SHOOT_COOLDOWN && dist < this.AGGRO_RANGE) {
            this._enterShooting(player);
            return;
        }

        this.updatetimer++;
        if (this.updatetimer < this.UPDATE_INTERVAL) return;
        this.updatetimer = 0;

        if (this.movecon === 0) {
            this.waittimer++;
            if (this.waittimer < this.WAIT_BETWEEN) return;
            this.waittimer = 0;

            this.movedir = Phaser.Math.Between(0, 3);
            for (let i = 0; i < 4; i++) {
                const off  = this.DIRS[this.movedir];
                const tile = this.scene.wallsLayer.getTileAtWorldXY(
                    this.x + off.x * this.CELL_SIZE,
                    this.y + off.y * this.CELL_SIZE
                );
                if (tile && tile.collides) {
                    this.movedir = (this.movedir + 1) % 4;
                } else {
                    break;
                }
            }
            this.movecon = 1;
        }

        if (this.movecon === 1) {
            this.movetimer++;
            const dir  = this.DIRS[this.movedir];
            let   stop = 0;

            for (let i = 0; i < this.spd; i++) {
                if (stop) break;

                this.x += dir.x;
                this.y += dir.y;

                const tile   = this.scene.wallsLayer.getTileAtWorldXY(this.x, this.y);
                const bounds = this.scene.physics.world.bounds;
                const choca  = (tile && tile.collides) ||
                               this.x < bounds.x || this.x > bounds.right ||
                               this.y < bounds.y || this.y > bounds.bottom;

                if (choca) {
                    this.x -= dir.x;
                    this.y -= dir.y;
                    this.movedir   = (this.movedir + 2) % 4;
                    this.movecon   = 0;
                    this.movetimer = 0;
                    stop = 1;
                    break;
                }

                const completoCelda =
                    ((this.movedir === 0 || this.movedir === 2) && (Math.round(this.x) % this.CELL_SIZE) === 0) ||
                    ((this.movedir === 1 || this.movedir === 3) && (Math.round(this.y) % this.CELL_SIZE) === 0);

                if (completoCelda) {
                    this.movecon   = 0;
                    this.movetimer = 0;
                    stop = 1;
                }
            }

            this.flipX = this.movedir === 2;
            this.play('monster-walk', true);
        }
    }

    _updateShooting(delta, player) {
        this.warnTimer += delta;

        if (Math.floor(this.warnTimer / 100) % 2 === 0) {
            this.setTexture('monster_angry_0');
        } else {
            this.setTexture('monster_angry_1');
        }

        if (this.warnTimer >= this.SHOOT_WARN_TIME) {
            this._shoot(player);
            this.warnTimer     = 0;
            this.shootTimer    = 0;
            this._cooldownLeft = Phaser.Math.Between(600, 1200);
            this.state         = 'cooldown';
            this.play('monster-walk', true);
        }
    }

    _updateCooldown(delta) {
        this._cooldownLeft -= delta;
        if (this._cooldownLeft <= 0) {
            this.state = 'patrol';
        }
    }

    _enterShooting(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
            this.movedir = dx > 0 ? 0 : 2;
        } else {
            this.movedir = dy > 0 ? 3 : 1;
        }

        this.warnTimer = 0;
        this.state     = 'shooting';
    }

    _shoot(player) {
        const spear = new Spear(this.scene, this.x, this.y, this.movedir);
        this.scene.pellets.add(spear);
        spear.launch();
    }

    // die() heredado de MonsterBase (animación 'monster-die' + drop)
}

// ─────────────────────────────────────────────────────────────
// Spear — Proyectil de lanza, se mueve en línea recta cardinal
// ─────────────────────────────────────────────────────────────
class Spear extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, dir) {
        super(scene, x, y, 'spr_spear');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.dir   = dir;
        this.speed = 220;
        this.setScale(2);

        const angles = [0, -90, 180, 90];
        this.setAngle(angles[dir]);
    }

    launch() {
        const velocities = [
            { x:  this.speed, y:  0 },
            { x:  0,          y: -this.speed },
            { x: -this.speed, y:  0 },
            { x:  0,          y:  this.speed },
        ];
        const vel = velocities[this.dir];
        this.setVelocity(vel.x, vel.y);
    }

    updateColor(delta) {
        const bounds = this.scene.physics.world.bounds;
        if (
            this.x < bounds.x - 32 ||
            this.x > bounds.right + 32 ||
            this.y < bounds.y - 32 ||
            this.y > bounds.bottom + 32
        ) {
            this.destroy();
        }
    }
}