export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'down0');

        //Vida del jugador
        this.vida = 100;
        this.vidaMax = 100;
        this.barra = scene.add.graphics();

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 150;
        this.lastDir = 'down';

        this.setCollideWorldBounds(true);

        this.setScale(2);
    }

   update(cursors) {
    // Reiniciar la velocidad
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

    // Normalizar velocidad diagonal
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
        this.setVelocity(this.body.velocity.x * Math.SQRT1_2, this.body.velocity.y * Math.SQRT1_2);
    }

    // Animaciones
    if (moving) {
        if (this.body.velocity.x < 0) this.anims.play('walk-left', true);
        else if (this.body.velocity.x > 0) this.anims.play('walk-right', true);
        else if (this.body.velocity.y < 0) this.anims.play('walk-up', true);
        else if (this.body.velocity.y > 0) this.anims.play('walk-down', true);
    } else {
        // IDLE
        this.anims.stop();
        switch (this.lastDir) {
            case 'down': this.setTexture('down0'); break;
            case 'up': this.setTexture('up0'); break;
            case 'left': this.setTexture('left0'); break;
            case 'right': this.setTexture('right0'); break;
        }
    }
    this.drawHealthBar();

}

takeDamage(dano) {
    this.vida -= dano;
    if (this.vida <= 0) {
        this.vida = 0;
        console.log("Jugador muerto");
        // Aquí puedes reiniciar el juego, mostrar game over, etc.
    }
}

drawHealthBar() {
    this.barra.clear();

    const offsetX = 20; // desde el borde izquierdo
    const offsetY = 20; // desde el borde superior
    const ancho = 200; // ancho de la barra
    const alto = 20;   // alto de la barra

    // Fondo rojo
    this.barra.fillStyle(0xff0000);
    this.barra.fillRect(offsetX, offsetY, ancho, alto);

    // Vida verde proporcional
    let vidaAncho = (this.vida / this.vidaMax) * ancho;
    this.barra.fillStyle(0x00ff00);
    this.barra.fillRect(offsetX, offsetY, vidaAncho, alto);
}


startInvincibility(duration = 1000) {
    this.isInvincible = true; // indicador de invulnerabilidad
    this.alpha = 1;

    // Tween de parpadeo
    this.scene.tweens.add({
        targets: this,
        alpha: 0, // desaparece
        ease: 'Linear',
        duration: 100,
        repeat: duration / 100 / 2 - 1, // parpadeos durante el tiempo
        yoyo: true,
        onComplete: () => {
            this.alpha = 1;
            this.isInvincible = false;
        }
    });
}

}
