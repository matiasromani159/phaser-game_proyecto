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
        this._spinA      += 0.25;         // 0.5/2
        this._spinSpeed   = 1.6 + (Math.sin(this._spinA / 6) * 1.2);
        if (this._spinSpeed < 1.5) this._spinSpeed = 1.5;
        this._angle      += this._spinSpeed * 0.5;  // /2

        // Bombas en spinA equivalente a 40 y 100 a 30fps → 20 y 50 a 60fps
        if (this._spinA === 20 || this._spinA === 50) {
            const tx = 160 + Phaser.Math.Between(0,9) * 32;
            const ty = 96  + Phaser.Math.Between(0,4) * 32;
            const bomb = new ShadowMantleBomb(this.scene, this._boss.x+16, this._boss.y+16, tx, ty);
            this.scene.bossBullets.add(bomb);
        }

        if (this._spinA === 35) {         // 70/2
            const bomb = new ShadowMantleBomb(
                this.scene, this._boss.x+16, this._boss.y+29,
                464, 160 + Phaser.Math.Between(0,2)*32 + 29
            );
            this.scene.bossBullets.add(bomb);
        }

        this._fireballTimer++;

        if (this._fireballTimer > 60 && this._fireballCount < 50) {  // 30*2
            for (let i = 0; i < 3; i++) {
                const dir = (i * 120) + this._angle;
                const fb  = new ShadowMantleFire3(
                    this.scene,
                    this._boss.x + 16 + Math.cos(Phaser.Math.DegToRad(dir)) * 24,
                    this._boss.y + 16 + Math.sin(Phaser.Math.DegToRad(dir)) * 24,
                    { direction: dir, speed: 0, gravity: 0.7, activetimer: 20, type: 1 }
                );
                this.scene.bossBullets.add(fb); fb.init();
            }
            this._fireballCount++;
            this._fireballTimer -= 8;     // 4*2
        }

        if (this._fireballTimer >= 64) this._destroy();  // 32*2
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