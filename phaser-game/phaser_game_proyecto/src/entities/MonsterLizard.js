import MonsterBase from './MonsterBase.js';

/**
 * MonsterLizard — Lagarto de Deltarune con 3 variantes.
 *
 * lizardType 0 → camina celda a celda + dispara pellets hacia el jugador
 * lizardType 1 → igual + al saltar dispara rayos en 8 direcciones (2 veces)
 * lizardType 2 → salta cerca del jugador en vez de posición aleatoria
 *
 * movecon:
 *   0 → decidiendo
 *   1 → caminando celda a celda
 *   2 → idle nervioso (mira a lados alternos, 15 frames)
 *   3 → salto parabólico a posición objetivo
 *
 * Uso en getRoomConfig():
 *   { type: 'lizard', x: 200, y: 200 }               // type 0
 *   { type: 'lizard', x: 200, y: 200, lizardType: 1 } // type 1
 *   { type: 'lizard', x: 200, y: 200, lizardType: 2 } // type 2
 */
export default class MonsterLizard extends MonsterBase {

    constructor(scene, x, y, lizardType = 0) {

        const initTex = lizardType === 0 ? 'lizard_l_0'
                      : lizardType === 1 ? 'lizard_l_alt_0'
                      :                    'lizard_l_jumpy_0';
        super(scene, x, y, initTex);

        this.hp         = 2;
        this.lizardType = lizardType;

        // ── Ajusta estos valores ──────────────────────────────
        this.CELL_SIZE       = 64;
        this.spd             = lizardType === 2 ? 2 : 1;
        this.UPDATE_INTERVAL = 2;
        this.WAIT_BETWEEN    = 0;
        // ─────────────────────────────────────────────────────

        this.movedir     = Phaser.Math.Between(0, 3);
        this.movecon     = 0;
        this.movetimer   = 0;
        this.updatetimer = 0;
        this.waittimer   = 0;
        this.lastattack  = 4;

        this.DIRS = [
            {  x:  1, y:  0 },
            {  x:  0, y: -1 },
            {  x: -1, y:  0 },
            {  x:  0, y:  1 },
        ];

        this.startx    = x;
        this.starty    = y;
        this.targetx   = x;
        this.targety   = y;
        this.fakey     = -15;
        this.jumpDelay = 0;

        this._jumpedRecentlyTimer = 0;

        this.bulletimer  = Phaser.Math.Between(-30, 0);
        this.SHOOT_EVERY = 28;

        this.reticle = scene.add.image(x, y, 'lizard_reticle');
        this.reticle.setScale(2).setVisible(false).setDepth(50);

        this._facingRight = false;
        this._updateSprite();
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────
    actualizar() {
        if (this.isDead) return;

        if (this._jumpedRecentlyTimer > 0) this._jumpedRecentlyTimer--;

        this.updatetimer++;
        if (this.updatetimer < this.UPDATE_INTERVAL) return;
        this.updatetimer = 0;

        if (this.movecon === 3) {
            this._updateJump();
            return;
        }

        if (this.movecon === 2) {
            this._updateIdle();
            return;
        }

        if (this.lizardType === 0) {
            this.bulletimer++;
            if (this.bulletimer >= this.SHOOT_EVERY) {
                this._shoot();
                this.bulletimer = Phaser.Math.Between(-50, 0);
            }
        }

        if (this.movecon === 0) {
            this.waittimer++;
            if (this.waittimer < this.WAIT_BETWEEN) return;
            this.waittimer = 0;

            this._decidirAccion();
        }

        if (this.movecon === 1) {
            this._updateWalk();
        }
    }

    // ─────────────────────────────────────────────────────────
    // DECISIÓN DE ACCIÓN
    // ─────────────────────────────────────────────────────────
    _decidirAccion() {
        let rand;

        if (this.lastattack === 4)       rand = 1;
        else if (this.lastattack === 1)  rand = Phaser.Math.Between(0, 2) === 0 ? 3 : Phaser.Math.Between(1, 2);
        else if (this.lastattack === 2)  rand = Math.random() < 0.5 ? 1 : 3;
        else if (this.lastattack === 3)  rand = Math.random() < 0.5 ? 1 : 2;

        if (this._jumpedRecentlyTimer > 0) rand = Math.random() < 0.5 ? 1 : 2;

        if (rand === 1) {
            this.movedir = Phaser.Math.Between(0, 3);
            for (let i = 0; i < 4; i++) {
                const off  = this.DIRS[this.movedir];
                const tile = this.scene.wallsLayer.getTileAtWorldXY(
                    this.x + off.x * this.CELL_SIZE,
                    this.y + off.y * this.CELL_SIZE
                );
                if (tile && tile.collides) {
                    this.movedir = (this.movedir + 1) % 4;
                } else break;
            }
        }

        if (rand === 3) {
            this._iniciarSalto();
        }

        this.movecon    = rand;
        this.lastattack = rand;
        this.movetimer  = 0;
    }

    // ─────────────────────────────────────────────────────────
    // CAMINAR CELDA A CELDA (movecon 1)
    // ─────────────────────────────────────────────────────────
    _updateWalk() {
        this.movetimer++;
        const dir  = this.DIRS[this.movedir];
        let   stop = 0;

        for (let i = 0; i < this.spd; i++) {
            if (stop) break;

            this.x += dir.x;
            this.y += dir.y;

            if (this.movedir === 0) this._facingRight = true;
            if (this.movedir === 2) this._facingRight = false;
            this._updateSprite();

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
    }

    // ─────────────────────────────────────────────────────────
    // IDLE NERVIOSO (movecon 2)
    // ─────────────────────────────────────────────────────────
    _updateIdle() {
        this.movetimer++;

        if (this.movetimer % 6 === 0) {
            this._facingRight = !this._facingRight;
            this._updateSprite();
        }

        if (this.movetimer >= 15) {
            this.movecon   = 0;
            this.movetimer = 0;
        }
    }

    // ─────────────────────────────────────────────────────────
    // SALTO PARABÓLICO (movecon 3)
    // ─────────────────────────────────────────────────────────
    _iniciarSalto() {
        this.startx    = this.x;
        this.starty    = this.y;
        this.movetimer = 0;
        this.jumpDelay = 0;
        this._jumpedRecentlyTimer = 50;

        const player = this.scene.player;
        const bounds = this.scene.physics.world.bounds;

        if (this.lizardType === 2 && player) {
            const offsets = [-64, 0, 64];
            const ox = offsets[Phaser.Math.Between(0, 2)];
            const oy = offsets[Phaser.Math.Between(0, 2)];
            this.targetx = Phaser.Math.Clamp(player.x + ox, bounds.x + 32, bounds.right  - 32);
            this.targety = Phaser.Math.Clamp(player.y + oy, bounds.y + 32, bounds.bottom - 32);
        } else {
            const cols = Math.floor(bounds.width  / this.CELL_SIZE);
            const rows = Math.floor(bounds.height / this.CELL_SIZE);
            this.targetx = (Phaser.Math.Between(1, cols - 2) * this.CELL_SIZE) + this.CELL_SIZE / 2;
            this.targety = (Phaser.Math.Between(1, rows - 2) * this.CELL_SIZE) + this.CELL_SIZE / 2;
        }

        this._facingRight = this.targetx > this.startx;
        this._updateSprite(true);

        if (this.reticle) {
            this.reticle.setPosition(this.targetx, this.targety).setVisible(true);
        }
    }

    _updateJump() {
        if (this.lizardType === 1) {
            if (this.jumpDelay <= 1) {
                this.movetimer += 2;
            } else {
                this.jumpDelay--;
            }

            if (this.movetimer === 30 && this.jumpDelay <= 0) {
                this.jumpDelay = 16;
            }

            if (this.jumpDelay === 12) this._shootRays(0);
            if (this.jumpDelay === 6)  this._shootRays(30);

        } else {
            this.movetimer += 2;
        }

        if (this.movetimer <= 60) {
            const t    = this.movetimer / 64;
            this.fakey = -15 + (Math.sin(this.movetimer / 19) * 50 * -1);
            this.x     = Phaser.Math.Linear(this.startx, this.targetx, t);
            this.y     = Phaser.Math.Linear(this.starty,  this.targety,  t) + this.fakey;
        }

        if (this.movetimer >= 62) {
            this.x         = this.targetx;
            this.y         = this.targety;
            this.movecon   = 0;
            this.movetimer = 0;
            this.jumpDelay = 0;
            this._jumpedRecentlyTimer = 50;
            this._facingRight = false;
            this._updateSprite();

            if (this.reticle) this.reticle.setVisible(false);
        }
    }

    // ─────────────────────────────────────────────────────────
    // DISPAROS
    // ─────────────────────────────────────────────────────────
    _shoot() {
        const player = this.scene.player;
        if (!player) return;

        this._facingRight = player.x > this.x;
        this._updateSprite();

        const pellet = new LizardPellet(this.scene, this.x, this.y);
        this.scene.pellets.add(pellet);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        pellet.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);
        pellet.setRotation(angle);
    }

    _shootRays(angleOffset = 0) {
        for (let i = 0; i < 8; i++) {
            const deg      = 45 * i;
            const straight = deg % 90 === 0;
            const finalDeg = deg + angleOffset;
            const ray      = new LizardRay(this.scene, this.x, this.y, straight, finalDeg);
            this.scene.pellets.add(ray);
        }
    }

    // ─────────────────────────────────────────────────────────
    // SPRITES
    // ─────────────────────────────────────────────────────────
    _updateSprite(jumpFrame = false) {
        const frame   = jumpFrame ? 1 : 0;
        const dir     = this._facingRight ? 'r' : 'l';
        const variant = this.lizardType === 1 ? '_alt'
                      : this.lizardType === 2 ? '_jumpy'
                      : '';
        this.setTexture(`lizard_${dir}${variant}_${frame}`);
    }

    // ─────────────────────────────────────────────────────────
    // MUERTE — sobreescribe MonsterBase porque la animación es distinta
    // ─────────────────────────────────────────────────────────
    _playDieAnim() {
        if (this.reticle) { this.reticle.destroy(); this.reticle = null; }

        let dietimer = 0;
        const dieInterval = this.scene.time.addEvent({
            delay: 33, loop: true,
            callback: () => {
                if (!this.active) { dieInterval.remove(); return; }
                dietimer++;
                this._facingRight = !this._facingRight;
                this._updateSprite(true);
                if (dietimer >= 14) {
                    dieInterval.remove();
                    this.destroy();
                }
            }
        });
    }

    destroy(fromScene) {
        if (this.reticle) { this.reticle.destroy(); this.reticle = null; }
        super.destroy(fromScene);
    }
}

// ─────────────────────────────────────────────────────────────
// LizardPellet
// ─────────────────────────────────────────────────────────────
class LizardPellet extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'spr_smallbullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.allowGravity = false;
        this.colorTimer = 0;

