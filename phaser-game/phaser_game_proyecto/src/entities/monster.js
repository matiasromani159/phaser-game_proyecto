export default class Monster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.setScale(2);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 100;
        this.direction = 1;

        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;

        scene.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.direction *= -1;
                this.flipX = this.direction < 0;
            }
        });
    }

    actualizar() {
        this.setVelocityX(this.speed * this.direction);
    }

    die() {
    // Evitar que muera dos veces
    if (this.isDead) return;
    this.isDead = true;

    // Detener movimiento y colisiones
    this.setVelocity(0, 0);
    this.body.enable = false;

    // Reproducir animación de muerte
    this.play('monster-die');

    // Cuando termine la animación → destruir
    this.once('animationcomplete', () => {
        this.destroy();
    });
}

}
