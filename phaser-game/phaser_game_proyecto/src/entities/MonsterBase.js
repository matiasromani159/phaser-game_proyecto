/**
 * MonsterBase — Clase padre de todos los enemigos.
 *
 * Proporciona:
 *   - Setup común (setScale, add.existing, physics.add.existing)
 *   - isDead / hp
 *   - die() genérico con animación 'monster-die' (sobreescribible)
 *   - _dropItem() — instancia un HealthDrop al morir
 *
 * Los hijos deben implementar actualizar().
 * Si tienen una animación de muerte distinta, sobreescriben die().
 */
export default class MonsterBase extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

            this.setScale(2);
            
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.isDead = false;
        this.hp     = 20; // cada hijo puede sobreescribir esto
    }

    // ── Sobreescribir en cada hijo ────────────────────────────
    actualizar() {}

    // ── Drop de item curativo ─────────────────────────────────
    _dropItem() {
        const drop = new HealthDrop(this.scene, this.x, this.y);
        // El grupo healthDrops debe existir en la escena
        if (this.scene.healthDrops) {
            this.scene.healthDrops.add(drop);
             drop.setScale(2);
              
        }
    }

    // ── Muerte genérica (Monster, MonsterSpear, MonsterFlower) ─
    die() {
        if (this.isDead) return;
        this.isDead = true;

        this.setVelocity(0, 0);
        this.body.enable = false;

        this._dropItem();

        this.play('monster-die');
        this.once('animationcomplete', () => this.destroy());
    }
}

// ─────────────────────────────────────────────────────────────
// HealthDrop — Item curativo que aparece al matar un enemigo.
// Cura 10 HP al jugador al tocarlo.
// ─────────────────────────────────────────────────────────────
export class HealthDrop extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'spr_board_candy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.body.setImmovable(true);
        this.setTint(0x00ff88);
        

        this.HEAL_AMOUNT = 10;

        // Pequeña animación de flotación
 
    }

    /** Llamar desde BaseGameScene al detectar overlap con el jugador */
    collect(player) {
        if (!player || player.isDead) return;

        player.vida = Math.min(player.vidaMax, player.vida + this.HEAL_AMOUNT);
        player.drawHealthBar();

        this.destroy();
    }
}