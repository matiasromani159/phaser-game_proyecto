export default class Monster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
this.setScale(2);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Velocidad inicial
        this.speed = 100;

        // Dirección: 1 = derecha, -1 = izquierda
        this.direction = 1;

        // Hacer que el enemigo rebote de los bordes del mundo
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;

        // Escuchar colisión con los bordes
        scene.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.direction *= -1; // cambia de dirección
                this.flipX = this.direction < 0; // girar sprite si quieres
            }
        });
    }

    actualizar() {
        this.setVelocityX(this.speed * this.direction);
    }
}
