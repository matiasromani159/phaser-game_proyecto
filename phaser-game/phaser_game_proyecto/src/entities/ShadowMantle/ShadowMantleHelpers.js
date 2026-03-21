import { ShadowMantleEnemy } from './ShadowMantleEnemy.js';

/**
 * ShadowMantleFire3 — Bola de fuego con gravedad que sale del boss.
 * Traducción de obj_shadow_mantle_fire3.
 */
export class ShadowMantleFire3 extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, opts = {}) {
        super(scene, x, y, 'mantle_fire_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        const dir  = opts.direction ?? 0;
        const spd  = opts.speed     ?? 2;
        const grav = opts.gravity   ?? 0.2333;

        this._dir         = dir;
        this._speed       = spd;
        this._gravity     = grav;
        this._type        = opts.type ?? 0;
        this._timer       = 0;
        this.activeHitbox = false;
        this._activetimer = opts.activetimer ?? 20;
        this.damage       = 1;
        this.destroyonhit = false;
        this._hitCooldown = 0;
        this.isDead       = false;

        this._dirRad  = Phaser.Math.DegToRad(dir);
        this._gravRad = this._type === 1
            ? Phaser.Math.DegToRad(dir)
            : Phaser.Math.DegToRad(dir + 180);
    }

    init() {
        if (this._speed !== 0) {
            this.body.setVelocity(
                Math.cos(this._dirRad) * this._speed * 15,
                Math.sin(this._dirRad) * this._speed * 15
            );
        }
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._timer++;

        if (this._hitCooldown > 0) {
            this._hitCooldown--;
            if (this._hitCooldown === 0) this.activeHitbox = true;
        }

        if (this._type === 0) {
            if (this._timer <= this._activetimer) {
                this.alpha = this.alpha === 1 ? 0 : 1;
            }
            if (this._timer === this._activetimer) {
                this.activeHitbox = true;
                this.alpha        = 1;
            }
        }

        if (this._type === 1 && this._timer === 1) {
            this.activeHitbox = true;
        }

        this.body.velocity.x += Math.cos(this._gravRad) * this._gravity * 7.5;
        this.body.velocity.y += Math.sin(this._gravRad) * this._gravity * 7.5;

        const frame = Math.floor((this._timer * 0.125) % 3);
        this.setTexture(`mantle_fire_${frame}`);

        if (this._timer >= 200) {
            this.isDead = true;
            this.destroy();
        }
    }

    onHit() {
        this._hitCooldown = 20;
        this.activeHitbox = false;
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleGroundfire — Rastro de fuego que deja el dash
// ─────────────────────────────────────────────────────────────
export class ShadowMantleGroundfire extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_fire2_0');

        scene.physics.add.existing(this);
        scene.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(0.5);

        this._timer       = 0;
        this.activeHitbox = true;
        this.damage       = 2;
        this.destroyonhit = false;
        this._hitCooldown = 0;
        this.isDead       = false;

        if (scene.bossBullets) scene.bossBullets.add(this, true);
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._timer++;

        if (this._hitCooldown > 0) {
            this._hitCooldown--;
            if (this._hitCooldown === 0) this.activeHitbox = true;
        }

        if (this._timer === 40)  this.activeHitbox = false;
        if (this._timer === 60)  { this.isDead = true; this.destroy(); }

        if (this.scaleX < 2) {
            this.setScale(Math.min(this.scaleX + 0.1, 2));
        }

        if (this._timer > 40) {
            this.setAlpha(1 - ((this._timer - 40) / 20));
        }
    }

