export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'down0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.vida    = 100;
        this.vidaMax = 100;

        // Barra de vida
        this.barra = scene.add.graphics();
        this.barra.setScrollFactor(0);
        this.barra.setDepth(1);
        this.healthBarSprite = scene.add
            .sprite(20, 20, 'healthbar')
            .setOrigin(0, 0).setScrollFactor(0).setScale(2).setDepth(0);

        this.speed   = 150;
        this.lastDir = 'down';
        this.setCollideWorldBounds(true);
        this.setScale(2.25);

        // Origin base del sprite idle (16x16 centrado)
        this.setOrigin(0.5, 0.5);

        // Body fijo: 16x16 pre-escala (= 36x36 en pantalla con scale 2.25)
        // El offset varía según la dirección de ataque — ver _setBodyForDir()
        this._setBodyForDir('down');

        // ── Invencibilidad ────────────────────────────────────
        this.isInvincible   = false;
        this.lastDamageTime = 0;

        // ── Knockback ─────────────────────────────────────────
        this.isKnockedBack = false;

        // ── Ataque ────────────────────────────────────────────
        this.swordbuffer  = 0;
        this.swordfacing  = 'down';
        this.isAttacking  = false;

        // Posición anclada al iniciar el ataque
        this._attackLockX = 0;
        this._attackLockY = 0;

        // Hitbox de ataque
        this.attackHitbox = scene.add.rectangle(x, y, 20, 20, 0xff0000, 0).setOrigin(0.5);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.enable = false;

        // ── Muerte ────────────────────────────────────────────
        this.isDead = false;
    }

    // ─────────────────────────────────────────────────────────
    // BODY FIJO POR DIRECCIÓN
    //
    // Phaser posiciona el body desde el top-left del sprite.
    // El sprite idle es 16x16 → Kris siempre ocupa esos 16x16.
    // En los sprites de ataque Kris ocupa una mitad del canvas:
    //
    //   right 32x16 origin(0.25,0.5): Kris en x[0..15]  → offset (0,  0)
    //   left  32x16 origin(0.75,0.5): Kris en x[16..31] → offset (16, 0)
    //   down  16x32 origin(0.5,0.25): Kris en y[0..15]  → offset (0,  0)
    //   up    16x32 origin(0.5,0.75): Kris en y[16..31] → offset (0,  16)
    // ─────────────────────────────────────────────────────────
    _setBodyForDir(dir) {
        switch (dir) {
            case 'left':  this.setBodySize(16, 16); this.setOffset(16, 0);  break;
            case 'up':    this.setBodySize(16, 16); this.setOffset(0,  16); break;
            default:      this.setBodySize(16, 16); this.setOffset(0,  0);  break;
            // 'right', 'down', 'idle' → offset (0, 0)
        }
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────
    update(cursors) {
        if (this.isDead) return;

        if (this.swordbuffer > 0) {
            this._tickSword(cursors);
        }

        if (this.isKnockedBack || this.isAttacking) {
            if (this.isAttacking) {
                this.setVelocity(0);
                this.x = this._attackLockX;
                this.y = this._attackLockY;
                this._moverHitbox(this.swordfacing);
            }
            this.drawHealthBar();
            return;
        }

        // ── Movimiento libre ──────────────────────────────────
        this.setOrigin(0.5, 0.5);
        this._setBodyForDir('idle');

        this.setVelocity(0);
        let moving = false;

        if (cursors.left.isDown)       { this.setVelocityX(-this.speed); moving = true; this.lastDir = 'left'; }
        else if (cursors.right.isDown) { this.setVelocityX( this.speed); moving = true; this.lastDir = 'right'; }

        if (cursors.up.isDown)         { this.setVelocityY(-this.speed); moving = true; this.lastDir = 'up'; }
        else if (cursors.down.isDown)  { this.setVelocityY( this.speed); moving = true; this.lastDir = 'down'; }

        // Normalizar diagonal
        if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
            this.setVelocity(
                this.body.velocity.x * Math.SQRT1_2,
                this.body.velocity.y * Math.SQRT1_2
            );
        }

        if (moving) {
            if      (this.body.velocity.x < 0) this.anims.play('walk-left',  true);
            else if (this.body.velocity.x > 0) this.anims.play('walk-right', true);
            else if (this.body.velocity.y < 0) this.anims.play('walk-up',    true);
            else if (this.body.velocity.y > 0) this.anims.play('walk-down',  true);
        } else {
            this.anims.stop();
            this._setIdleTexture(this.lastDir);
        }

        this.drawHealthBar();
    }

    // ─────────────────────────────────────────────────────────
    // TICK DEL SWORD BUFFER (60fps = GML x2)
    // ─────────────────────────────────────────────────────────
    _tickSword(cursors) {
        this.swordbuffer--;

        const REDIRECT_FRAMES = [14, 12, 10, 8, 0];
        const canRedirect = REDIRECT_FRAMES.includes(this.swordbuffer);

        if (canRedirect) {
            if      (cursors.down.isDown)  this.swordfacing = 'down';
            else if (cursors.up.isDown)    this.swordfacing = 'up';
            else if (cursors.right.isDown) this.swordfacing = 'right';
            else if (cursors.left.isDown)  this.swordfacing = 'left';
        }

        this.lastDir = this.swordfacing;

        // Sprite frame según buffer
        let frameIdx;
        if      (this.swordbuffer >= 12) frameIdx = 0;
        else if (this.swordbuffer >= 6)  frameIdx = 1;
        else if (this.swordbuffer >= 4)  frameIdx = 2;
        else                             frameIdx = 0;

        this._setAttackTexture(this.swordfacing, frameIdx);

        // Crear hitbox en frame 12 (= GML frame 6)
       // Crear hitbox en frame 12 solo si no hay pared delante
if (this.swordbuffer === 12) {
    if (!this._hayParedEnfrente(this.swordfacing)) {
        this._activarHitbox(this.swordfacing);
    }
}



        if (canRedirect && this.swordbuffer !== 12) {
            this._moverHitbox(this.swordfacing);
        }

        // Fin del ataque
        if (this.swordbuffer === 0) {
            this._desactivarHitbox();
            this.isAttacking = false;
            this.setOrigin(0.5, 0.5);
            this._setIdleTexture(this.lastDir);
        }
    }

    _hayParedEnfrente(dir) {
    if (!this.scene.wallsLayer) return false;

    const DIST = 20; // px hacia delante para comprobar
    const offsets = {
        right: { x:  DIST, y: 0     },
        left:  { x: -DIST, y: 0     },
        down:  { x: 0,     y:  DIST },
        up:    { x: 0,     y: -DIST },
    };

    const off  = offsets[dir];
    const tile = this.scene.wallsLayer.getTileAtWorldXY(
        this.x + off.x,
        this.y + off.y
    );

    return tile && tile.collides;
}

    // ─────────────────────────────────────────────────────────
    // TEXTURA DE ATAQUE CON ORIGIN Y BODY AJUSTADOS
    // ─────────────────────────────────────────────────────────
    _setAttackTexture(dir, frameIdx) {
        this.setTexture(`${dir}Attack${frameIdx}`);
        switch (dir) {
            case 'right': this.setOrigin(0.25, 0.5);  break;
            case 'left':  this.setOrigin(0.75, 0.5);  break;
            case 'down':  this.setOrigin(0.5,  0.25); break;
            case 'up':    this.setOrigin(0.5,  0.75); break;
        }
        // Restaurar body correcto para esta dirección
        // (Phaser lo resetea al cambiar la textura)
        this._setBodyForDir(dir);
    }

    // ─────────────────────────────────────────────────────────
    // INICIAR ATAQUE
    // ─────────────────────────────────────────────────────────
    attack() {
        if (this.isAttacking || this.isKnockedBack || this.isDead) return;

        this.isAttacking  = true;
        this.swordbuffer  = 16;
        this.swordfacing  = this.lastDir;

        this._attackLockX = this.x;
        this._attackLockY = this.y;

        if (this.scene.attackSound) this.scene.attackSound.play();
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS DEL HITBOX DE ATAQUE
    // ─────────────────────────────────────────────────────────
    _hitboxConfig(dir) {
        const BASE = 36;
        switch (dir) {
            case 'right': return { w: BASE, h: 28, ox:  BASE, oy: 0     };
            case 'left':  return { w: BASE, h: 28, ox: -BASE, oy: 0     };
            case 'down':  return { w: 28,   h: BASE, ox: 0,   oy:  BASE };
            case 'up':    return { w: 28,   h: BASE, ox: 0,   oy: -BASE };
            default:      return { w: BASE, h: BASE, ox: 0,   oy: 0     };
        }
    }

    _activarHitbox(dir) {
        const cfg = this._hitboxConfig(dir);
        this.attackHitbox.setSize(cfg.w, cfg.h);
        this.attackHitbox.body.setSize(cfg.w, cfg.h);
        this.attackHitbox.body.enable = true;
        this._moverHitbox(dir);
    }

    _moverHitbox(dir) {
        const cfg = this._hitboxConfig(dir);
        this.attackHitbox.x = this._attackLockX + cfg.ox;
        this.attackHitbox.y = this._attackLockY + cfg.oy;
        this.attackHitbox.setSize(cfg.w, cfg.h);
        this.attackHitbox.body.setSize(cfg.w, cfg.h);
    }

    _desactivarHitbox() {
        this.attackHitbox.body.enable = false;
    }

    // ─────────────────────────────────────────────────────────
    // DAÑO Y MUERTE
    // ─────────────────────────────────────────────────────────
    takeDamage(dano) {
        if (this.isDead || this.isInvincible) return;

        this.vida -= dano;

        if (this.vida <= 0) {
            this.vida = 0;
            this.die();
            return;
        }

        this.startInvincibility(1000);
    }

    die() {
        this.isDead        = true;
        this.isKnockedBack = false;
        this.isAttacking   = false;
        this.swordbuffer   = 0;

        this.setVelocity(0);
        this.body.enable = false;
        this._desactivarHitbox();
        this.setOrigin(0.5, 0.5);

        this.anims.stop();
        this._setIdleTexture('down');

        this.scene.playerDied();
    }

    // ─────────────────────────────────────────────────────────
    // INVENCIBILIDAD
    // ─────────────────────────────────────────────────────────
    startInvincibility(duration = 1000) {
        this.isInvincible = true;
        this.alpha = 1;
        this.scene.tweens.add({
            targets : this,
            alpha   : 0,
            ease    : 'Linear',
            duration: 100,
            repeat  : duration / 100 / 2 - 1,
            yoyo    : true,
            onComplete: () => { this.alpha = 1; this.isInvincible = false; }
        });
    }

    // ─────────────────────────────────────────────────────────
    // HUD
    // ─────────────────────────────────────────────────────────
    drawHealthBar() {
        this.barra.clear();
        const offsetX = 32, offsetY = 30, ancho = 55, alto = 10;
        this.barra.fillStyle(0xff0000);
        this.barra.fillRect(offsetX, offsetY, ancho, alto);
        const vidaAncho = (this.vida / this.vidaMax) * ancho;
        this.barra.fillStyle(0x00ff00);
        this.barra.fillRect(offsetX, offsetY, vidaAncho, alto);
    }

    // ─────────────────────────────────────────────────────────
    // HELPER — textura idle
    // ─────────────────────────────────────────────────────────
    _setIdleTexture(dir) {
        switch (dir) {
            case 'down':  this.setTexture('down0');  break;
            case 'up':    this.setTexture('up0');    break;
            case 'left':  this.setTexture('left0');  break;
            case 'right': this.setTexture('right0'); break;
        }
        // Restaurar body idle — offset siempre (0, 0) en idle
        this._setBodyForDir('idle');
    }
}