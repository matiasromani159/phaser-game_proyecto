import MonsterBase from './MonsterBase.js';

// ── Constantes fieles al GML ──────────────────────────────────
const MAX_SPD          = 10;   // velocidad máxima (hspd/vspd cap)
const MAX_HOMING       = 1.5;  // maxhomingfactor
const HOMING_ACCEL     = 0.4;  // incremento de homingfactor por tick
const WAKE_FRAMES      = 8;    // frames de vibración antes de activarse
const UPDATE_INTERVAL  = 2;    // corre cada 2 frames igual que GML

export default class MonsterSilentCat extends MonsterBase {

    constructor(scene, x, y) {
        super(scene, x, y, 'silent_cat_0');

        this.setOrigin(0.5, 0.5);
        this.setScale(2.25);       // 16 * 2.25 = 36px
        this.body.setSize(16, 16);

        this.hp = 20;

        // ── Estado ────────────────────────────────────────────
        this.aggressive  = false;
        this.wake        = false;
        this.waketimer   = 0;
        this.xstart      = x;
        this.ystart      = y;
        this.updatetimer = 0;

        // ── Movimiento homing ─────────────────────────────────
        this.hspd         = 0;
        this.vspd         = 0;
        this.homingfactor = 0;

        // Hurt
        this._lastHitTime = 0;
    }

    // ── Activar desde fuera (lo llama MonsterCatSinging al morir) ─
    wakeUp() {
        if (this.aggressive || this.wake || this.isDead) return;
        this.wake      = true;
        this.waketimer = 0;
    }

    // ── Recibir daño — solo cuando es agresivo ────────────────
    recibirDaño(cantidad) {
        if (!this.aggressive || this.isDead) return;

        const ahora = this.scene.time.now;
        if (!this._lastHitTime) this._lastHitTime = 0;
        if (ahora - this._lastHitTime < 300) return;
        this._lastHitTime = ahora;

        this.hp -= cantidad;
        if (this.hp <= 0) this.die();
    }

    // ── Lógica principal ──────────────────────────────────────
    actualizar(player) {
        if (this.isDead) return;

        // ── Despertar — vibra antes de activarse ──────────────
        if (this.wake) {
            this.waketimer++;

            // Vibración: alterna x +2 / -2 cada frame par/impar
            if (this.waketimer % 2 === 0) {
                this.x = this.xstart + 2;
            } else {
                this.x = this.xstart - 2;
            }

            if (this.waketimer === 8) {
                this.wake      = false;
                this.aggressive = true;
                this.setTexture('silent_cat_1'); // frame despierto
            }
            return;
        }

        if (!this.aggressive || !player) return;

        // ── Movimiento homing cada 2 frames (igual que GML) ───
        this.updatetimer++;
        if (this.updatetimer < UPDATE_INTERVAL) return;
        this.updatetimer = 0;

        // Calcular dirección hacia el jugador
        const idealdir = Phaser.Math.Angle.Between(
            this.x, this.y,
            player.x, player.y
        );

        // Acumular velocidad en dirección ideal
        this.hspd += Math.cos(idealdir) * this.homingfactor;
        this.vspd += Math.sin(idealdir) * this.homingfactor;

        // Cap de velocidad
        this.hspd = Phaser.Math.Clamp(this.hspd, -MAX_SPD, MAX_SPD);
        this.vspd = Phaser.Math.Clamp(this.vspd, -MAX_SPD, MAX_SPD);

        // Aumentar homingfactor gradualmente
        this.homingfactor = Math.min(
            this.homingfactor + HOMING_ACCEL,
            MAX_HOMING
        );

        // Aplicar movimiento
        this.x += this.hspd;
        this.y += this.vspd;
    }

    // ── Animación de muerte ───────────────────────────────────
    _playDieAnim() {
        this.play('monster-die');
        this.once('animationcomplete', () => this.destroy());
    }
}