    onHit() {
        this._hitCooldown = 20;
        this.activeHitbox = false;
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleClone — Clon del boss que también hace dash
// ─────────────────────────────────────────────────────────────
export class ShadowMantleClone extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        const onFireSprite = scene.add.image(x, y, 'mantle_imonfire_0');
        onFireSprite.setScale(2).setTint(0xff0000);

        super(scene, x, y, 'mantle_dash_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(1);

        this.ohmygodimonfire  = 1;
        this._specialContimer = 0;
        this._dashtimer       = 0;
        this._dashcon         = 1;
        this.isDead           = false;
        this.damage           = 2;
        this.destroyonhit     = false;
        this._hitCooldown     = 0;

        this._onFireSprite = onFireSprite;
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 25) return;
        this._deltaAccum -= 25;

        const bounds  = this.scene.physics.world.bounds;
        const losses  = this.scene.registry.get('shadow_mantle_losses') ?? 0;

        if (this._hitCooldown > 0) {
            this._hitCooldown--;
        }

        if (this._dashcon === 1) {
            const targetX = 170 + Phaser.Math.Between(0, 295);
            const targetY = 270;
            const dir = Phaser.Math.Angle.Between(this.x, this.y + 16, targetX, targetY);

            this._dashDir     = dir;
            this._dashGravity = losses < 7 ? 0.24 : 0.2;
            this._dashSpeed   = 2;
            this._dashtimer   = 28;
            this._dashcon     = 2;

            // ── Sonido de dash igual que el boss principal ────
            const scene = this.scene;
            if (scene.sound.get('snd_wing')) {
                scene.sound.play('snd_wing', { volume: 0.8 });
            }
            if (scene.sound.get('snd_board_mantle_dash_slow')) {
                scene.time.delayedCall(200, () => {
                    if (!this.isDead && scene.sound.get('snd_board_mantle_dash_slow')) {
                        scene.sound.play('snd_board_mantle_dash_slow', {
                            detune: Phaser.Math.Between(-50, 50)
                        });
                    }
                });
            }
        }

        if (this._dashcon === 2) {
            this._dashtimer++;

            if (this._dashtimer >= 30 && this._dashtimer % 4 === 0) {
                if      (losses < 7)  this._dashGravity += 0.03  * (delta / 16.667);
                else if (losses < 14) this._dashGravity += 0.023 * (delta / 16.667);
                else                  this._dashGravity += 0.017 * (delta / 16.667);

                new ShadowMantleGroundfire(this.scene, this.x, this.y);
            }

            this._dashSpeed += this._dashGravity * (delta / 16.667);
            this.x += Math.cos(this._dashDir) * this._dashSpeed;
            this.y += Math.sin(this._dashDir) * this._dashSpeed;

            this._specialContimer++;
            const frame = Math.floor(this._specialContimer / 4) % 2;
            this._onFireSprite.setPosition(this.x, this.y - 12);
            this._onFireSprite.setTexture(`mantle_imonfire_${frame}`);

            if (
                this.y > bounds.bottom ||
                this.y < bounds.y - 100 ||
                this.x < bounds.x + 32 ||
                this.x > bounds.right
            ) {
                this._destroy();
            }
        }
    }

    onHit() {
        this._hitCooldown = 20;
    }

    _destroy() {
        this.isDead = true;
        if (this._onFireSprite) { this._onFireSprite.destroy(); this._onFireSprite = null; }
        this.destroy();
    }

    destroy(fromScene) {
        if (this._onFireSprite) { this._onFireSprite.destroy(); this._onFireSprite = null; }
        super.destroy(fromScene);
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleEnemySpawn — Spawner que crea un ShadowMantleEnemy
// ─────────────────────────────────────────────────────────────
export class ShadowMantleEnemySpawn {

    constructor(scene, bossX, bossY, moveType, boss) {
        this.scene    = scene;
        this._boss    = boss;
        this._moveType= moveType;
        this.isDead   = false;

        this._run();
    }

    _run() {
        const scene   = this.scene;
        const player  = scene.player;
        const TILE    = 36;

        const FREE_CELLS = [];
        if (scene.wallsLayer) {
            const layer = scene.wallsLayer.layer;
            for (let row = 2; row <= 7; row++) {
                for (let col = 1; col <= 10; col++) {
                    const tile = layer.data[row][col];
                    if (tile && tile.index <= 0) {
                        FREE_CELLS.push({
                            x: col * TILE,
                            y: row * TILE,
                        });
                    }
                }
            }
        }

        const candidates = FREE_CELLS.filter(c => {
            const distToPlayer = Phaser.Math.Distance.Between(c.x, c.y, player.x, player.y);
            if (distToPlayer < 50) return false;
            if (this._boss.hp < 5 && distToPlayer < 100) return false;
            return true;
        });

        if (candidates.length === 0) return;

        const pos = candidates[Phaser.Math.Between(0, candidates.length - 1)];

        this._boss.targetx = pos.x;
        this._boss.targety = pos.y;
        this._boss.movestyle = 'to point and stop';

        if (pos.x > this._boss.x)
            this._boss.play('mantle-side-r', true);
        else
            this._boss.play('mantle-side-l', true);

        const enemy = new ShadowMantleEnemy(scene, pos.x, pos.y, this._moveType);
        scene.bossEnemies.add(enemy);

        this.isDead = true;
    }
}