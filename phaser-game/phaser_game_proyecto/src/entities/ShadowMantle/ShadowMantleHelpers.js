import { ShadowMantleEnemy } from './ShadowMantleEnemy.js';

/**
 * ShadowMantleFire3 — Bola de fuego con gravedad que sale del boss.
 * Traducción de obj_shadow_mantle_fire3.
 */
export class ShadowMantleFire3 extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, opts = {}) {
        super(scene, x, y, 'mantle_fire_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(1);

        const dir  = opts.direction ?? 0;
        const spd  = opts.speed     ?? 2;
        const grav = opts.gravity   ?? 0.2333;

        this._dir         = dir;
        this._speed       = spd;
        this._gravity     = grav;
        this._type        = opts.type ?? 0;
        this._timer       = 0;
        this.activeHitbox = false;
        this._activetimer = opts.activetimer ?? 20;
        this.damage       = 1;
        this.isDead       = false;

        this._dirRad  = Phaser.Math.DegToRad(dir);
        // GML tipo 6/7: gravity_direction = direction + 180 (frena)
        // GML tipo 8:   gravity_direction = direction       (acelera hacia afuera)
        // En nuestro código _type=1 corresponde al tipo 8 del GML
        this._gravRad = this._type === 1
            ? Phaser.Math.DegToRad(dir)
            : Phaser.Math.DegToRad(dir + 180);
    }

    init() {
        // GML: speed px/frame a 30fps → px/s en Phaser = speed * 30
        // Pero ahora a 60fps usamos * 15 (30/2) para que visualmente sea igual
        if (this._speed !== 0) {
            this.body.setVelocity(
                Math.cos(this._dirRad) * this._speed * 15,
                Math.sin(this._dirRad) * this._speed * 15
            );
        }
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

        // Tipo 1 (espiral fase 4): hitbox activa desde el primer frame
        if (this._type === 1 && this._timer === 1) {
            this.activeHitbox = true;
        }

        // Gravedad: GML aplica gravity px/frame a 30fps → /2 para 60fps
        // velocity en px/s → gravity * 30 / 2 = gravity * 15
        this.body.velocity.x += Math.cos(this._gravRad) * this._gravity * 15;
        this.body.velocity.y += Math.sin(this._gravRad) * this._gravity * 15;

        const frame = Math.floor((this._timer * 0.125) % 3);
        this.setTexture(`mantle_fire_${frame}`);

        if (this._timer >= 200) {  // 100*2
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
        super(scene, x, y, 'mantle_fire2_0');

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

        if (this._timer === 40)  this.activeHitbox = false;   // 20*2
        if (this._timer === 60)  { this.isDead = true; this.destroy(); }  // 30*2

        // Crecer desde pequeño hasta escala 2
        if (this.scaleX < 2) {
            this.setScale(Math.min(this.scaleX + 0.1, 2));  // 0.2/2
        }

        // Desvanecer al final
        if (this._timer > 40) {
            this.setAlpha(1 - ((this._timer - 40) / 20));  // 20*2, 10*2
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ShadowMantleClone — Clon del boss que también hace dash
// ─────────────────────────────────────────────────────────────
export class ShadowMantleClone extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        // Aura ANTES del sprite para que quede detrás
        const onFireSprite = scene.add.image(x, y, 'mantle_imonfire_0');
        onFireSprite.setScale(2).setTint(0xff0000);

        super(scene, x, y, 'mantle_dash_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.setScale(1);

        this.ohmygodimonfire  = 1;
        this._specialContimer = 0;
        this._dashtimer       = 0;
        this._dashcon         = 1;
        this.isDead           = false;
        this.damage           = 2;

        this._onFireSprite = onFireSprite;
    }

    actualizar(delta) {
        if (this.isDead) return;

        // Throttle a 30fps igual que ShadowMantle principal
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 25) return;
        this._deltaAccum -= 25;

        const bounds  = this.scene.physics.world.bounds;
        const losses  = this.scene.registry.get('shadow_mantle_losses') ?? 0;

        if (this._dashcon === 1) {
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

            if (this._dashtimer >= 30 && this._dashtimer % 4 === 0) {
                if      (losses < 7)  this._dashGravity += 0.03  * (delta / 16.667);
                else if (losses < 14) this._dashGravity += 0.023 * (delta / 16.667);
                else                  this._dashGravity += 0.017 * (delta / 16.667);

                new ShadowMantleGroundfire(this.scene, this.x, this.y);
            }

            // Aplicar movimiento
            this._dashSpeed += this._dashGravity * (delta / 16.667);
            this.x += Math.cos(this._dashDir) * this._dashSpeed;
            this.y += Math.sin(this._dashDir) * this._dashSpeed;

            // Actualizar on-fire
            this._specialContimer++;
            const frame = Math.floor(this._specialContimer / 4) % 2;
            this._onFireSprite.setPosition(this.x, this.y - 12);
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