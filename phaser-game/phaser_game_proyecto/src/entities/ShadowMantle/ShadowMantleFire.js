/**
 * ShadowMantleFire — Llama orbital que rota alrededor del boss.
 * Traducción fiel del obj_shadow_mantle_fire de GML.
 *
 * Tipos:
 *   0   → aparece, expande radio, luego colapsa
 *   1   → igual pero place_speed = 0 al inicio, luego expande
 *   2/3 → controlled externally via con flag, len_speed variable
 *   4   → se acerca al boss y luego dispara hacia afuera (hitbox activa)
 *   4.5 → igual que 4 pero más lento
 *   5   → igual que 4 pero aún más rápido en disparar
 */
export class ShadowMantleFire extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, rotatorTarget, type = 0) {
        super(scene, x, y, 'mantle_fire_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(1.5);

        this._rotatorTarget = rotatorTarget;
        this._type          = type;
        this._place         = 0;
        this._placeSpeed    = 2;
        this._len           = (type === 0 || type === 1) ? 24 : 40;
        this._lenSpeed      = 0;
        this._con           = 0;
        this._timer         = 0;
        this._alphaTimer    = 0;
        this.activeHitbox   = false;
        this.damage         = 2;
        this.destroyonhit   = false; // No se destruye al tocar al jugador
        this._hitCooldown   = 0;     // Frames de invencibilidad tras golpear
        this.isDead         = false;

        this._maxAlphaTimer = (type === 3) ? 190 : 50;

        this.setAlpha(0);

        scene.sound.stopByKey('snd_board_torch');
        scene.sound.play('snd_board_torch');
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 33.333) return;
        this._deltaAccum -= 33.333;

        if (!this._rotatorTarget || this._rotatorTarget.isDead) {
            this._destroy(); return;
        }

        const tx = this._rotatorTarget.x;
        const ty = this._rotatorTarget.y;
        this.x = tx + Math.cos(Phaser.Math.DegToRad(this._place)) * this._len;
        this.y = ty + Math.sin(Phaser.Math.DegToRad(this._place)) * this._len;
        this.setAlpha(1);
        this._place += this._placeSpeed;
        this._len   += this._lenSpeed;

        // Bajar cooldown de hit
        if (this._hitCooldown > 0) {
            this._hitCooldown--;
            if (this._hitCooldown === 0) this.activeHitbox = true;
        }

        this._updateByType();

        this._alphaTimer++;
        const frame = Math.floor((this._alphaTimer * 0.25) % 3);
        this.setTexture(`mantle_fire_${frame}`);

        if (this._alphaTimer >= this._maxAlphaTimer) {
            this._destroy();
        }
    }

    _updateByType() {
        const t = this._timer;

        if (this._type === 0) {
            this._timer++;
            if (t === 40)  this._lenSpeed = 8;
            if (t > 40)    this._lenSpeed = Math.max(this._lenSpeed - 0.3, -6);
        }

        if (this._type === 1) {
            this._timer++;
            if (t === 1)   this._placeSpeed = 0;
            if (t > 20)    this._lenSpeed = Math.max(this._lenSpeed - 0.6, -6);
        }

        if (this._type === 2) {
            if (this._con === 1) {
                this._timer++;
                if (t === 1) this._lenSpeed = 10;
            }
        }

        if (this._type === 3) {
            if (this._con === 1) {
                this._timer++;
                const speeds = [
                    [1,   5], [31,  0], [46, -5], [76, 0],
                    [91,  5], [121, 0], [136,-5], [166, 0],
                ];
                for (const [at, spd] of speeds) {
                    if (t === at) this._lenSpeed = spd;
                }
            }
        }

        if (this._type === 4) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 13)
                    this._len = Phaser.Math.Linear(this._len, 14, t / 20);
                if (t === 16) this._lenSpeed = 16;
                if (t === 17) this.activeHitbox = true;
            }
        }

        if (this._type === 4.5) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 17)
                    this._len = Phaser.Math.Linear(this._len, 14, t / 26);
                if (t === 21) this._lenSpeed = 16;
                if (t === 22) this.activeHitbox = true;
            }
        }

        if (this._type === 5) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 8)
                    this._len = Phaser.Math.Linear(this._len, 14, t / 10);
                if (t === 10) this._lenSpeed = 16;
                if (t === 11) this.activeHitbox = true;
            }
        }
    }

    activate() {
        this._con = 1;
    }

    onHit() {
        // No destruir — pausar hitbox 20 frames
        this._hitCooldown = 20;
        this.activeHitbox = false;
    }

    _destroy() {
        this.isDead = true;
        this.destroy();
    }
}