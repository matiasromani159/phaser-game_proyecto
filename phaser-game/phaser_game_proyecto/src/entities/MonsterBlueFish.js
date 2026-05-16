import MonsterBase from './MonsterBase.js';

const CELL          = 32;
const SPD_WALK      = 1;
const SPD_DASH      = 8;
const DASH_COOLDOWN = 20;
const HURT_DURATION = 300;

export default class MonsterBlueFish extends MonsterBase {

    constructor(scene, x, y) {
        super(scene, x, y, 'bluefish_r_0');

        this.setOrigin(0, 0);
        this.setScale(2.25);
        this.body.setSize(16, 16);

        this.hp = 20;

        this.movedir       = Phaser.Math.Between(0, 3);
        this.moveType      = 'walk';
        this.moving        = false;
        this._remaining    = 0;
        this._dashCooldown = 0;

        this._lastHitTime = 0;
        this._isHurting   = false;
        this._hurtTimer   = 0;
        this._hurtEvent   = null;

        this._hurtSprite = scene.add.sprite(this.x, this.y, 'bluefish_r_0');
        this._hurtSprite.setOrigin(0, 0);
        this._hurtSprite.setScale(2.25);
        this._hurtSprite.setTintFill(0xffffff);
        this._hurtSprite.setAlpha(0);
        this._hurtSprite.setDepth(this.depth + 1);

        this.x = Math.floor(x / CELL) * CELL;
        this.y = Math.floor(y / CELL) * CELL;

        this._playAnim();
    }

    _playAnim() {
        const dirMap = { 0: 'r', 1: 'u', 2: 'l', 3: 'd' };
        const key = `bluefish-${dirMap[this.movedir]}`;
        this.play(key, true);
        if (this._hurtSprite) this._hurtSprite.play(key, true);
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

        if (this._hurtSprite) {
            this._hurtSprite.setPosition(this.x, this.y);
            this._hurtSprite.setDepth(this.depth + 1);
        }

        if (this._isHurting) return;

        if (this._dashCooldown > 0) { this._dashCooldown--; return; }

        if (this.moving) {
            this._stepMove();
        } else {
            this._decideNextMove(player);
        }

        this._playAnim();
    }

    _stepMove() {
        const spd  = this.moveType === 'dash' ? SPD_DASH : SPD_WALK;
        const step = Math.min(spd, this._remaining);
        this._remaining -= step;

        const delta = { 0: [step, 0], 1: [0, -step], 2: [-step, 0], 3: [0, step] };
        const [dx, dy] = delta[this.movedir];
        this.x += dx;
        this.y += dy;

        const bounds = this.scene.physics.world.bounds;
        const salioBounds =
            this.x < bounds.x || this.x > bounds.right ||
            this.y < bounds.y || this.y > bounds.bottom;

        if (salioBounds || this._isSolidAt(this.x + CELL / 2, this.y + CELL / 2)) {
            this.x -= dx;
            this.y -= dy;
            this.x = Math.round(this.x / CELL) * CELL;
            this.y = Math.round(this.y / CELL) * CELL;
            this.moving        = false;
            this.moveType      = 'walk';
            this._dashCooldown = DASH_COOLDOWN;
            this._remaining    = 0;
            return;
        }

        if (this._remaining <= 0) {
            this.x = Math.round(this.x / CELL) * CELL;
            this.y = Math.round(this.y / CELL) * CELL;
            this.moving = false;
            if (this.moveType === 'dash') {
                this.moveType      = 'walk';
                this._dashCooldown = DASH_COOLDOWN;
            }
        }
    }

    _decideNextMove(player) {
        if (!player) { this._startWalk(); return; }

        const myCol = Math.floor(this.x / CELL);
        const myRow = Math.floor(this.y / CELL);
        const plCol = Math.floor(player.x / CELL);
        const plRow = Math.floor(player.y / CELL);

        if (myRow === plRow) {
            const dir = player.x > this.x ? 0 : 2;
            if (this._canDash(dir, player)) { this._startDash(dir); return; }
        } else if (myCol === plCol) {
            const dir = player.y > this.y ? 3 : 1;
            if (this._canDash(dir, player)) { this._startDash(dir); return; }
        }

        this._startWalk();
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
        return this._isSolidAt(this.x + dx + CELL / 2, this.y + dy + CELL / 2);
    }

    _canDash(dir, player) {
        const myCol = Math.floor(this.x / CELL);
        const myRow = Math.floor(this.y / CELL);
        const plCol = Math.floor(player.x / CELL);
        const plRow = Math.floor(player.y / CELL);

        if (dir === 0) {
            for (let c = myCol + 1; c <= plCol; c++)
                if (this._isSolidAt(c * CELL + CELL / 2, this.y + CELL / 2)) return false;
        } else if (dir === 2) {
            for (let c = myCol - 1; c >= plCol; c--)
                if (this._isSolidAt(c * CELL + CELL / 2, this.y + CELL / 2)) return false;
        } else if (dir === 3) {
            for (let r = myRow + 1; r <= plRow; r++)
                if (this._isSolidAt(this.x + CELL / 2, r * CELL + CELL / 2)) return false;
        } else if (dir === 1) {
            for (let r = myRow - 1; r >= plRow; r--)
                if (this._isSolidAt(this.x + CELL / 2, r * CELL + CELL / 2)) return false;
        }
        return true;
    }

    _startWalk() {
        let intentos = 4;
        while (intentos-- > 0 && this._wallAhead(this.movedir))
            this.movedir = (this.movedir + 1) % 4;
        this.moveType   = 'walk';
        this._remaining = CELL;
        this.moving     = true;
    }

    _startDash(dir) {
        this.movedir    = dir;
        this.moveType   = 'dash';
        this._remaining = CELL;
        this.moving     = true;
        const dirMap = { 0: 'r', 1: 'u', 2: 'l', 3: 'd' };
        const tex = `bluefish_${dirMap[dir]}_1`;
        this.setTexture(tex);
        if (this._hurtSprite) this._hurtSprite.setTexture(tex);
    }

    // ── Sobreescribe solo la animación de muerte ──────────────
    _playDieAnim() {
        if (this._hurtEvent) { this._hurtEvent.remove(); this._hurtEvent = null; }
        if (this._hurtSprite) { this._hurtSprite.destroy(); this._hurtSprite = null; }
        this.clearTint();
        this.alpha = 1;

        const dieAnim = this.scene.anims.exists('bluefish-die') ? 'bluefish-die' : 'monster-die';
        this.play(dieAnim);
        this.once('animationcomplete', () => this.destroy());
    }

    destroy(fromScene) {
        if (this._hurtEvent) { this._hurtEvent.remove(); this._hurtEvent = null; }
        if (this._hurtSprite) { this._hurtSprite.destroy(); this._hurtSprite = null; }
        super.destroy(fromScene);
    }
}