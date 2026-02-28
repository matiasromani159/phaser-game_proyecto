export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        this.load.audio('snd_heartbreak1', '/src/assets/sounds/snd_break1.wav');
        this.load.audio('snd_heartbreak2', '/src/assets/sounds/snd_break2.wav');
        this.load.audio('snd_gameover', '/src/assets/sounds/snd_gameover_short.ogg');
        this.load.audio('snd_txtasg', '/src/assets/sounds/snd_txtasg.wav');

        this.load.image('spr_gameover_bg', '/src/assets/sprites/spr_gameover_bg.png');
        this.load.image('spr_heart', '/src/assets/sprites/spr_heart.png');
        this.load.image('spr_heartbreak', '/src/assets/sprites/spr_heartbreak.png');
        this.load.image('spr_heartshards1', '/src/assets/sprites/spr_heartshards/spr_heartshards_0.png');
        this.load.image('spr_heartshards2', '/src/assets/sprites/spr_heartshards/spr_heartshards_1.png');
        this.load.image('spr_heartshards3', '/src/assets/sprites/spr_heartshards/spr_heartshards_2.png');
        this.load.image('spr_heartshards4', '/src/assets/sprites/spr_heartshards/spr_heartshards_3.png');
    }

    create(data) {
        const cx = this.cameras.main.centerX; // 216
        const cy = this.cameras.main.centerY; // 162

        this.cameras.main.setBackgroundColor('#000000');

        // Corazón — posición del jugador al morir, con fallback al centro
        const heartX = data?.x ?? cx;
        const heartY = data?.y ?? cy;
        this.heart = this.add.sprite(heartX, heartY, 'spr_heart').setScale(1.5);

        this.shards = this.physics.add.group();

        this.break1 = this.sound.add('snd_heartbreak1');
        this.break2 = this.sound.add('snd_heartbreak2');

        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.canRestart = false;

        // Animación corazón roto
        this.time.delayedCall(500, () => {
            this.heart.setTexture('spr_heartbreak');
            this.break1.play();
            this.heart.x -= 2;

            this.time.delayedCall(500, () => {
                this.break2.play();
                this.heart.setVisible(false);
                this.spawnShards();

                this.time.delayedCall(1000, () => {
                    this.showGameOverSprite();
                });
            });
        });
    }

    spawnShards() {
        const shardKeys = [
            'spr_heartshards1',
            'spr_heartshards2',
            'spr_heartshards3',
            'spr_heartshards4'
        ];

        for (let i = 0; i < 6; i++) {
            const shard = this.shards.create(
                this.heart.x,
                this.heart.y,
                Phaser.Utils.Array.GetRandom(shardKeys)
            );
            shard.setScale(2);
            const angle = Phaser.Math.Between(0, 360);
            const speed = 80;
            this.physics.velocityFromAngle(angle, speed, shard.body.velocity);
            shard.body.setGravityY(200);
            shard.body.setAngularVelocity(Phaser.Math.Between(-30, 30));
        }
    }

    showGameOverSprite() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        // Sprite centrado en pantalla
        this.gameoverSprite = this.add.sprite(cx, cy - 20, 'spr_gameover_bg')
            .setOrigin(0.5)
            .setAlpha(0);

        // Escala automática para que quepa en 432px de ancho
        const escala = Math.min(this.cameras.main.width / this.gameoverSprite.width * 0.9, 1);
        this.gameoverSprite.setScale(escala);

        this.gameoverSound = this.sound.add('snd_gameover', { loop: true, volume: 0.5 });
        this.gameoverSound.play();

        this.tweens.add({
            targets: this.gameoverSprite,
            alpha: 1,
            duration: 1000,
            ease: 'Linear'
        });

        // Texto centrado debajo del sprite
        this.showTextLine("La has liado", cx, cy + 90, 50);
    }

    showTextLine(text, x, y, speed = 50) {
        this.textLine = this.add.text(x, y, '', {
            fontFamily: 'UndertaleFont',
            fontSize: '16px',   // reducido para pantalla pequeña
            color: '#ffffff'
        })
        .setOrigin(0.5, 0)     // centrado horizontalmente
        .setResolution(10);

        this.textSound = this.sound.add('snd_txtasg');

        let currentIndex = 0;

        this.textTimer = this.time.addEvent({
            delay: speed,
            loop: true,
            callback: () => {
                if (currentIndex < text.length) {
                    this.textLine.text += text[currentIndex];

                    const char = text[currentIndex];
                    if (!' .,!?:;'.includes(char)) {
                        this.textSound.play();
                    }

                    currentIndex++;
                } else {
                    this.textTimer.remove();
                    this.canRestart = true;
                }
            }
        });
    }

  update() {
    if (this.canRestart && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
        this.canRestart = false;

        // Bajar volumen progresivamente en 1200ms (igual que el fade)
        this.tweens.add({
            targets: this.gameoverSound,
            volume: 0,
            duration: 1200,
            ease: 'Linear',
            onComplete: () => {
                this.gameoverSound.stop();
                this.scene.stop();
                const lastRoom = this.game.registry.get('lastRoom') || 'Room1';
                this.scene.start(lastRoom, { fromGameOver: true });
            }
        });

        // Fade de pantalla al mismo tiempo
        this.cameras.main.fadeOut(1200, 0, 0, 0);
    }
}
}