        this.outline = scene.add.image(x, y, 'spr_smallbullet_outline');
        this.outline.setScale(1);
    }

    updateColor(delta) {
        const bounds = this.scene.physics.world.bounds;
        if (this.x < bounds.x - 32 || this.x > bounds.right  + 32 ||
            this.y < bounds.y - 32 || this.y > bounds.bottom + 32) {
            this.destroy();
            return;
        }

        this.colorTimer += delta * 0.003;
        const sinAmt = Math.abs(Math.sin(this.colorTimer));

        const bodyTint = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xFF3030),
            Phaser.Display.Color.ValueToColor(0xFFFF00),
            100, sinAmt * 100
        );
        const outlineTint = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xFFFF00),
            Phaser.Display.Color.ValueToColor(0xFF3030),
            100, (0.5 + sinAmt / 2) * 100
        );

        this.setTint(Phaser.Display.Color.GetColor(bodyTint.r,    bodyTint.g,    bodyTint.b));
        this.outline.setTint(Phaser.Display.Color.GetColor(outlineTint.r, outlineTint.g, outlineTint.b));
        this.outline.setPosition(this.x, this.y).setRotation(this.rotation).setDepth(this.depth + 1);
    }

    destroy(fromScene) {
        if (this.outline) { this.outline.destroy(); this.outline = null; }
        super.destroy(fromScene);
    }
}

