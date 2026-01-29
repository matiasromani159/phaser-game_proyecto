export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'down0');

        // Agregar a la escena y físicas
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Vida
        this.vida = 100;
        this.vidaMax = 100;

        // Barra de vida dinámica (Graphics)
        this.barra = scene.add.graphics();
        this.barra.setScrollFactor(0); // fija en HUD
        this.barra.setDepth(1);

        // Sprite decorativo encima de la barra
        this.healthBarSprite = scene.add.sprite(20, 20, 'healthbar').setOrigin(0, 0);
        this.healthBarSprite.setScrollFactor(0);
        this.healthBarSprite.setScale(2, 2); // 2x ancho, 2x alto
        this.healthBarSprite.setDepth(0);


        // Movimiento
        this.speed = 150;
        this.lastDir = 'down';
        this.setCollideWorldBounds(true);
        this.setScale(2);

        // Invencibilidad
        this.isInvincible = false;
        this.lastDamageTime = 0;
    }

    update(cursors) {
        // Reiniciar velocidad
        this.setVelocity(0);
        let moving = false;

        // Movimiento horizontal
        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            moving = true;
            this.lastDir = 'left';
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
            moving = true;
            this.lastDir = 'right';
        }

        // Movimiento vertical
        if (cursors.up.isDown) {
            this.setVelocityY(-this.speed);
            moving = true;
            this.lastDir = 'up';
        } else if (cursors.down.isDown) {
            this.setVelocityY(this.speed);
            moving = true;
            this.lastDir = 'down';
        }

        // Normalizar diagonal
        if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
            this.setVelocity(this.body.velocity.x * Math.SQRT1_2,
                             this.body.velocity.y * Math.SQRT1_2);
        }

        // Animaciones
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

        // Actualizar barra de vida
        this.drawHealthBar();
    }

    takeDamage(dano) {
        this.vida -= dano;
        if (this.vida <= 0) {
            this.vida = 0;
            console.log("Jugador muerto");
        }

        // Activar invencibilidad/parpadeo
        this.startInvincibility(1000);
    }

    drawHealthBar() {
        this.barra.clear();

        const offsetX = 32; // esquina superior izquierda
        const offsetY = 30;
        const ancho = 55;
        const alto = 10;

        // Fondo rojo
        this.barra.fillStyle(0xff0000);
        this.barra.fillRect(offsetX, offsetY, ancho, alto);

        // Vida verde proporcional
        let vidaAncho = (this.vida / this.vidaMax) * ancho;
        this.barra.fillStyle(0x00ff00);
        this.barra.fillRect(offsetX, offsetY, vidaAncho, alto);

        // Sprite decorativo se mantiene encima, no cambia
    }

    startInvincibility(duration = 1000) {
        this.isInvincible = true;
        this.alpha = 1;

        // Tween de parpadeo
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            ease: 'Linear',
            duration: 100,
            repeat: duration / 100 / 2 - 1,
            yoyo: true,
            onComplete: () => {
                this.alpha = 1;
                this.isInvincible = false;
            }
        });
    }

}
