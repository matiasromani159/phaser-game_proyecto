import { ShadowMantleEnemy } from './ShadowMantleEnemy.js';

/**
 * ShadowMantleFire3 — Bola de fuego con gravedad que sale del boss.
 * Traducción de obj_shadow_mantle_fire3.
 */
export class ShadowMantleFire3 extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, opts = {}) {
        super(scene, x, y, 'mantle_fire2_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        const dir   = opts.direction ?? 0;
        const spd   = opts.speed     ?? 2;
        const grav  = opts.gravity   ?? 0.2333;

        this._dir         = dir;
        this._speed       = spd;
        this._gravity     = grav;
        this._gravDir     = dir + 180; // gravedad opuesta = frena y cae de vuelta
        this._timer       = 0;
        this._type        = opts.type ?? 0;
        this.activeHitbox = false;
        this._activetimer = opts.activetimer ?? 20;
        this.damage       = 1;
        this.isDead       = false;

        // Velocidad inicial
        this.setVelocity(
            Math.cos(Phaser.Math.DegToRad(dir)) * spd * 60,
            Math.sin(Phaser.Math.DegToRad(dir)) * spd * 60
        );
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._timer++;

        // Tipo 0: parpadea hasta activetimer, luego activa hitbox
        if (this._type === 0) {
            if (this._timer <= this._activetimer) {
                this.alpha = this.alpha === 1 ? 0 : 1;
            }
            if (this._timer === this._activetimer) {
                this.activeHitbox = true;
                this.alpha        = 1;
            }
        }

        // Tipo 1: gravedad manual aplicada cada frame
        if (this._type === 1) {
            const rad   = Phaser.Math.DegToRad(this._dir);
            const gRad  = Phaser.Math.DegToRad(this._gravDir);
            this._speed += 0; // speed no cambia en tipo 1; la gravedad la aplica el body
            this.body.velocity.x += Math.cos(gRad) * this._gravity * (delta / 16.667);
            this.body.velocity.y += Math.sin(gRad) * this._gravity * (delta / 16.667);
        } else {
            // Aplicar gravedad manualmente (body.allowGravity = false)
            const gRad = Phaser.Math.DegToRad(this._gravDir);
            this.body.velocity.x += Math.cos(gRad) * this._gravity * (delta / 16.667) * 60;
            this.body.velocity.y += Math.sin(gRad) * this._gravity * (delta / 16.667) * 60;
        }

        // Animar
        const frame = Math.floor((this._timer * 0.25) % 3);
        this.setTexture(`mantle_fire2_${frame}`);

        if (this._timer >= 100) {
            this.isDead = true;
            this.destroy();
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleGroundfire — Rastro de fuego que deja el dash
// ─────────────────────────────────────────────────────────────
export class ShadowMantleGroundfire extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_fire_0');

        scene.physics.add.existing(this);
        scene.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(0.5); // empieza pequeño y crece hasta 2

        this._timer       = 0;
        this.activeHitbox = true;
        this.damage       = 2;
        this.isDead       = false;

        // Auto-registrarse en bossBullets para que BossScene llame actualizar()
        if (scene.bossBullets) scene.bossBullets.add(this, true);
    }

    actualizar(delta) {
        if (this.isDead) return;

        this._timer++;

        if (this._timer === 20)  this.activeHitbox = false;
        if (this._timer === 30)  { this.isDead = true; this.destroy(); }

        // Crecer desde pequeño hasta escala 2
        if (this.scaleX < 2) {
            this.setScale(Math.min(this.scaleX + 0.2, 2));
        }

        // Desvanecer al final
        if (this._timer > 20) {
            this.setAlpha(1 - ((this._timer - 20) / 10));
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleClone — Clon del boss que también hace dash
// ─────────────────────────────────────────────────────────────
export class ShadowMantleClone extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_dash_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(2);

        this.ohmygodimonfire  = 1;
        this._specialContimer = 0;
        this._dashtimer       = 0;
        this._dashcon         = 1;
        this.isDead           = false;
        this.damage           = 2;

        // Efecto on-fire visual
        this._onFireSprite = scene.add.image(x - 16, y - 32, 'mantle_imonfire_0');
        this._onFireSprite.setScale(2).setTint(0xff0000);
    }

    actualizar(delta) {
        if (this.isDead) return;

        const bounds  = this.scene.physics.world.bounds;
        const losses  = this.scene.registry.get('shadow_mantle_losses') ?? 0;

        if (this._dashcon === 1) {
            // Elegir dirección hacia un punto aleatorio de la arena
            const targetX = 170 + Phaser.Math.Between(0, 295);
            const targetY = 270;
            const dir = Phaser.Math.Angle.Between(this.x, this.y + 16, targetX, targetY);

            this._dashDir     = dir;
            this._dashGravity = losses < 7 ? 0.24 : 0.2;
            this._dashSpeed   = 2;
            this._dashtimer   = 28;
            this._dashcon     = 2;
        }

        if (this._dashcon === 2) {
            this._dashtimer++;

            if (this._dashtimer >= 30 && this._dashtimer % 2 === 0) {
                if      (losses < 7)  this._dashGravity += 0.03  * (delta / 16.667);
                else if (losses < 14) this._dashGravity += 0.023 * (delta / 16.667);
                else                  this._dashGravity += 0.017 * (delta / 16.667);

                new ShadowMantleGroundfire(this.scene, this.x + 16, this.y + 16);
                // ShadowMantleGroundfire ya se auto-registra en bossBullets
            }

            // Aplicar movimiento
            const gravDir = this._dashDir + Math.PI;
            this._dashSpeed += this._dashGravity * (delta / 16.667);
            this.x += Math.cos(this._dashDir) * this._dashSpeed;
            this.y += Math.sin(this._dashDir) * this._dashSpeed;

            // Actualizar on-fire
            this._specialContimer++;
            const frame = Math.floor(this._specialContimer / 4) % 2;
            this._onFireSprite.setPosition(this.x - 16, this.y - 32);
            this._onFireSprite.setTexture(`mantle_imonfire_${frame}`);

            // Destruir si sale del mapa
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
        const bounds  = scene.physics.world.bounds;
        const player  = scene.player;
        const losses  = scene.registry.get('shadow_mantle_losses') ?? 0;

        // Generar posiciones candidatas (equivale a obj_spawn_pos en GML)
        const candidates = [];
        for (let ix = 0; ix < 10; ix++) {
            for (let iy = 0; iy < 6; iy++) {
                const cx = 175 + ix * 32;
                const cy = 109 + iy * 32;

                // Filtrar si muy cerca del jugador
                const distToPlayer = Phaser.Math.Distance.Between(cx, cy, player.x, player.y);
                if (distToPlayer < 50) continue;

                // Filtrar si boss en fase 4 y demasiado cerca del jugador
                if (this._boss.hp < 5 && distToPlayer < 100) continue;

                candidates.push({ x: cx, y: cy });
            }
        }

        if (candidates.length === 0) return;

        // Elegir posición aleatoria
        const pos = candidates[Phaser.Math.Between(0, candidates.length - 1)];

        // Mover el boss hacia el enemigo spawneado
        this._boss.targetx = pos.x;
        this._boss.targety = pos.y - 32;
        this._boss.movestyle = 'to point and stop';

        // Actualizar sprite del boss
        if (pos.x > this._boss.x)
            this._boss.play('mantle-side-r', true);
        else
            this._boss.play('mantle-side-l', true);

        // Crear el enemigo
        const enemy = new ShadowMantleEnemy(scene, pos.x - 11, pos.y - 10, this._moveType);
        scene.bossEnemies.add(enemy);

        this.isDead = true;
    }
}