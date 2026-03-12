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

        // Throttle a 30fps igual que el boss
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 33.333) return;
        this._deltaAccum -= 33.333;

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

        // Throttle a 30fps
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 33.333) return;
        this._deltaAccum -= 33.333;

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
        const spd = 300; // GML speed=10 a 30fps = 300px/s en Phaser
        const dirs = [
            { angle: 180, vx: -spd, vy:    0 },
            { angle:   0, vx:  spd, vy:    0 },
            { angle:  90, vx:    0, vy:  spd },
            { angle: 270, vx:    0, vy: -spd },
        ];

        for (const d of dirs) {
            const b = new ShadowMantleCloudBullet(
                this.scene, this.x + 16, this.y + 16
            );
            // PRIMERO añadir al grupo para que el body esté activo
            this.scene.bossBullets.add(b);
            // DESPUÉS setear velocidad y ángulo
            b.setAngle(d.angle);
            b.body.setVelocity(d.vx, d.vy);
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleCloudBullet — proyectil cardinal de la nube
// ─────────────────────────────────────────────────────────────
export class ShadowMantleCloudBullet extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_cloud_projectile_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this._timer      = 0;
        this._imageIndex = 0;
        this.isDead      = false;
        this.damage      = 2;
        this.destroyonhit= false;
        this.activeHitbox= true;

        // Trail — últimas 5 posiciones (remx/remy del GML)
        this._remx = Array(5).fill(x);
        this._remy = Array(5).fill(y);

        this._trailSprites = [];
        for (let i = 0; i < 4; i++) {
            const t = scene.add.image(x, y, 'mantle_cloud_projectile_0');
            t.setScale(2).setAlpha(0.4 - i * 0.08);
            this._trailSprites.push(t);
        }
    }

    actualizar(delta) {
        if (this.isDead) return;

        // Throttle a 30fps
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 33.333) return;
        this._deltaAccum -= 33.333;

        this._timer++;

        // Animar (image_speed = 0.25 en GML)
        this._imageIndex = (this._imageIndex + 0.25) % 2;
        this.setTexture(`mantle_cloud_projectile_${Math.floor(this._imageIndex)}`);

        // Actualizar trail
        for (let i = 4; i > 0; i--) {
            this._remx[i] = this._remx[i - 1];
            this._remy[i] = this._remy[i - 1];
        }
        this._remx[0] = this.x;
        this._remy[0] = this.y;

        for (let i = 0; i < this._trailSprites.length; i++) {
            this._trailSprites[i].setPosition(this._remx[i + 1], this._remy[i + 1]);
            this._trailSprites[i].setTexture(`mantle_cloud_projectile_${Math.floor(this._imageIndex)}`);
            this._trailSprites[i].setAngle(this.angle);
        }

        if (this._timer >= 30) this._destroy();
    }

    _destroy() {
        this.isDead = true;
        this._trailSprites.forEach(t => t.destroy());
        this._trailSprites = [];
        this.destroy();
    }

    destroy(fromScene) {
        if (this._trailSprites) {
            this._trailSprites.forEach(t => { if (t.active) t.destroy(); });
            this._trailSprites = [];
        }
        super.destroy(fromScene);
    }
}