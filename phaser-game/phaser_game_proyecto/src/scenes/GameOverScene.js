export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        // Sonidos
        this.load.audio('snd_heartbreak1', '/src/assets/sounds/snd_break1.wav');
        this.load.audio('snd_heartbreak2', '/src/assets/sounds/snd_break2.wav');
        this.load.audio('snd_gameover', '/src/assets/sounds/snd_gameover_short.ogg');
        this.load.audio('snd_txtasg', '/src/assets/sounds/snd_txtasg.wav');

        // Sprites
        this.load.image('spr_gameover_bg', '/src/assets/sprites/spr_gameover_bg.png');
        this.load.image('spr_heart', '/src/assets/sprites/spr_heart.png');
        this.load.image('spr_heartbreak', '/src/assets/sprites/spr_heartbreak.png');
        this.load.image('spr_heartshards1', '/src/assets/sprites/spr_heartshards/spr_heartshards_0.png');
        this.load.image('spr_heartshards2', '/src/assets/sprites/spr_heartshards/spr_heartshards_1.png');
        this.load.image('spr_heartshards3', '/src/assets/sprites/spr_heartshards/spr_heartshards_2.png');
        this.load.image('spr_heartshards4', '/src/assets/sprites/spr_heartshards/spr_heartshards_3.png');
    }

    create(data) {
        this.cameras.main.setBackgroundColor('#000000');

        // Posición del jugador al morir
        const heartX = data?.x ?? this.cameras.main.centerX;
        const heartY = data?.y ?? this.cameras.main.centerY;

        // === Corazón inicial ===
        this.heart = this.add.sprite(heartX, heartY, 'spr_heart').setScale(1.5);

        // Grupo de shards
        this.shards = this.physics.add.group();

        // Sonidos
        this.break1 = this.sound.add('snd_heartbreak1');
        this.break2 = this.sound.add('snd_heartbreak2');

        // Input para reiniciar
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.canRestart = false;

        // === Animación corazón roto y shards ===
        this.time.delayedCall(500, () => {
            this.heart.setTexture('spr_heartbreak');
            this.break1.play();
            this.heart.x -= 2;

            this.time.delayedCall(500, () => {
                this.break2.play();
                this.heart.setVisible(false);
                this.spawnShards();

                // === Sprite GAME OVER con tween ===

                this.time.delayedCall(1000,() =>{
                    this.showGameOverSprite();
                })
                
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
            const speed = 80; // velocidad más lenta
            this.physics.velocityFromAngle(angle, speed, shard.body.velocity);
            shard.body.setGravityY(200);
            shard.body.setAngularVelocity(Phaser.Math.Between(-30, 30));
        }
    }

    showGameOverSprite() {
        // Crear sprite invisible al inicio
        this.gameoverSprite = this.add.sprite(
            this.cameras.main.centerX + 250,
            this.cameras.main.centerY + 40,
            'spr_gameover_bg'
        ).setOrigin(1).setScale(1).setAlpha(0);

        // Sonido GAME OVER en bucle
        this.gameoverSound = this.sound.add('snd_gameover', { loop: true, volume: 0.5 });
        this.gameoverSound.play();

        // Tween: aparición lenta
        this.tweens.add({
            targets: this.gameoverSprite,
            alpha: 1,
            duration: 1000,
            ease: 'Linear'
        });
        // Aparece línea de texto debajo del sprite
        this.showTextLine("Mantén tu determinación", this.cameras.main.centerX - 80, this.cameras.main.centerY + 100, 50);



        // Permitir reiniciar
   
    }

    showTextLine(text, x, y, speed = 50) {
        // speed = milisegundos entre cada letra
        this.textLine = this.add.text(x, y, '', {
            fontFamily: 'UndertaleFont', // tu fuente personalizada
            fontSize: '30px',            // tamaño
            color: '#ffffff'              // color
        }).setResolution(10)
        
.setX(x - 50);  ;



        this.textSound = this.sound.add('snd_txtasg');

        let currentIndex = 0;

        // Timer que agrega letra por letra
        this.textTimer = this.time.addEvent({
    delay: speed,
    loop: true,
    callback: () => {
        if (currentIndex < text.length) {
            this.textLine.text += text[currentIndex];

            // Sonido solo si no es espacio ni puntuación
            const char = text[currentIndex];
            if (char !== ' ' && char !== '.' && char !== ',' && char !== '!' && char !== '?' && char !== ':' && char !== ';') {
                this.textSound.play();
            }

            currentIndex++;
        } else {
            // Termina el texto, parar el timer
            this.textTimer.remove();

            // Ahora sí permitir reiniciar
            this.canRestart = true;
        }
    }
});

    }


   update() {
    if (this.canRestart && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
        // Desactivar para evitar spam
        this.canRestart = false;

        // Detener sonido
        if (this.gameoverSound) this.gameoverSound.stop();

        // Fade out antes de cambiar de escena
        this.cameras.main.fadeOut(800, 0, 0, 0); // 800ms

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop();
            this.scene.start('GameScene', { fromGameOver: true });
        });
    }
}

}
