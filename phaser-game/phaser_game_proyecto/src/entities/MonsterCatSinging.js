import MonsterBase from './MonsterBase.js';

const CELL          = 32;
const SPD_WALK      = 1;
const HURT_DURATION = 300;
const NOTA_INTERVAL = 350;

export default class MonsterCatSinging extends MonsterBase {

    constructor(scene, x, y) {
        super(scene, x, y, 'cat_singing_0');

        this.setOrigin(0, 0);
        this.setScale(2.25);
        this.body.setSize(16, 16);

        this.hp = 20;

        this.movedir     = Phaser.Math.Between(0, 3);
        this.movecon     = 0;
        this.movetimer   = 0;
        this.updatetimer = 0;

        this.bubbletimer = 0;
        this.direction   = Phaser.Math.Between(0, 359);
        this.aggressive  = true;

        this._lastHitTime = 0;
        this._isHurting   = false;
        this._hurtTimer   = 0;
        this._hurtEvent   = null;

        this._hurtSprite = scene.add.sprite(this.x, this.y, 'cat_singing_hurt_0');
        this._hurtSprite.setOrigin(0, 0);
        this._hurtSprite.setScale(2.25);
        this._hurtSprite.setAlpha(0);
        this._hurtSprite.setDepth(this.depth + 1);

        this.x = Math.floor(x / CELL) * CELL;
        this.y = Math.floor(y / CELL) * CELL;

        this._playAnim();
    }

    _playAnim() {
        this.play('cat-singing', true);
        if (this._hurtSprite) this._hurtSprite.play('cat-singing-hurt', true);
    }

    recibirDaño(cantidad) {
        if (this.isDead) return;

        const ahora = this.scene.time.now;
        if (ahora - this._lastHitTime < HURT_DURATION) return;
        this._lastHitTime = ahora;

        this.hp -= cantidad;
        if (this.hp <= 0) { this.die(); return; }

        this._isHurting = true;
        this.moving     = false;
        this.movecon    = 0;
        this.movetimer  = 0;
        this.setVelocity(0, 0);

        this._hurtTimer = 0;
        if (this._hurtEvent) this._hurtEvent.remove();

        this._hurtEvent = this.scene.time.addEvent({
            delay:  33,
            repeat: Math.floor(HURT_DURATION / 33),
            callback: () => {
                if (!this.active || this.isDead) {
                    if (this._hurtSprite) this._hurtSprite.setAlpha(0);
                    return;
                }
                this._hurtTimer++;
                if (this._hurtSprite)
                    this._hurtSprite.setAlpha(this._hurtTimer % 2 === 0 ? 1 : 0);
            },
            callbackScope: this
        });

        this.scene.time.delayedCall(HURT_DURATION, () => {
            this._isHurting = false;
            if (this._hurtSprite) this._hurtSprite.setAlpha(0);
            if (this._hurtEvent) { this._hurtEvent.remove(); this._hurtEvent = null; }
            if (this.active && !this.isDead) {
                this.x = Math.round(this.x / CELL) * CELL;
                this.y = Math.round(this.y / CELL) * CELL;
            }
        });
    }

    actualizar(player) {
        if (this.isDead) return;

        const delta = this.scene.game.loop.delta;

        if (this._hurtSprite) {
            this._hurtSprite.setPosition(this.x, this.y);
            this._hurtSprite.setDepth(this.depth + 1);
        }

        this._tickNotas(player, delta);

        if (this._isHurting) return;

        this.updatetimer++;
        if (this.updatetimer >= 2) {
            this.updatetimer = 0;
            this._tickMovimiento();
        }

        this._playAnim();
    }

