import { ShadowMantleFire }  from './ShadowMantleFire.js';
import { ShadowMantleFire3 } from './ShadowMantleHelpers.js';
import { ShadowMantleBomb }  from './ShadowMantleBomb.js';

/**
 * ShadowMantleFireController — Gestiona la creación y comportamiento
 * de las llamas orbitales del boss. No es un sprite, solo lógica.
 *
 * Traducción fiel del obj_shadow_mantle_fire_controller de GML.
 *
 * Tipos 0-5: llamas orbitales (ShadowMantleFire)
 * Tipo 6-7:  oleadas de fire3 (bolas de fuego)
 * Tipo 8:    fase 4 — combinación de fire3 + bombas giratorias
 */
export class ShadowMantleFireController {

    constructor(scene, x, y, type, boss) {
        this.scene  = scene;
        this.x      = x;
        this.y      = y;
        this._type  = type;
        this._boss  = boss;

        this._timer         = 0;
        this._con           = 0;
        this._con2          = 0;
        this._count         = 0;
        this._dir           = 1;
        this._offset        = Phaser.Math.Between(0, 60);
        this._fireballTimer = 0;
        this._fireballCount = 0;
        this._totalCount    = 0;
        this._spinA         = 0;
        this._spinSpeed     = 3;
        this._angle         = 19;

        this.isDead = false;

        // Referencia a las llamas creadas
        this._fires = [];
    }

    actualizar(delta) {
        if (this.isDead) return;
        if (!this._boss || this._boss.isDead) { this._destroy(); return; }

        // Throttle a 30fps igual que el boss principal
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 33.333) return;
        this._deltaAccum -= 33.333;

        const t = this._type;

