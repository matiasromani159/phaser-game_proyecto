export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'down0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.vida = 10;
        this.vidaMax = 100;

        // Barra de vida
        this.barra = scene.add.graphics();
        this.barra.setScrollFactor(0);
        this.barra.setDepth(1);
        this.healthBarSprite = scene.add.sprite(20, 20, 'healthbar').setOrigin(0, 0).setScrollFactor(0).setScale(2).setDepth(0);

        this.speed = 150;
        this.lastDir = 'down';
        this.setCollideWorldBounds(true);
        this.setScale(2);

        // Invencibilidad
        this.isInvincible = false;
        this.lastDamageTime = 0;

        // Ataque
        this.isAttacking = false;

        // Hitbox de ataque
        this.attackHitbox = scene.add.rectangle(this.x, this.y, 30, 30, 0xff0000, 0).setOrigin(0.5);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.enable = false;

        //Muerte
        this.isDead = false;
    }

    update(cursors) {
        if (this.isAttacking) {
            this.setVelocity(0);
            return;
        }

        this.setVelocity(0);
        let moving = false;

        if (cursors.left.isDown) { this.setVelocityX(-this.speed); moving = true; this.lastDir = 'left'; }
        else if (cursors.right.isDown) { this.setVelocityX(this.speed); moving = true; this.lastDir = 'right'; }

        if (cursors.up.isDown) { this.setVelocityY(-this.speed); moving = true; this.lastDir = 'up'; }
        else if (cursors.down.isDown) { this.setVelocityY(this.speed); moving = true; this.lastDir = 'down'; }

        if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
            this.setVelocity(this.body.velocity.x * Math.SQRT1_2, this.body.velocity.y * Math.SQRT1_2);
        }

        if (moving) {
            if (this.body.velocity.x < 0) this.anims.play('walk-left', true);
            else if (this.body.velocity.x > 0) this.anims.play('walk-right', true);
            else if (this.body.velocity.y < 0) this.anims.play('walk-up', true);
            else if (this.body.velocity.y > 0) this.anims.play('walk-down', true);
        } else {
            this.anims.stop();
            switch (this.lastDir) {
                case 'down': this.setTexture('down0'); break;
                case 'up': this.setTexture('up0'); break;
                case 'left': this.setTexture('left0'); break;
                case 'right': this.setTexture('right0'); break;
            }
        }

        this.drawHealthBar();
        if (this.isDead) return;
    }

    attack() {
        if (this.isAttacking) return;
        this.isAttacking = true;

        let animKey, offsetX = 0, offsetY = 0;

        switch (this.lastDir) {
            case 'up': animKey = 'attack-up'; offsetY = -20; break;
            case 'down': animKey = 'attack-down'; offsetY = 20; break;
            case 'left': animKey = 'attack-left'; offsetX = -20; break;
            case 'right': animKey = 'attack-right'; offsetX = 20; break;
        }

        this.anims.play(animKey, true);

        // Activar hitbox en dirección del ataque
        this.attackHitbox.x = this.x + offsetX;
        this.attackHitbox.y = this.y + offsetY;
        this.attackHitbox.body.enable = true;

        // Animación completa
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.isAttacking = false;
            this.attackHitbox.body.enable = false;
            switch (this.lastDir) {
                case 'up': this.setTexture('up0'); break;
                case 'down': this.setTexture('down0'); break;
                case 'left': this.setTexture('left0'); break;
                case 'right': this.setTexture('right0'); break;
            }
        });

        if (this.scene.attackSound) this.scene.attackSound.play();
    }

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
    this.isDead = true;

    // Detener movimiento
    this.setVelocity(0);
    this.body.enable = false;

    // Quitar hitbox de ataque
    this.attackHitbox.body.enable = false;

    // Parar animaciones
    this.anims.stop();
    this.setTexture('down0'); // o sprite de muerte si luego quieres

    // Avisar a la escena
    this.scene.playerDied();
}



    drawHealthBar() {
        this.barra.clear();
        const offsetX = 32, offsetY = 30, ancho = 55, alto = 10;
        this.barra.fillStyle(0xff0000);
        this.barra.fillRect(offsetX, offsetY, ancho, alto);
        let vidaAncho = (this.vida / this.vidaMax) * ancho;
        this.barra.fillStyle(0x00ff00);
        this.barra.fillRect(offsetX, offsetY, vidaAncho, alto);
    }

    startInvincibility(duration = 1000) {
        this.isInvincible = true;
        this.alpha = 1;
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            ease: 'Linear',
            duration: 100,
            repeat: duration / 100 / 2 - 1,
            yoyo: true,
            onComplete: () => { this.alpha = 1; this.isInvincible = false; }
        });
    }
}
