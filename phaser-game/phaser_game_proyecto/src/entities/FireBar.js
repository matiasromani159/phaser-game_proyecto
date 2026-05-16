export default class FireBar {
    constructor(scene, x, y, { pieces = 5, spacing = 20, speed = 1.5, clockwise = true } = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = clockwise ? speed : -speed;
        this.pieces = [];

        if (!scene.anims.exists('firebar-anim')) {
            scene.anims.create({
                key: 'firebar-anim',
                frames: [
                    { key: 'firebar_0' },
                    { key: 'firebar_1' },
                    { key: 'firebar_2' }
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        // Pieza central fija
        this.center = scene.physics.add.sprite(x, y, 'firebar_0');
        this.center.play('firebar-anim');
        this.center.setDepth(4);
        this.center.setDisplaySize(32, 32);
        this.center.body.allowGravity = false;
        this.center.body.immovable = true;

        for (let i = 0; i < pieces; i++) {
            const piece = scene.physics.add.sprite(x, y, 'firebar_0');
            piece.play('firebar-anim');
            piece.setDepth(4);
            piece.setDisplaySize(32, 32);
            piece.body.allowGravity = false;
            piece.body.immovable = true;
            piece._len = (i + 1) * spacing;
            this.pieces.push(piece);
        }
    }

    update() {
        this.angle += this.speed;
        this.pieces.forEach(piece => {
            const rad = Phaser.Math.DegToRad(this.angle);
            piece.x = this.x + Math.cos(rad) * piece._len;
            piece.y = this.y + Math.sin(rad) * piece._len;
            piece.body.reset(piece.x, piece.y);
        });
    }

    checkPlayerCollision(player, hitSound, knockbackFn) {
        const ahora = this.scene.time.now;
        if (ahora - player.lastDamageTime < 1000) return;

        // Revisar colisión con el centro también
        const distCenter = Phaser.Math.Distance.Between(player.x, player.y, this.center.x, this.center.y);
        if (distCenter < 14) {
            player.takeDamage(10);
            player.lastDamageTime = ahora;
            hitSound.play();
            knockbackFn(player, this.center.x, this.center.y);
            return;
        }

        this.pieces.forEach(piece => {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, piece.x, piece.y);
            if (dist < 14) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;
                hitSound.play();
                knockbackFn(player, piece.x, piece.y);
            }
        });
    }

    destroy() {
        if (this.center) this.center.destroy();
        this.pieces.forEach(p => p.destroy());
        this.pieces = [];
    }
}