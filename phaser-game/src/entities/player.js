export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'down0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 100;
        this.lastDir = 'down';

        this.setCollideWorldBounds(true);
    }

    update(cursors) {
        this.setVelocity(0);

        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            this.anims.play('walk-left', true);
            this.lastDir = 'left';

        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
            this.anims.play('walk-right', true);
            this.lastDir = 'right';

        } else if (cursors.up.isDown) {
            this.setVelocityY(-this.speed);
            this.anims.play('walk-up', true);
            this.lastDir = 'up';

        } else if (cursors.down.isDown) {
            this.setVelocityY(this.speed);
            this.anims.play('walk-down', true);
            this.lastDir = 'down';

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
    }
}
