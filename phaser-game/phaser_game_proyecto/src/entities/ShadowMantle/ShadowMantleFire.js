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

        this._rotatorTarget = rotatorTarget; // referencia al boss (ShadowMantle)
        this._type          = type;
        this._place         = 0;      // ángulo en grados
        this._placeSpeed    = 2;      // velocidad de rotación
        this._len           = 40;     // radio de órbita
        this._lenSpeed      = 0;      // cambio de radio por frame
        this._con           = 0;      // flag para tipos 2/3/4/5
        this._timer         = 0;
        this._alphaTimer    = 0;
        this.activeHitbox   = false;
        this.damage         = 2;
        this.isDead         = false;

        // Tipo 3 vive más tiempo
        this._maxAlphaTimer = (type === 3) ? 190 : 50;

        // snd_board_torch al crear la llama orbital
        scene.sound.stopByKey('snd_board_torch');
        scene.sound.play('snd_board_torch');
    }

    actualizar(delta) {
        if (this.isDead) return;

        // Seguir al target (boss)
        if (!this._rotatorTarget || this._rotatorTarget.isDead) {
            this._destroy(); return;
        }

        // Actualizar posición orbital — place_speed * 0.5 porque GML era 30fps
        const tx = this._rotatorTarget.x + 16;
        const ty = this._rotatorTarget.y + 16;
        this.x = tx + Math.cos(Phaser.Math.DegToRad(this._place)) * this._len;
        this.y = ty + Math.sin(Phaser.Math.DegToRad(this._place)) * this._len;
        this._place += this._placeSpeed * 0.5;
        this._len   += this._lenSpeed   * 0.5;

        // Lógica por tipo
        this._updateByType();

        // Animar sprite
        this._alphaTimer++;
        const frame = Math.floor((this._alphaTimer * 0.125) % 3); // 0.25/2
        this.setTexture(`mantle_fire_${frame}`);

        // Destruir por tiempo — maxAlphaTimer * 2 porque ahora corre a 60fps
        if (this._alphaTimer >= this._maxAlphaTimer * 2) {
            this._destroy();
        }
    }

    _updateByType() {
        const t = this._timer;

        if (this._type === 0) {
            this._timer++;
            if (t === 40)  this._lenSpeed = 8;           // 20 * 2
            if (t > 40)    this._lenSpeed = Math.max(this._lenSpeed - 0.15, -6); // 0.3/2
        }

        if (this._type === 1) {
            this._timer++;
            if (t === 1)   this._placeSpeed = 0;
            if (t > 40)    this._lenSpeed = Math.max(this._lenSpeed - 0.3, -6);  // 0.6/2
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
                // Tiempos * 2 porque 60fps
                const speeds = [
                    [2,   5], [62,  0], [92, -5], [152, 0],
                    [182, 5], [242, 0], [272,-5], [332, 0],
                ];
                for (const [at, spd] of speeds) {
                    if (t === at) this._lenSpeed = spd;
                }
            }
        }

        if (this._type === 4) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 26)                    // 13*2
                    this._len = Phaser.Math.Linear(this._len, 14, t / 40); // 20*2
                if (t === 32) this._lenSpeed = 16;        // 16*2
                if (t === 34) this.activeHitbox = true;   // 17*2
            }
        }

        if (this._type === 4.5) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 34)                    // 17*2
                    this._len = Phaser.Math.Linear(this._len, 14, t / 52); // 26*2
                if (t === 42) this._lenSpeed = 16;        // 21*2
                if (t === 44) this.activeHitbox = true;   // 22*2
            }
        }

        if (this._type === 5) {
            if (this._con === 1) {
                this._timer++;
                if (t >= 1 && t < 16)                    // 8*2
                    this._len = Phaser.Math.Linear(this._len, 14, t / 20); // 10*2
                if (t === 20) this._lenSpeed = 16;        // 10*2
                if (t === 22) this.activeHitbox = true;   // 11*2
            }
        }
    }

    // Llamado desde FireController para activar la fase de disparo
    activate() {
        this._con = 1;
    }

    _destroy() {
        this.isDead = true;
        this.destroy();
    }
}