// ─────────────────────────────────────────────────────────────
// LizardRay
// ─────────────────────────────────────────────────────────────
class LizardRay extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, straight = true, deg = 0) {
        const baseKey = straight ? 'lightning_straight_0' : 'lightning_diag_0';
        super(scene, x, y, baseKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this._angleDeg  = deg;
        this._angleRad  = Phaser.Math.DegToRad(deg);
        this._spd       = 1;
        this._acc       = 1;

        const snapAngle = Math.round(deg / 90) * 90;
        this.setAngle(snapAngle);

        this._straight  = straight;
        this._frame     = 0;
        this._animTimer = 0;
        this._ANIM_RATE = 33;
    }

    updateColor(delta) {
        const bounds = this.scene.physics.world.bounds;
        if (this.x < bounds.x - 32 || this.x > bounds.right  + 32 ||
            this.y < bounds.y - 32 || this.y > bounds.bottom + 32) {
            this.destroy();
            return;
        }

        this._spd += this._acc * (delta / 16.67);
        this.setVelocity(
            Math.cos(this._angleRad) * this._spd * 60,
            Math.sin(this._angleRad) * this._spd * 60
        );

        this._animTimer += delta;
        if (this._animTimer >= this._ANIM_RATE) {
            this._animTimer = 0;
            this._frame = (this._frame + 1) % 4;
            const prefix = this._straight ? 'lightning_straight_' : 'lightning_diag_';
            this.setTexture(prefix + this._frame);
        }
    }
}