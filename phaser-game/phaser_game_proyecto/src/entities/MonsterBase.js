/**
 * MonsterBase — Clase padre de todos los enemigos.
 *
 * Proporciona:
 *   - Setup común (setScale, add.existing, physics.add.existing)
 *   - isDead / hp
 *   - recibirDaño(cantidad) — descuenta HP y llama a die() si llega a 0
 *   - die() — centraliza sonido + drop, llama a _playDieAnim()
 *   - _playDieAnim() — sobreescribir en hijos para animación propia
 *   - _dropItem() — instancia un HealthDrop al morir
 */
export default class MonsterBase extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.setScale(2);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.isDead = false;
        this.hp     = 20;
    }

    // ── Sobreescribir en cada hijo ────────────────────────────
    actualizar() {}

    // ── Recibir daño ──────────────────────────────────────────
    recibirDaño(cantidad) {
        if (this.isDead) return;

        const ahora = this.scene.time.now;
        if (!this._lastHitTime) this._lastHitTime = 0;
        if (ahora - this._lastHitTime < 300) return;
        this._lastHitTime = ahora;

        this.hp -= cantidad;
        if (this.hp <= 0) this.die();
    }

    // ── Drop de item curativo ─────────────────────────────────
    _dropItem() {
        const drop = new HealthDrop(this.scene, this.x, this.y);
        if (this.scene.healthDrops) {
            this.scene.healthDrops.add(drop);
            drop.setScale(2);
        }
    }

    // ── Muerte — centralizada, NO sobreescribir en hijos ─────
    // Los hijos sobreescriben _playDieAnim() si necesitan animación propia
    die() {
        if (this.isDead) return;
        this.isDead = true;

        this.setVelocity(0, 0);
        this.body.enable = false;
        this._dropItem();

        // Sonido al morir — siempre se reproduce para todos los enemigos
        if (this.scene?.sound) this.scene.sound.play('snd_board_damage', { volume: 0.7 });

        this._playDieAnim();
    }

    // ── Animación de muerte — sobreescribir en hijos ──────────
    _playDieAnim() {
        this.play('monster-die');
        this.once('animationcomplete', () => this.destroy());
    }
}

// ─────────────────────────────────────────────────────────────
// HealthDrop — Item curativo que aparece al matar un enemigo.
// ─────────────────────────────────────────────────────────────
export class HealthDrop extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'spr_board_candy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.body.setImmovable(true);
        this.setTint(0x00ff88);
        this.setOrigin(0, 0);

        this.HEAL_AMOUNT = 10;
    }

    collect(player) {
        if (!player || player.isDead) return;
        player.vida = Math.min(player.vidaMax, player.vida + this.HEAL_AMOUNT);
        player.drawHealthBar();
        this.destroy();
    }
}