    _tickMovimiento() {
        if (this.movecon === 0) {
            this.movedir = Phaser.Math.Between(0, 3);
            for (let i = 0; i < 4; i++) {
                if (!this._wallAhead(this.movedir)) break;
                this.movedir = (this.movedir + 1) % 4;
            }
            this.movecon = 1;
        }

        if (this.movecon === 1) {
            this.movetimer++;
            for (let i = 0; i < SPD_WALK; i++) {
                const offsets = { 0: [1, 0], 1: [0, -1], 2: [-1, 0], 3: [0, 1] };
                const [dx, dy] = offsets[this.movedir];

                this.x += dx;
                this.y += dy;

                const bounds = this.scene.physics.world.bounds;
                const choca  = this._isSolidAt(this.x + 8, this.y + 8) ||
                               this.x < bounds.x || this.x > bounds.right ||
                               this.y < bounds.y || this.y > bounds.bottom;

                if (choca) {
                    this.x -= dx;
                    this.y -= dy;
                    this.movedir   = (this.movedir + 2) % 4;
                    this.movecon   = 0;
                    this.movetimer = 0;
                    break;
                }

                const snapX = (this.movedir === 0 || this.movedir === 2) && (Math.round(this.x) % CELL === 0);
                const snapY = (this.movedir === 1 || this.movedir === 3) && (Math.round(this.y) % CELL === 0);
                if (snapX || snapY) {
                    this.movecon   = 0;
                    this.movetimer = 0;
                    break;
                }
            }
        }
    }

    _tickNotas(player, delta) {
        if (!this.aggressive || !player) return;
        this.bubbletimer += delta;
        if (this.bubbletimer >= NOTA_INTERVAL) {
            this.bubbletimer = 0;
            this._shootNota();
        }
    }

    _shootNota() {
        if (!this.scene.pellets) return;
        const nota = new CatNote(this.scene, this.x + 16, this.y + 20, this.direction);
        this.scene.pellets.add(nota);
        this.direction = (this.direction + 30) % 360;
        this.scene.sound.play('snd_crowd', { volume: 0.4 });
    }

    _isSolidAt(worldX, worldY) {
        const layer = this.scene.wallsLayer;
        if (!layer) return false;
        const tile = layer.getTileAtWorldXY(worldX, worldY);
        return tile !== null && tile.collides;
    }

    _wallAhead(dir) {
        const offsets = { 0: [CELL, 0], 1: [0, -CELL], 2: [-CELL, 0], 3: [0, CELL] };
        const [dx, dy] = offsets[dir];
        return this._isSolidAt(this.x + dx + 8, this.y + dy + 8);
    }

    // ── Sobreescribe solo la animación de muerte ──────────────
    _playDieAnim() {
        if (this._hurtEvent) { this._hurtEvent.remove(); this._hurtEvent = null; }
        if (this._hurtSprite) { this._hurtSprite.destroy(); this._hurtSprite = null; }

        this.play('monster-die');
        this.once('animationcomplete', () => this.destroy());
    }

    destroy(fromScene) {
        if (this._hurtEvent) { this._hurtEvent.remove(); this._hurtEvent = null; }
        if (this._hurtSprite) { this._hurtSprite.destroy(); this._hurtSprite = null; }
        super.destroy(fromScene);
    }
}

// ─────────────────────────────────────────────────────────────
// CatNote
// ─────────────────────────────────────────────────────────────
class CatNote extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, angleDeg) {
        super(scene, x, y, 'spr_musical_notes');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.allowGravity = false;
        this.body.enable = false;
        this.setScale(1);

        this._savex    = x;
        this._savey    = y;
        this._place    = Phaser.Math.DegToRad(angleDeg);
        this._len      = 20;
        this._lenSpeed = 5;
        this._tickAccum = 0;
        this._TICK_MS   = 100;
        this._maxLife   = 4000;
        this._life      = 0;
    }

    updateColor(delta) {
        this._life += delta;
        if (this._life >= this._maxLife) { this.destroy(); return; }

        this._tickAccum += delta;
        while (this._tickAccum >= this._TICK_MS) {
            this._tickAccum -= this._TICK_MS;
            this._len += this._lenSpeed;
        }

        this.x = this._savex + Math.cos(this._place) * this._len;
        this.y = this._savey + Math.sin(this._place) * this._len;
        this.body.reset(this.x, this.y);
    }
}