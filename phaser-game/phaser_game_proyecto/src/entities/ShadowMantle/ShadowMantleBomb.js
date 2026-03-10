/**
 * ShadowMantleBomb — Bomba parabólica que lanza Shadow Mantle.
 * Al aterrizar crea un ShadowMantleCloud que dispara proyectiles en 4 direcciones.
 *
 * Traducción fiel del obj_shadow_mantle_bomb de GML.
 */
export class ShadowMantleBomb extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, targetx, targety) {
        super(scene, x, y, 'mantle_bomb_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this._startx   = x;
        this._starty   = y;
        this._targetx  = targetx;
        this._targety  = targety;
        this._timer    = 0;
        this._con      = 1; // arrancar directamente en con 1
        this._fakey    = -15;
        this._savedDepth = this.depth;

        this.isDead = false;

        // Shadow visual
        this._shadow = scene.add.image(x, y, 'mantle_bomb_shadow');
        this._shadow.setScale(2);
    }

    actualizar(delta) {
        if (this.isDead) return;

        if (this._con === 1) {
            this._timer += 2;

            // Arco parabólico
            const t     = this._timer / 60;
            this.x      = Phaser.Math.Linear(this._startx, this._targetx, t);
            this._fakey = -15 + (Math.sin(this._timer / 19) * 100 * -1);
            this.y      = Phaser.Math.Linear(this._starty, this._targety, t) + this._fakey;

            // Sombra en posición real (sin fakey)
            const realY = Phaser.Math.Linear(this._starty, this._targety, t);
            if (this._fakey < -14) {
                this._shadow.setPosition(this.x - 16, realY - 28);
                this._shadow.setVisible(true);
            } else {
                this._shadow.setVisible(false);
            }

            if (this._timer >= 60) {
                this.x = this._targetx;
                this.y = this._targety;
                this._shadow.setVisible(false);
                this._timer = 0;
                this._con   = 2;
            }
        }

        if (this._con === 2) {
            this._timer++;

            if (this._timer === 20) {
                // Crear cloud y destruirse
                const cloud = new ShadowMantleCloud(
                    this.scene,
                    (this.x - 16) + 4,
                    this.y - 30
                );
                this.scene.bossBullets.add(cloud);
                this._destroy();
            }
        }
    }

    _destroy() {
        this.isDead = true;
        if (this._shadow) { this._shadow.destroy(); this._shadow = null; }
        this.destroy();
    }

    destroy(fromScene) {
        if (this._shadow) { this._shadow.destroy(); this._shadow = null; }
        super.destroy(fromScene);
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleCloud — nube que explota en 4 proyectiles cardinales
// ─────────────────────────────────────────────────────────────
export class ShadowMantleCloud extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_cloud_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this._con        = 1;
        this._imageIndex = 0;
        this._timer      = 0;
        this.isDead      = false;
    }

    actualizar(delta) {
        if (this.isDead) return;
        if (this._con !== 1) return;

        this._imageIndex += 0.25;
        const frame = Math.floor(this._imageIndex);

        if (frame < 4) {
            this.setTexture(`mantle_cloud_${Math.min(frame, 3)}`);
        }

        // Al llegar al frame 1 → disparar en 4 direcciones
        if (this._imageIndex >= 1 && !this._fired) {
            this._fired = true;
            this._fireCardinal();
        }

        if (this._imageIndex >= 3) {
            this.isDead = true;
            this.destroy();
        }
    }

    _fireCardinal() {
        const dirs = [
            { angle: 180, vx: -10, vy:  0 },
            { angle:   0, vx:  10, vy:  0 },
            { angle:  90, vx:   0, vy:  10 },
            { angle: 270, vx:   0, vy: -10 },
        ];

        for (const d of dirs) {
            const b = new ShadowMantleCloudBullet(
                this.scene, this.x + 16, this.y + 16
            );
            b.setAngle(d.angle);
            b.setVelocity(d.vx, d.vy);
            this.scene.bossBullets.add(b);
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleCloudBullet — proyectil de la nube
// ─────────────────────────────────────────────────────────────
export class ShadowMantleCloudBullet extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_cloud_bullet_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this._timer  = 0;
        this.isDead  = false;
        this.damage  = 2;
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._timer++;
        if (this._timer >= 30) {
            this.isDead = true;
            this.destroy();
        }
    }
}