/**
 * MonsterFlower — Flor estática que telegrafía y dispara pellets al jugador.
 *
 * Estados:
 *   idle       → animación normal, espera antes de telegrafiar
 *   telegraph  → animación de aviso, espera antes de disparar
 *   cooldown   → pausa aleatoria antes del siguiente ciclo
 */
export default class MonsterFlower extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'flower_0');

        this.setScale(2);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setImmovable(true);
        this.body.allowGravity = false;

        this.isDead = false;
        this.hp     = 40;

        // Timers en ms
        this.bubbletimer      = 0;
        this.TELEGRAPH_AT     = 1000;  // ms hasta telegrafiar
        this.FIRE_AT          = 600;   // ms en telegraph antes de disparar
        this.cooldownDuration = 0;
        this.state            = 'idle';

        this.play('flower-idle');
    }

    actualizar() {
        if (this.isDead) return;

        const delta = this.scene.game.loop.delta;
        this.bubbletimer += delta;

        switch (this.state) {

            case 'idle':
                if (this.bubbletimer >= this.TELEGRAPH_AT) {
                    this.state = 'telegraph';
                    this.bubbletimer = 0;
                    this.play('flower-telegraph');
                }
                break;

            case 'telegraph':
                if (this.bubbletimer >= this.FIRE_AT) {
                    this._shoot();
                    this.state = 'cooldown';
                    this.bubbletimer = 0;
                    this.cooldownDuration = Phaser.Math.Between(1000, 2500);
                    this.play('flower-idle');
                }
                break;

            case 'cooldown':
                if (this.bubbletimer >= this.cooldownDuration) {
                    this.state = 'idle';
                    this.bubbletimer = 0;
                }
                break;
        }
    }

    _shoot() {
        const player = this.scene.player;
        if (!player) return;

        const pellet = new FlowerPellet(this.scene, this.x, this.y);
        this.scene.pellets.add(pellet);

        // Aplicar velocidad DESPUÉS de añadir al grupo — group.add() resetea el body
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const speed = 120;
        pellet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        pellet.setRotation(angle);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        this.setVelocity(0, 0);
        this.body.enable = false;

        this.play('monster-die');
        this.once('animationcomplete', () => this.destroy());
    }
}

// ─────────────────────────────────────────────────────────
// FlowerPellet — Proyectil con efecto de color rojo/amarillo
// oscilante, replicando el merge_color de Deltarune
// ─────────────────────────────────────────────────────────
class FlowerPellet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spr_smallbullet');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1);

        // Capa de contorno encima (solo visual, sin física)
        this.outline = scene.add.image(x, y, 'spr_smallbullet_outline');
        this.outline.setScale(1);

        // Contador para la oscilación de color
        this.colorTimer = 0;
    }

    updateColor(delta) {
        this.colorTimer += delta * 0.003; // velocidad equivalente a colorsiner/3 del GML

        const sinAmt = Math.abs(Math.sin(this.colorTimer));

        // Rojo = 0xFF3030, Amarillo = 0xFFFF00
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

        this.setTint(Phaser.Display.Color.GetColor(bodyTint.r, bodyTint.g, bodyTint.b));
        this.outline.setTint(Phaser.Display.Color.GetColor(outlineTint.r, outlineTint.g, outlineTint.b));

        // Sincronizar posición y rotación del contorno con el cuerpo
        this.outline.setPosition(this.x, this.y);
        this.outline.setRotation(this.rotation);
        this.outline.setDepth(this.depth + 1);
    }

    destroy(fromScene) {
        if (this.outline) this.outline.destroy();
        super.destroy(fromScene);
    }
}