        if (t === 0 || t === 1) this._updateType01();
        if (t === 2)            this._updateType2();
        if (t === 3)            this._updateType3();
        if (t === 4)            this._updateType4();
        if (t === 4.5)          this._updateType45();
        if (t === 5)            this._updateType5();
        if (t === 6)            this._updateType6();
        if (t === 7)            this._updateType7();
        if (t === 8)            this._updateType8();
    }

    _updateType01() {
        this._timer++;
        if (this._timer === 3) {          // 3 frames a 30fps
            if (this._count < 6) {
                this._createFire(this._type);
                this._timer = 0;
                this._count++;
            } else {
                if (this._type === 1) {
                    this._fires.forEach(f => { f._lenSpeed = 10; });
                }
                this._destroy();
            }
        }
    }

    _updateType2() {
        this._timer++;
        if (this._timer === 6) {          // 3*2
            if (this._count < 6) {
                const fire = this._createFire(2);
                fire._place      = this._offset + (this._count * 60);
                fire._len        = 40;
                if (this._dir === -1) fire._placeSpeed = -2;
                this._timer = 0;
                this._count++;
            } else {
                this._fires.forEach(f => f.activate());
                this._destroy();
            }
        }
    }

    _updateType3() {
        this._timer++;
        if (this._timer === 6) {          // 3*2
            if (this._count < 6) {
                const fire = this._createFire(3);
                fire._place      = this._offset + (this._count * 60);
                fire._len        = 40;
                if (this._dir === -1) fire._placeSpeed = -2;
                this._timer = 0;
                this._count++;
            } else {
                this._fires.forEach(f => f.activate());
                this._destroy();
            }
        }
    }

    _updateType4() {
        this._fires.forEach(f => { f.alpha = f.alpha === 1 ? 0 : 1; });

        this._timer++;
        if (this._timer === 2 && this._con2 === 0) {  // 1*2
            if (this._count < 6) {
                const fire = this._createFire(4);
                fire._place      = this._offset + (this._count * 60);
                fire._len        = 50;
                fire._placeSpeed = 0;
                this._timer = 0;
                this._count++;
            } else {
                this._fires.forEach(f => f.activate());
                this._con2 = 1;
            }
        }

        if (this._timer === 32) {         // 16*2
            this._fires.forEach(f => { f.alpha = 1; });
            this._destroy();
        }
    }

    _updateType45() {
        this._fires.forEach(f => { f.alpha = f.alpha === 1 ? 0 : 1; });

        this._timer++;
        if (this._timer === 2 && this._con2 === 0) {  // 1*2
            if (this._count < 6) {
                const fire = this._createFire(4.5);
                fire._place      = this._offset + (this._count * 60);
                fire._len        = 50;
                fire._placeSpeed = 0;
                this._timer = 0;
                this._count++;
            } else {
                this._fires.forEach(f => f.activate());
                this._con2 = 1;
            }
        }

        if (this._timer === 42) {         // 21*2
            this._fires.forEach(f => { f.alpha = 1; });
            this._destroy();
        }
    }

    _updateType5() {
        this._fires.forEach(f => { f.alpha = f.alpha === 1 ? 0 : 1; });

        this._timer++;
        if (this._timer === 4 && this._con2 === 0) {  // 2*2
            if (this._count < 6) {
                const fire = this._createFire(5);
                fire._place      = this._offset + (this._count * 60);
                fire._len        = 50;
                fire._placeSpeed = 0;
                this._timer = 0;
                this._count++;
            } else {
                this._fires.forEach(f => f.activate());
                this._con2 = 1;
            }
        }

        if (this._timer === 20) {         // 10*2
            this._fires.forEach(f => { f.alpha = 1; });
            this._destroy();
        }
    }

    _updateType6() {
        this._fireballTimer++;

        if (this._fireballTimer > 60 && this._fireballCount < 3) {  // 30*2
            for (let i = 0; i < 6; i++) {
                const dir = (i * 60) + (this._totalCount * 5);
                const fb  = new ShadowMantleFire3(
                    this.scene, this._boss.x + 16, this._boss.y + 16,
                    { direction: dir, speed: 2, gravity: 0.2333, activetimer: 40 }  // activetimer*2
                );
                this.scene.bossBullets.add(fb); fb.init();
            }
            this._fireballCount++;
            this._totalCount++;
            this._fireballTimer -= 4;     // 2*2
        }

        if (this._fireballTimer >= 80) this._destroy();  // 40*2
    }

    _updateType7() {
        this._fireballTimer++;

        if (this._fireballTimer > 60 && this._fireballCount < 3) {  // 30*2
            for (let i = 0; i < 6; i++) {
                const dir = (i * 60) + (this._totalCount * 5);
                const fb  = new ShadowMantleFire3(
                    this.scene, this._boss.x + 16, this._boss.y + 16,
                    { direction: dir, speed: 2, gravity: 0.3667, activetimer: 36 }  // 18*2
                );
                this.scene.bossBullets.add(fb); fb.init();
            }
            this._fireballCount++;
            this._totalCount++;
            this._fireballTimer -= 4;     // 2*2
        }

        if (this._fireballTimer >= 80) this._destroy();  // 40*2
    }

    _updateType8() {
        // GML: spin_a += 0.5 a 30fps → 0.25 a 60fps
        this._spinA      += 0.25;
        this._spinSpeed   = 1.6 + (Math.sin(this._spinA / 6) * 1.2);
        if (this._spinSpeed < 1.5) this._spinSpeed = 1.5;
        // GML: angle += spin_speed a 30fps → *= 0.5 a 60fps
        this._angle      += this._spinSpeed * 1;

        // GML: spin_a == 40 || 100 || 70 a 30fps → 20 || 50 || 35 a 60fps
        if (this._spinA === 20 || this._spinA === 50 || this._spinA === 35) {
            const pos  = this._getRandomValidPos();
            const bomb = new ShadowMantleBomb(this.scene, this._boss.x, this._boss.y, pos.x, pos.y);
            this.scene.bossBullets.add(bomb);
        }

        this._fireballTimer++;

        // GML: fireballtimer > 30 a 30fps → > 60 a 60fps
        if (this._fireballTimer > 60 && this._fireballCount < 50) {
            for (let i = 0; i < 3; i++) {
                // GML: 3 bolas separadas 120°, rotando con _angle
                const dir = (i * 120) + this._angle;
                const fb  = new ShadowMantleFire3(
                    this.scene,
                    this._boss.x + Math.cos(Phaser.Math.DegToRad(dir)) * 24,
                    this._boss.y + Math.sin(Phaser.Math.DegToRad(dir)) * 24,
                    {
                        direction:   dir,
                        speed:       0,
                        gravity:     0.7,   // GML: gravity = 0.7, gravity_direction = dir (misma dirección)
                        activetimer: 20,    // GML: activetimer = 10 * 2 = 20 a 60fps
                        type:        1
                    }
                );
                this.scene.bossBullets.add(fb); fb.init();
            }
            this._fireballCount++;
            this._fireballTimer -= 5;       // GML: -= 4 * 2 = 8 a 60fps
        }

        // GML: fireballtimer >= 32 a 30fps → 64 a 60fps
        if (this._fireballTimer >= 64) this._destroy();
    }

    // ─────────────────────────────────────────────────────────
    // Devuelve una posición válida dentro del mapa (sin paredes
    // y lejos del jugador), igual que _spawnBomb en ShadowMantle
    // ─────────────────────────────────────────────────────────
    _getRandomValidPos() {
        const TILE = 36;
        const candidates = [];

        for (let col = 1; col <= 10; col++) {
            for (let row = 2; row <= 7; row++) {
                const cx = col * TILE + TILE / 2;
                const cy = row * TILE + TILE / 2;
                if (this.scene.wallsLayer) {
                    const tile = this.scene.wallsLayer.getTileAtWorldXY(cx, cy);
                    if (tile && tile.collides) continue;
                }
                candidates.push({ x: cx, y: cy });
            }
        }

        const player = this.scene.player;
        const valid  = candidates.filter(c =>
            Phaser.Math.Distance.Between(c.x, c.y, player.x, player.y) >= 50
        );

        const pool = valid.length > 0 ? valid : candidates;
        return pool[Phaser.Math.Between(0, pool.length - 1)];
    }

    _createFire(type) {
        const fire = new ShadowMantleFire(
            this.scene,
            this._boss.x, this._boss.y,
            this._boss, type
        );
        // Ángulo inicial separado para que formen el círculo visible desde el inicio
        fire._place = this._offset + (this._count * 60) + (6 * this._count);
        this.scene.bossBullets.add(fire);
        this._fires.push(fire);
        return fire;
    }

    _destroy() {
        this.isDead = true;
        // Eliminar de la lista de la escena
        const idx = this.scene.fireControllers.indexOf(this);
        if (idx !== -1) this.scene.fireControllers.splice(idx, 1);
    }
}